import { GoogleGenAI } from '@google/genai';
import { config } from '../config.js';

// Initialize Gemini SDK
const ai = new GoogleGenAI({ apiKey: config.gemini.apiKey || 'DUMMY_KEY' });

const systemInstruction = `
Vous êtes un Assistant Virtuel d'IA Marketing & Ventes hautement qualifié, opérant sur WhatsApp pour notre entreprise.

Vos objectifs :
1. Saluer chaleureusement le client et engager une conversation fluide, courtoise et professionnelle sur WhatsApp.
2. Comprendre les besoins du prospect, répondre à ses questions sur nos produits/services.
3. Qualifier le prospect (Lead Chaud, Tiède ou Froide) selon ses intérêts et son urgence d'achat.
4. Proposer des recommandations adaptées et encourager une prise de rendez-vous ou un achat.
5. Conserver un ton naturel, direct et adapté au format WhatsApp (messages concis, émojis pertinents, phrases claires).

Consignes strictes :
- Ne générez pas de réponses trop longues ou de longs pavés indigestes.
- Posez 1 question pertinente à la fois pour garder l'engagement.
`;

// Simple memory store for lead chat histories
const conversationHistories = new Map();

export async function generateMarketingResponse(phone, incomingMessage) {
  if (!config.gemini.apiKey || config.gemini.apiKey === 'your_gemini_api_key_here') {
    return "Bonjour ! Merci pour votre message. Notre agent IA sera bientôt disponible. Comment puis-je vous aider aujourd'hui ?";
  }

  try {
    let history = conversationHistories.get(phone) || [];

    // Append new user message
    history.push({
      role: 'user',
      parts: [{ text: incomingMessage }]
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: history,
      config: {
        systemInstruction,
        temperature: 0.7,
        maxOutputTokens: 500,
      }
    });

    const replyText = response.text || "Merci pour votre message ! Un conseiller va vous recontacter rapidement.";

    // Append model response to history
    history.push({
      role: 'model',
      parts: [{ text: replyText }]
    });

    // Keep history manageable (last 10 turns)
    if (history.length > 20) {
      history = history.slice(-20);
    }
    conversationHistories.set(phone, history);

    return replyText;
  } catch (error) {
    console.error(`[AI Error] Failed to generate response for ${phone}:`, error.message);
    return "Merci de votre message ! Je prends note de votre demande et reviens vers vous dès que possible.";
  }
}
