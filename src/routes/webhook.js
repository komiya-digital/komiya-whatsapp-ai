import express from 'express';
import { sendTextMessage, sendPresence } from '../services/wasender.js';
import { processAIService } from '../services/aiService.js';
import { supabaseServer } from '../services/supabaseBackend.js';
import { config } from '../config.js';

const router = express.Router();

// Webhook deduplication set (stores processed message IDs for 10 minutes)
const processedMessageIds = new Set();

/**
 * WASenderAPI Multi-Tenant Production Webhook Receiver
 * Endpoint: POST /api/webhooks/wasender
 */
router.post('/wasender', async (req, res) => {
  // Always acknowledge webhook with HTTP 200 immediately
  res.status(200).json({ status: 'received', timestamp: new Date().toISOString() });

  try {
    const payload = req.body;
    const eventType = payload?.event || 'messages.received';
    console.log(`[WASender Webhook Event]: ${eventType}`);

    const messageData = payload?.data?.messages;
    if (!messageData) {
      return;
    }

    const key = messageData.key || {};
    
    // 1. Ignore messages sent by ourselves (fromMe = true)
    if (key.fromMe) {
      return;
    }

    const messageId = key.id;
    // 2. Deduplicate webhook payloads
    if (messageId && processedMessageIds.has(messageId)) {
      console.log(`[Webhook] Duplicate message ${messageId} ignored.`);
      return;
    }
    if (messageId) {
      processedMessageIds.add(messageId);
      setTimeout(() => processedMessageIds.delete(messageId), 1000 * 60 * 10);
    }

    // 3. Extract sender phone and message text
    const senderPhone = key.cleanedSenderPn || key.cleanedParticipantPn || key.remoteJid;
    const messageText = messageData.messageBody;
    const senderName = messageData.pushName || null;

    if (!senderPhone || !messageText) {
      console.log(`[Webhook] Empty message text from ${senderPhone}, skipping.`);
      return;
    }

    console.log(`[Production WhatsApp Webhook] ${senderPhone}: "${messageText}"`);

    // 4. Identify Session / WhatsApp Connection & Business
    const incomingSessionId = payload?.sessionId || payload?.session_id || payload?.data?.sessionId || null;
    const receiverPhone = payload?.device_id || payload?.phone_number || null;

    let businessId = null;
    let apiKey = config.wasender.apiKey;
    let connection = null;

    if (supabaseServer) {
      // Find matching connection in Supabase
      if (incomingSessionId) {
        const { data } = await supabaseServer
          .from('whatsapp_connections')
          .select('*, businesses(*)')
          .eq('session_id', incomingSessionId.toString())
          .maybeSingle();
        if (data) connection = data;
      }

      if (!connection && receiverPhone) {
        const { data } = await supabaseServer
          .from('whatsapp_connections')
          .select('*, businesses(*)')
          .eq('phone_number', receiverPhone)
          .maybeSingle();
        if (data) connection = data;
      }

      // If still not identified, check if there's only one active connection as fallback
      if (!connection) {
        const { data } = await supabaseServer
          .from('whatsapp_connections')
          .select('*, businesses(*)')
          .eq('is_connected', true)
          .limit(1)
          .maybeSingle();
        if (data) connection = data;
      }

      if (connection) {
        businessId = connection.business_id;
        if (connection.api_key) apiKey = connection.api_key;
      }
    }

    if (!businessId) {
      console.warn(`[Webhook Warning] Could not link incoming message from ${senderPhone} to a registered business. Aborting AI reply to protect multi-tenant isolation.`);
      return;
    }

    // 5. Send presence typing indicator for recipient
    await sendPresence(senderPhone, 'composing', apiKey);

    // 6. Supabase: Find or create Contact for this business
    let contactId = null;
    let currentScore = 0;

    const { data: existingContact } = await supabaseServer
      .from('contacts')
      .select('*')
      .eq('business_id', businessId)
      .eq('whatsapp_number', senderPhone)
      .maybeSingle();

    if (existingContact) {
      contactId = existingContact.id;
      currentScore = existingContact.score || 0;
      await supabaseServer
        .from('contacts')
        .update({
          last_message: messageText,
          last_interaction_at: new Date().toISOString()
        })
        .eq('id', contactId);
    } else {
      const { data: newContact } = await supabaseServer
        .from('contacts')
        .insert({
          business_id: businessId,
          whatsapp_number: senderPhone,
          name: senderName || 'Prospect WhatsApp',
          source: 'WhatsApp Webhook',
          status: 'En conversation',
          score: 10,
          last_message: messageText,
          last_interaction_at: new Date().toISOString()
        })
        .select()
        .single();
      if (newContact) {
        contactId = newContact.id;
        currentScore = 10;
      }
    }

    if (!contactId) return;

    // 7. Supabase: Find or create Conversation for this contact & business
    let conversationId = null;
    let isAiActive = true;

    const { data: existingConv } = await supabaseServer
      .from('conversations')
      .select('*')
      .eq('business_id', businessId)
      .eq('contact_id', contactId)
      .maybeSingle();

    if (existingConv) {
      conversationId = existingConv.id;
      isAiActive = existingConv.is_ai_active ?? true;
      await supabaseServer
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
    } else {
      const { data: newConv } = await supabaseServer
        .from('conversations')
        .insert({
          business_id: businessId,
          contact_id: contactId,
          is_ai_active: true
        })
        .select()
        .single();
      if (newConv) {
        conversationId = newConv.id;
        isAiActive = true;
      }
    }

    if (!conversationId) return;

    // 8. Record inbound message
    await supabaseServer
      .from('messages')
      .insert({
        conversation_id: conversationId,
        direction: 'inbound',
        sender_type: 'user',
        content: messageText
      });

    // 9. If AI is not active for this conversation, don't generate automatic AI response
    if (!isAiActive) {
      console.log(`[Webhook] AI is paused for conversation ${conversationId}. Human agent handover active.`);
      return;
    }

    // 10. Load AI Agent settings & Products specifically for THIS business
    const [agentRes, productsRes, historyRes] = await Promise.all([
      supabaseServer.from('ai_agents').select('*').eq('business_id', businessId).maybeSingle(),
      supabaseServer.from('products').select('*').eq('business_id', businessId).eq('is_available', true),
      supabaseServer.from('messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: false }).limit(6)
    ]);

    const agentConfig = agentRes?.data || {
      name: 'Awa',
      company_description: 'Notre boutique WhatsApp',
      country: 'Côte d\'Ivoire',
      tone: 'Professionnel',
      objective: 'Vendre + qualifier'
    };

    const products = productsRes?.data || [];
    const recentMessages = (historyRes?.data || []).reverse();

    const formattedHistory = recentMessages.slice(0, -1).map(m => ({
      role: m.sender_type === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    // 11. Execute AI Service Pipeline
    const aiResult = await processAIService({
      senderPhone,
      incomingMessage: messageText,
      history: formattedHistory,
      agentConfig,
      products,
      currentScore
    });

    // 12. Send automatic AI reply back to WhatsApp recipient
    if (aiResult?.replyText) {
      await sendTextMessage(senderPhone, aiResult.replyText, apiKey);
      console.log(`[WASender Webhook Reply Sent to ${senderPhone}]: "${aiResult.replyText}"`);

      // 13. Record outbound AI message in Supabase
      await supabaseServer
        .from('messages')
        .insert({
          conversation_id: conversationId,
          direction: 'outbound',
          sender_type: 'ai',
          content: aiResult.replyText
        });

      // 14. Update contact qualification if scored
      if (aiResult.analysis?.newScore !== undefined) {
        const updates = { score: aiResult.analysis.newScore };
        if (aiResult.analysis.isQualified) {
          updates.status = 'Qualifié';
        }
        await supabaseServer
          .from('contacts')
          .update(updates)
          .eq('id', contactId);
      }

      // If handover requested, pause AI for this conversation
      if (aiResult.handoverRequired) {
        await supabaseServer
          .from('conversations')
          .update({ is_ai_active: false })
          .eq('id', conversationId);
      }

      // 15. Record analytics event
      await supabaseServer
        .from('analytics_events')
        .insert({
          business_id: businessId,
          event_type: 'message_sent',
          metric_value: 1,
          metadata_json: { senderPhone, hasAiReply: true }
        }).catch(() => {});
    }

  } catch (error) {
    console.error('[WASender Webhook Error]:', error.message || error);
  }
});

// Backward compatibility alias for /api/webhook
router.post('/', (req, res) => {
  req.url = '/wasender';
  router.handle(req, res);
});

export default router;
