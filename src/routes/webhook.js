import express from 'express';
import { sendTextMessage, sendPresence } from '../services/wasender.js';
import { processAIService } from '../services/aiService.js';
import { supabaseServer, getTenantCommercialContext } from '../services/supabaseBackend.js';
import { tenantRegistry } from '../services/tenantRegistry.js';
import { config } from '../config.js';

const router = express.Router();

// Webhook deduplication set (stores processed message IDs for 10 minutes)
const processedMessageIds = new Set();

/**
 * Extracts normalized message text from various WhatsApp/WASender payload formats
 */
function extractMessageContent(msgObj) {
  if (!msgObj) return '';
  if (typeof msgObj === 'string') return msgObj.trim();

  // Baileys / WASender nested message structures
  const m = msgObj.message || msgObj;
  if (typeof m.conversation === 'string' && m.conversation.trim()) {
    return m.conversation.trim();
  }
  if (typeof m.extendedTextMessage?.text === 'string' && m.extendedTextMessage.text.trim()) {
    return m.extendedTextMessage.text.trim();
  }
  if (typeof m.imageMessage?.caption === 'string' && m.imageMessage.caption.trim()) {
    return m.imageMessage.caption.trim();
  }
  if (typeof m.videoMessage?.caption === 'string' && m.videoMessage.caption.trim()) {
    return m.videoMessage.caption.trim();
  }
  if (typeof m.documentMessage?.caption === 'string' && m.documentMessage.caption.trim()) {
    return m.documentMessage.caption.trim();
  }
  if (typeof m.buttonsResponseMessage?.selectedButtonId === 'string') {
    return m.buttonsResponseMessage.selectedButtonId.trim();
  }
  if (typeof m.listResponseMessage?.singleSelectReply?.selectedRowId === 'string') {
    return m.listResponseMessage.singleSelectReply.selectedRowId.trim();
  }

  // Direct fields
  if (typeof msgObj.messageBody === 'string' && msgObj.messageBody.trim()) {
    return msgObj.messageBody.trim();
  }
  if (typeof msgObj.body === 'string' && msgObj.body.trim()) {
    return msgObj.body.trim();
  }
  if (typeof msgObj.text === 'string' && msgObj.text.trim()) {
    return msgObj.text.trim();
  }
  if (typeof msgObj.content === 'string' && msgObj.content.trim()) {
    return msgObj.content.trim();
  }

  return '';
}

/**
 * Normalizes message data and key from payload
 */
function extractMessageDataAndKey(payload) {
  if (!payload) return { rawMsg: null, key: {} };

  // Case 1: payload.data.messages is an array
  if (Array.isArray(payload?.data?.messages) && payload.data.messages.length > 0) {
    const rawMsg = payload.data.messages[0];
    return { rawMsg, key: rawMsg.key || {} };
  }

  // Case 2: payload.data.messages is a single object
  if (payload?.data?.messages && typeof payload.data.messages === 'object' && !Array.isArray(payload.data.messages)) {
    return { rawMsg: payload.data.messages, key: payload.data.messages.key || {} };
  }

  // Case 3: payload.data has key directly (WASender standard messages.upsert)
  if (payload?.data?.key) {
    return { rawMsg: payload.data, key: payload.data.key };
  }

  // Case 4: payload.data.message has key or content
  if (payload?.data?.message) {
    return { rawMsg: payload.data.message, key: payload.data.key || payload.data.message.key || {} };
  }

  // Case 5: payload.messages array at root
  if (Array.isArray(payload?.messages) && payload.messages.length > 0) {
    const rawMsg = payload.messages[0];
    return { rawMsg, key: rawMsg.key || {} };
  }

  // Case 6: payload.message at root
  if (payload?.message) {
    return { rawMsg: payload.message, key: payload.key || payload.message.key || {} };
  }

  return { rawMsg: payload?.data || payload, key: payload?.data?.key || payload?.key || {} };
}

/**
 * WASenderAPI Multi-Tenant Production Webhook Receiver
 * Endpoint: POST /api/webhooks/wasender (and /api/webhook)
 */
router.post('/wasender', async (req, res) => {
  // Always acknowledge webhook immediately with HTTP 200
  res.status(200).json({ status: 'received', timestamp: new Date().toISOString() });

  try {
    const payload = req.body || {};
    const eventType = payload.event || 'messages.received';
    console.log(`[WASender Webhook Received] Event: ${eventType}`);

    const { rawMsg, key } = extractMessageDataAndKey(payload);

    // 1. Ignore outbound messages sent by the session device itself
    if (key.fromMe || payload.fromMe || rawMsg?.fromMe) {
      console.log('[Webhook] Outbound message (fromMe = true) ignored.');
      return;
    }

    // 2. Ignore WhatsApp group chats and broadcast channels
    const remoteJid = key.remoteJid || payload.remoteJid || rawMsg?.remoteJid || '';
    if (remoteJid.endsWith('@g.us') || remoteJid.endsWith('@broadcast') || remoteJid === 'status@broadcast') {
      console.log(`[Webhook] Group or broadcast message (${remoteJid}) ignored.`);
      return;
    }

    // 3. Deduplicate webhook message IDs
    const messageId = key.id || payload.id || rawMsg?.id;
    if (messageId && processedMessageIds.has(messageId)) {
      console.log(`[Webhook] Duplicate message ${messageId} ignored.`);
      return;
    }
    if (messageId) {
      processedMessageIds.add(messageId);
      setTimeout(() => processedMessageIds.delete(messageId), 1000 * 60 * 10);
    }

    // 4. Extract sender phone and message text
    const rawSender = (
      key.cleanedSenderPn || 
      key.cleanedParticipantPn || 
      key.participant || 
      key.remoteJid || 
      payload.sender || 
      payload.from || 
      payload.data?.from || 
      rawMsg?.from || 
      ''
    );
    const senderPhone = rawSender.replace(/@s\.whatsapp\.net$/, '').trim();
    const messageText = extractMessageContent(rawMsg);
    const senderName = rawMsg?.pushName || payload.pushName || payload.data?.pushName || null;

    if (!senderPhone || !messageText) {
      console.log(`[Webhook] Incomplete message from "${senderPhone}" (text length: ${messageText?.length || 0}). Skipped.`);
      return;
    }

    console.log(`[WhatsApp Incoming] [${senderPhone}] (${senderName || 'Inconnu'}): "${messageText}"`);

    // 5. Extract Session & Business routing parameters
    const candidateSessionIds = [
      req.query?.session,
      req.query?.sessionId,
      req.query?.session_id,
      req.headers['x-session-id'],
      req.headers['x-wasender-session'],
      payload.sessionId,
      payload.session_id,
      payload.session,
      payload.instance_id,
      payload.data?.sessionId,
      payload.data?.session_id,
      payload.data?.session,
      payload.data?.instance_id,
      config.wasender.sessionId
    ].filter(Boolean);

    const queryBusinessId = req.query?.bid || req.query?.business_id || req.query?.businessId || null;

    const candidatePhoneNumbers = [
      req.query?.phone,
      payload.device_id,
      payload.phone_number,
      payload.receiver,
      payload.data?.receiver,
      payload.data?.phone,
      payload.data?.to,
      payload.to
    ].filter(Boolean);

    // 6. Identify Tenant Commercial Context
    const tenantContext = await getTenantCommercialContext({
      sessionId: candidateSessionIds[0] || null,
      candidateSessionIds,
      phoneNumber: candidatePhoneNumbers[0] || null,
      candidatePhoneNumbers,
      businessId: queryBusinessId
    });

    if (!tenantContext || !tenantContext.id) {
      console.warn(`[Webhook Warning] Could not link incoming message from ${senderPhone} to a registered business. (Candidates: ${candidateSessionIds.join(', ')}, Receiver: ${candidatePhoneNumbers.join(', ')}, Query: ${JSON.stringify(req.query)}). Aborting AI reply to protect multi-tenant isolation.`);
      return;
    }

    const businessId = tenantContext.id;
    const businessData = tenantContext.businessData || {};
    const agentConfig = tenantContext.agentConfig || {};
    const products = tenantContext.products || [];
    const faqs = tenantContext.faqs || [];
    const apiKey = tenantContext.apiKey || config.wasender.apiKey;

    console.log(`[Webhook Routed] Business: "${businessData.name || businessId}", Agent: "${agentConfig.name || 'Awa'}", Products: ${products.length}`);

    // 7. Send typing presence indicator
    await sendPresence(senderPhone, 'composing', apiKey);

    // 8. Retrieve or Create Contact CRM record
    let contact = tenantRegistry.getContactCRM(businessId, senderPhone);
    let currentScore = contact?.score || 10;

    if (supabaseServer) {
      try {
        const { data: dbContact } = await supabaseServer
          .from('contacts')
          .select('*')
          .eq('business_id', businessId)
          .eq('whatsapp_number', senderPhone)
          .maybeSingle();

        if (dbContact) {
          contact = dbContact;
          currentScore = dbContact.score || 10;
        } else {
          const { data: newDbContact } = await supabaseServer
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
          if (newDbContact) {
            contact = newDbContact;
            currentScore = 10;
          }
        }
      } catch (cErr) {
        console.warn('[Webhook Note] Supabase contact sync note:', cErr.message);
      }
    }

    // 9. Conversational History (Last 10 turns)
    let formattedHistory = tenantRegistry.getConversationHistory(businessId, senderPhone, 10);

    if (supabaseServer) {
      try {
        // Try fetching conversation history from Supabase if conversation exists
        const { data: conv } = await supabaseServer
          .from('conversations')
          .select('id, is_ai_active')
          .eq('business_id', businessId)
          .eq('contact_id', contact?.id)
          .maybeSingle();

        if (conv?.is_ai_active === false) {
          console.log(`[Webhook] AI is paused for conversation ${conv.id}. Human agent handover active.`);
          return;
        }

        if (conv?.id) {
          const { data: msgs } = await supabaseServer
            .from('messages')
            .select('sender_type, content, created_at')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(10);

          if (Array.isArray(msgs) && msgs.length > 0) {
            formattedHistory = msgs.reverse().map(m => ({
              role: m.sender_type === 'user' ? 'user' : 'model',
              content: m.content
            }));
          }
        }
      } catch (hErr) {
        console.warn('[Webhook Note] Supabase history sync note:', hErr.message);
      }
    }

    // 10. Record incoming user turn
    tenantRegistry.recordMessage(businessId, senderPhone, 'user', messageText);

    // 11. Execute Commercial AI Pipeline
    const aiResult = await processAIService({
      senderPhone,
      incomingMessage: messageText,
      history: formattedHistory,
      agentConfig,
      products,
      businessData,
      faqs,
      contact,
      currentScore
    });

    // 12. Send Automatic Commercial Reply via WASenderAPI
    if (aiResult?.replyText) {
      await sendTextMessage(senderPhone, aiResult.replyText, apiKey);
      console.log(`[WASender Outbound Sent to ${senderPhone}] [Engine: ${aiResult.engine}]: "${aiResult.replyText}"`);

      // 13. Record outgoing AI message in conversation memory
      tenantRegistry.recordMessage(businessId, senderPhone, 'model', aiResult.replyText);

      // 14. Update Contact CRM Profile
      const crmUpdates = {
        last_message: aiResult.replyText,
        last_interaction_at: new Date().toISOString(),
        score: aiResult.analysis?.newScore || currentScore,
        status: aiResult.analysis?.suggestedStatus || 'En conversation'
      };

      if (aiResult.analysis?.detectedNeed) {
        crmUpdates.need = aiResult.analysis.detectedNeed;
      }
      if (aiResult.analysis?.detectedBudget) {
        crmUpdates.budget = aiResult.analysis.detectedBudget;
      }
      if (aiResult.analysis?.matchedProduct?.id) {
        crmUpdates.interested_product_id = aiResult.analysis.matchedProduct.id;
      }

      tenantRegistry.updateContactCRM(businessId, senderPhone, crmUpdates);

      // 15. Sync to Supabase in background
      if (supabaseServer) {
        try {
          if (contact?.id) {
            await supabaseServer
              .from('contacts')
              .update(crmUpdates)
              .eq('id', contact.id);

            // Record in messages table
            const { data: conv } = await supabaseServer
              .from('conversations')
              .select('id')
              .eq('business_id', businessId)
              .eq('contact_id', contact.id)
              .maybeSingle();

            if (conv?.id) {
              await supabaseServer.from('messages').insert([
                { conversation_id: conv.id, direction: 'inbound', sender_type: 'user', content: messageText },
                { conversation_id: conv.id, direction: 'outbound', sender_type: 'ai', content: aiResult.replyText }
              ]);

              if (aiResult.handoverRequired) {
                await supabaseServer
                  .from('conversations')
                  .update({ is_ai_active: false })
                  .eq('id', conv.id);
              }
            }
          }
        } catch (syncErr) {
          console.warn('[Webhook Note] Supabase update sync note:', syncErr.message);
        }
      }
    }

  } catch (error) {
    console.error('[WASender Webhook Fatal Error]:', error.message || error);
  }
});

// Backward compatibility alias for /api/webhook
router.post('/', (req, res) => {
  req.url = '/wasender';
  router.handle(req, res);
});

export default router;
