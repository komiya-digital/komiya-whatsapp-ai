import express from 'express';
import { sendTextMessage, sendPresence } from '../services/wasender.js';
import { processAIService } from '../services/aiService.js';
import { config } from '../config.js';

const router = express.Router();

// Webhook deduplication set (stores processed message IDs for 10 minutes)
const processedMessageIds = new Set();

/**
 * WASenderAPI Production Webhook Receiver
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

    // 3. Identify contact & phone number
    const senderPhone = key.cleanedSenderPn || key.cleanedParticipantPn || key.remoteJid;
    const messageText = messageData.messageBody;

    if (!senderPhone || !messageText) {
      console.log(`[Webhook] Empty message text from ${senderPhone}, skipping.`);
      return;
    }

    console.log(`[Production WhatsApp Webhook] ${senderPhone}: "${messageText}"`);

    // 4. Send presence typing indicator
    await sendPresence(senderPhone, 'composing');

    // 5. Execute AI Service Pipeline
    const aiResult = await processAIService({
      senderPhone,
      incomingMessage: messageText,
      history: [],
      agentConfig: {
        name: 'Awa',
        company_description: 'Komiya Commerce - Boutique & Formations',
        country: 'Côte d\'Ivoire',
        tone: 'Professionnel',
        objective: 'Vendre + qualifier'
      },
      products: [],
      currentScore: 0
    });

    // 6. Send automatic AI reply back to WhatsApp recipient
    if (aiResult?.replyText) {
      await sendTextMessage(senderPhone, aiResult.replyText);
      console.log(`[WASender Webhook Reply Sent to ${senderPhone}]: "${aiResult.replyText}"`);
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
