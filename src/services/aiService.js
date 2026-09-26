import { GoogleGenAI } from '@google/genai';
import { config } from '../config.js';

const ai = new GoogleGenAI({ apiKey: config.gemini.apiKey || 'DUMMY_KEY' });

/**
 * System instruction builder incorporating AI agent settings & catalog products
 */
export function buildSystemPrompt(agentConfig = {}, products = []) {
  const agentName = agentConfig.name || 'Awa';
  const company = agentConfig.company_description || 'Notre entreprise';
  const productsSummary = agentConfig.products_summary || 'Formations et services commerciaux';
  const idealClient = agentConfig.ideal_client || 'Entrepreneurs et PME';
  const country = agentConfig.country || "Côte d'Ivoire";
  const tone = agentConfig.tone || 'Professionnel';
  const customRules = agentConfig.custom_instructions || '';

  const catalogText = products.length > 0
    ? products.map(p => `- Produit: ${p.name} | Prix: ${p.price} ${p.currency || 'FCFA'} | Catégorie: ${p.category}\n  Description: ${p.description}\n  Arguments: ${(p.sales_arguments || []).join(', ')}`).join('\n')
    : 'Aucun produit spécifique renseigné.';

  return `
Tu es ${agentName}, le commercial IA WhatsApp officiel pour ${company} situé en ${country}.
Ton ton est : ${tone}.
Ton client idéal est : ${idealClient}.

CATALOGUE PRODUITS OFFICIEL (Source de vérité absolue) :
${catalogText}

RÈGLES STRICTES D'UTILISATION :
1. Réponds de façon concise, naturelle et fluide adaptée à WhatsApp (pas de pavés).
2. Ne génère JAMAIS une information inventée (prix, réduction, disponibilité, délai). Si une donnée manque dans le catalogue, réponds exactement : "Je vais vérifier cela pour vous."
3. Ne pose qu'UNE SEULE question à la fois pour garder le prospect engagé.
4. Lorsque le prospect exprime un besoin ou un intérêt, qualifie-le en identifiant son besoin, son budget, le produit souhaité et ses coordonnées.
5. Si le prospect demande explicitement un humain, réponds poliment que tu transmets la main à un conseiller humain.

INSTRUCTIONS SUPPLÉMENTAIRES DU PROPRIÉTAIRE :
${customRules}
`;
}

/**
 * Analyzes incoming message intent and calculates lead score updates
 */
export function analyzeIntentAndScore(message, currentScore = 0) {
  const text = (message || '').toLowerCase();
  let intent = 'unknown';
  let scoreDelta = 0;
  let isHumanRequested = false;

  if (text.includes('humain') || text.includes('parler a quelqu\'un') || text.includes('conseiller') || text.includes('agent')) {
    intent = 'human_request';
    isHumanRequested = true;
  } else if (text.includes('bonjour') || text.includes('salut') || text.includes('hello') || text.includes('bonsoir')) {
    intent = 'greeting';
  } else if (text.includes('prix') || text.includes('combien') || text.includes('tarif') || text.includes('coûte') || text.includes('fcfa')) {
    intent = 'price_question';
    scoreDelta += 20; // Budget / Price interest
  } else if (text.includes('acheter') || text.includes('commander') || text.includes('prends') || text.includes('payer')) {
    intent = 'purchase_intent';
    scoreDelta += 20; // Purchase intent
  } else if (text.includes('formation') || text.includes('produit') || text.includes('service') || text.includes('détail')) {
    intent = 'product_question';
    scoreDelta += 20; // Product interest
  } else {
    intent = 'qualification';
  }

  const newScore = Math.min(100, Math.max(0, currentScore + scoreDelta));
  const isQualified = newScore >= 60;

  return {
    intent,
    scoreDelta,
    newScore,
    isQualified,
    isHumanRequested
  };
}

/**
 * Central AIService pipeline
 */
export async function processAIService({
  senderPhone,
  incomingMessage,
  history = [],
  agentConfig = {},
  products = [],
  currentScore = 0
}) {
  const analysis = analyzeIntentAndScore(incomingMessage, currentScore);

  if (analysis.isHumanRequested) {
    return {
      replyText: "Entendu ! Je mets la conversation en pause et je transmets votre demande immédiatement à un conseiller humain. Il vous recontactera sous peu.",
      analysis,
      handoverRequired: true
    };
  }

  if (!config.gemini.apiKey || config.gemini.apiKey === 'your_gemini_api_key_here') {
    return {
      replyText: "Bonjour ! Merci pour votre message. Comment puis-je vous aider aujourd'hui ?",
      analysis,
      handoverRequired: false
    };
  }

  try {
    const systemInstruction = buildSystemPrompt(agentConfig, products);
    const contents = [...history, { role: 'user', parts: [{ text: incomingMessage }] }];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
        maxOutputTokens: 350
      }
    });

    const replyText = response.text || "Je vais vérifier cela pour vous.";

    return {
      replyText,
      analysis,
      handoverRequired: false
    };
  } catch (error) {
    console.error('[AIService Error] Gemini API generation failed:', error.message);
    return {
      replyText: "Je vais vérifier cela pour vous.",
      analysis,
      handoverRequired: false
    };
  }
}
