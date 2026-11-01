import { processAIService } from './aiService.js';

// Simple memory store for lead chat histories
const conversationHistories = new Map();

export async function generateMarketingResponse(phone, incomingMessage, context = {}) {
  let history = conversationHistories.get(phone) || [];

  const result = await processAIService({
    senderPhone: phone,
    incomingMessage,
    history,
    agentConfig: context.agentConfig || {},
    products: context.products || [],
    businessData: context.businessData || {},
    faqs: context.faqs || [],
    currentScore: context.currentScore || 0
  });

  const replyText = result.replyText;

  // Append user & model turns to history
  history.push({ role: 'user', content: incomingMessage });
  history.push({ role: 'model', content: replyText });

  if (history.length > 20) {
    history = history.slice(-20);
  }
  conversationHistories.set(phone, history);

  return replyText;
}
