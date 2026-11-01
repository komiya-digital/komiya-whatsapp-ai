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
    const incomingSessionId = (
      req.query?.session || 
      req.query?.sessionId || 
      payload?.sessionId || 
      payload?.session_id || 
      payload?.session || 
      payload?.data?.sessionId || 
      payload?.data?.session || 
      config.wasender.sessionId || 
      null
    );
    const receiverPhone = (
      req.query?.phone || 
      payload?.device_id || 
      payload?.phone_number || 
      payload?.data?.phone || 
      payload?.data?.receiver || 
      null
    );

    console.log(`[Webhook Details] Sender: ${senderPhone}, Session: ${incomingSessionId}, Receiver: ${receiverPhone}`);

    let businessId = null;
    let apiKey = config.wasender.apiKey;
    let connection = null;
    let businessData = {};

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

      // If still not identified, check if there's an active connection matching current session
      if (!connection && incomingSessionId) {
        const { data } = await supabaseServer
          .from('whatsapp_connections')
          .select('*, businesses(*)')
          .eq('is_connected', true)
          .eq('session_id', incomingSessionId.toString())
          .limit(1)
          .maybeSingle();
        if (data) connection = data;
      }

      if (connection) {
        businessId = connection.business_id;
        if (connection.api_key) apiKey = connection.api_key;
        if (connection.businesses) businessData = connection.businesses;
      }
    }

    if (!businessId) {
      console.warn(`[Webhook Warning] Could not link incoming message from ${senderPhone} to a registered business. Aborting AI reply to protect multi-tenant isolation.`);
      return;
    }

    // Load business metadata if not already populated
    if (supabaseServer && (!businessData.name || !businessData.id)) {
      const { data: bData } = await supabaseServer
        .from('businesses')
        .select('*')
        .eq('id', businessId)
        .maybeSingle();
      if (bData) businessData = bData;
    }

    // 5. Send presence typing indicator for recipient
    await sendPresence(senderPhone, 'composing', apiKey);

    // 6. Supabase: Find or create Contact for this business
    let contactId = null;
    let currentScore = 0;
    let existingContact = null;

    if (supabaseServer) {
      const { data: foundContact } = await supabaseServer
        .from('contacts')
        .select('*')
        .eq('business_id', businessId)
        .eq('whatsapp_number', senderPhone)
        .maybeSingle();

      if (foundContact) {
        existingContact = foundContact;
        contactId = foundContact.id;
        currentScore = foundContact.score || 0;
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
            status: 'Nouveau',
            score: 10,
            last_message: messageText,
            last_interaction_at: new Date().toISOString()
          })
          .select()
          .maybeSingle();
        if (newContact) {
          existingContact = newContact;
          contactId = newContact.id;
          currentScore = 10;
        }
      }
    }

    if (!contactId && supabaseServer) return;

    // 7. Supabase: Find or create Conversation for this contact & business
    let conversationId = null;
    let isAiActive = true;

    if (supabaseServer) {
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
          .maybeSingle();
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
    }

    // 9. If AI is paused for this conversation, don't generate automatic AI response
    if (!isAiActive) {
      console.log(`[Webhook] AI is paused for conversation ${conversationId}. Human agent handover active.`);
      return;
    }

    // 10. Load AI Agent settings, Products, FAQs & Conversation History specifically for THIS business
    let agentConfig = {
      name: 'Awa',
      company_description: businessData.name || 'Notre boutique WhatsApp',
      country: businessData.country || 'Côte d\'Ivoire',
      tone: 'Professionnel et chaleureux',
      objective: 'Conseiller et convertir les prospects'
    };
    let products = [];
    let faqs = [];
    let formattedHistory = [];

    if (supabaseServer) {
      const [agentRes, productsRes, historyRes] = await Promise.all([
        supabaseServer.from('ai_agents').select('*').eq('business_id', businessId).maybeSingle(),
        supabaseServer.from('products').select('*').eq('business_id', businessId).eq('is_available', true),
        supabaseServer.from('messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: false }).limit(10)
      ]);

      if (agentRes?.data) agentConfig = agentRes.data;
      if (productsRes?.data) products = productsRes.data;

      // Load FAQs for these products if available
      if (products.length > 0) {
        const productIds = products.map(p => p.id);
        const { data: faqsData } = await supabaseServer
          .from('product_faqs')
          .select('*')
          .in('product_id', productIds);
        if (faqsData) faqs = faqsData;
      }

      const recentMessages = (historyRes?.data || []).reverse();
      // Skip the last inserted inbound message from history so it is not duplicated
      formattedHistory = recentMessages.slice(0, -1).map(m => ({
        role: m.sender_type === 'user' ? 'user' : 'model',
        content: m.content
      }));
    }

    // 11. Execute Commercial AI Pipeline
    const aiResult = await processAIService({
      senderPhone,
      incomingMessage: messageText,
      history: formattedHistory,
      agentConfig,
      products,
      businessData,
      faqs,
      contact: existingContact,
      currentScore
    });

    // 12. Send automatic AI reply back to WhatsApp recipient
    if (aiResult?.replyText) {
      await sendTextMessage(senderPhone, aiResult.replyText, apiKey);
      console.log(`[WASender Webhook Reply Sent to ${senderPhone}] [Engine: ${aiResult.engine}]: "${aiResult.replyText}"`);

      // 13. Record outbound AI message in Supabase
      if (supabaseServer && conversationId) {
        await supabaseServer
          .from('messages')
          .insert({
            conversation_id: conversationId,
            direction: 'outbound',
            sender_type: 'ai',
            content: aiResult.replyText
          });

        // 14. Update contact CRM profile (qualification, score, detected need & budget)
        if (contactId && aiResult.analysis) {
          const updates = {
            score: aiResult.analysis.newScore,
            status: aiResult.analysis.suggestedStatus || (aiResult.analysis.isQualified ? 'Qualifié' : 'En conversation'),
            last_message: aiResult.replyText,
            last_interaction_at: new Date().toISOString()
          };

          if (aiResult.analysis.detectedNeed) {
            updates.need = aiResult.analysis.detectedNeed;
          }
          if (aiResult.analysis.detectedBudget) {
            updates.budget = aiResult.analysis.detectedBudget;
          }
          if (aiResult.analysis.matchedProduct?.id) {
            updates.interested_product_id = aiResult.analysis.matchedProduct.id;
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

        // 15. Record analytics event securely
        try {
          await supabaseServer
            .from('analytics_events')
            .insert({
              business_id: businessId,
              event_type: 'message_sent',
              metric_value: 1,
              metadata_json: { senderPhone, engine: aiResult.engine, intent: aiResult.analysis?.intent }
            });
        } catch (analyticsErr) {
          console.warn('Analytics event insert note:', analyticsErr.message);
        }
      }
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
