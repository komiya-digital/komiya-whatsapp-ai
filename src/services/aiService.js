import { GoogleGenAI } from '@google/genai';
import { config } from '../config.js';

/**
 * Normalizes message text for robust accent-insensitive matching
 */
export function normalizeText(text = '') {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Finds matching product from the catalog based on message text or contextual reference
 */
export function findMatchingProduct(text = '', products = [], lastMentionedProduct = null, companyName = '') {
  if (!Array.isArray(products) || products.length === 0) return null;
  const norm = normalizeText(text);
  const companyWords = normalizeText(companyName).split(/\s+/).filter(w => w.length >= 3);

  // 1. Direct full name match
  for (const p of products) {
    if (!p?.name) continue;
    const pNorm = normalizeText(p.name);
    if (norm.includes(pNorm)) {
      return p;
    }
  }

  // 2. Significant product keywords (excluding company words and common stop words)
  const stopWords = new Set([
    'pour', 'avec', 'dans', 'chez', 'plat', 'mode', 'vente', 'pack', 'vos', 'nos', 
    'des', 'les', 'une', 'votre', 'notre', 'produit', 'produits', 'service', 'services', 
    'articles', 'bien', 'biens', 'formule', 'formules', 'offre', 'offres', 'menu', 'menus'
  ]);

  for (const p of products) {
    if (!p?.name) continue;
    const pNorm = normalizeText(p.name);
    const words = pNorm.split(/\s+/).filter(w => w.length >= 4 && !stopWords.has(w) && !companyWords.includes(w));
    if (words.length > 0 && words.some(w => new RegExp(`\\b${w}\\b`, 'i').test(norm))) {
      return p;
    }
  }

  // 3. Ordinal references (ex: "le premier", "le 2eme", "le second", "le dernier")
  if (norm.match(/\b(premier|1er|premiere)\b/)) {
    return products[0] || null;
  }
  if (norm.match(/\b(deuxieme|2eme|second|seconde)\b/)) {
    return products[1] || products[0] || null;
  }
  if (norm.match(/\b(troisieme|3eme)\b/)) {
    return products[2] || products[0] || null;
  }
  if (norm.match(/\b(dernier|derniere)\b/)) {
    return products[products.length - 1] || null;
  }

  // 4. Demonstrative reference ("celui-la", "celle-la", "celui ci", "celui", "cette offre")
  if (norm.match(/\b(celui[- ]?la|celle[- ]?la|celui[- ]?ci|celle[- ]?ci|celui|celle|ce produit|cet article|cette offre|ce plat|ce bien)\b/)) {
    return lastMentionedProduct || products[0] || null;
  }

  return null;
}

/**
 * Extracts the last product mentioned in conversation history
 */
export function extractLastMentionedProduct(history = [], products = [], companyName = '') {
  if (!Array.isArray(history) || history.length === 0 || !Array.isArray(products) || products.length === 0) {
    return null;
  }

  // Search backwards from most recent message
  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i];
    const text = typeof msg === 'string' 
      ? msg 
      : (msg.content || msg.text || msg.parts?.[0]?.text || '');
    const matched = findMatchingProduct(text, products, null, companyName);
    if (matched) return matched;
  }

  return null;
}

/**
 * Advanced Multi-Sector Intent Classification & Qualification Engine
 * Covers 20+ commercial intents adapted across any industry
 */
export function analyzeIntentAndScore(
  message = '', 
  currentScore = 0, 
  history = [], 
  products = [], 
  lastProduct = null, 
  companyName = ''
) {
  const rawText = message || '';
  const norm = normalizeText(rawText);

  let intent = 'general_inquiry';
  let scoreDelta = 0;
  let isHumanRequested = false;
  let suggestedStatus = 'En conversation';
  let detectedNeed = null;
  let detectedBudget = null;

  // Resolve matching product
  const directlyMentionedProduct = findMatchingProduct(rawText, products, null, companyName);
  const matchedProduct = directlyMentionedProduct || (
    norm.match(/\b(celui|celle|prix|combien|acheter|commander|reserver|ce produit|cet article|ce menu|cette villa|cette maison|cette formation)\b/) 
      ? lastProduct 
      : null
  );

  // 1. Human Handover Request
  if (
    norm.match(/\b(humain|conseiller|agent|parler a quelqu['’]un|responsable|service client|personne reelle|vrai personne|numero direct|parler avec un agent)\b/) ||
    (norm.includes('parler') && (norm.includes('humain') || norm.includes('responsable') || norm.includes('directeur') || norm.includes('conseiller')))
  ) {
    intent = 'human_handover';
    isHumanRequested = true;
    suggestedStatus = 'À relancer';
  }

  // 2. Complaint or Refund
  else if (
    norm.match(/\b(reclamation|rembourse|remboursement|plainte|probleme|casse|defectueux|arnaque|erreur de commande|insatisfait|pas recu)\b/)
  ) {
    intent = 'complaint_refund';
    suggestedStatus = 'À relancer';
  }

  // 3. Purchase Intent & Orders
  else if (
    norm.match(/\b(je veux acheter|j['’]achete|je prends|je commande|commander|passer commande|je valide|comment commander|comment payer|proceder au paiement|m['’]inscrire|je le veux|je la veux|livrez[- ]?moi|amenez[- ]?moi|j['’]en veux)\b/) ||
    (norm.match(/\b(acheter|prendre|payer|commander)\b/) && (matchedProduct || norm.match(/\b(produit|article|pack|robe|chemise|menu|burger)\b/)))
  ) {
    intent = 'purchase_intent';
    suggestedStatus = 'Intention d\'achat';
    scoreDelta += 35;
    if (matchedProduct) detectedNeed = matchedProduct.name;
  }

  // 4. Booking / Appointment Intent (Restaurants, Real Estate, Salons, Clinics)
  else if (
    norm.match(/\b(je reserve|reserver|reservation|reserver une table|prendre rendez[- ]?vous|reserver une visite|prendre rdv|visiter|visite|dispo pour une visite|creneau)\b/)
  ) {
    intent = 'booking_intent';
    suggestedStatus = 'Réservation demandée';
    scoreDelta += 30;
    if (matchedProduct) detectedNeed = matchedProduct.name;
  }

  // 5. Quote Request
  else if (
    norm.match(/\b(devis|facture proforma|proposition tarifaire|offre de prix|chiffrage|estimation du cout)\b/)
  ) {
    intent = 'quote_request';
    suggestedStatus = 'Demande de devis';
    scoreDelta += 25;
    if (matchedProduct) detectedNeed = matchedProduct.name;
  }

  // 6. Demo / Trial Request
  else if (
    norm.match(/\b(demonstration|demo|tester|essai|essayer|visite guidee|echantillon)\b/)
  ) {
    intent = 'demo_request';
    suggestedStatus = 'Intéressé';
    scoreDelta += 25;
    if (matchedProduct) detectedNeed = matchedProduct.name;
  }

  // 7. Price / Tariff Inquiry
  else if (
    norm.match(/\b(prix|combien|tarif|tarifs|cout|coutent|coute|valeur|montant|c['’]est combien|quel est le prix|quel est le tarif|fcfa|f cfa|euros?|dollars?)\b/)
  ) {
    intent = 'price_inquiry';
    suggestedStatus = 'Intéressé';
    scoreDelta += 20;
    if (matchedProduct) detectedNeed = matchedProduct.name;
  }

  // 8. Availability Inquiry
  else if (
    norm.match(/\b(disponible|dispo|en stock|reste[- ]?t[- ]?il|encore disponible|disponibilite|rupture|a la carte ce jour)\b/)
  ) {
    intent = 'availability_inquiry';
    suggestedStatus = 'Intéressé';
    scoreDelta += 20;
    if (matchedProduct) detectedNeed = matchedProduct.name;
  }

  // 9. Delivery & Shipping Inquiry
  else if (
    norm.match(/\b(livraison|livrez[- ]?vous|livrer|frais de livraison|expedition|delai de livraison|ou etes[- ]?vous|adresse|localisation|situe|boutique physique|horaires?|ouverture|fermeture|jours d['’]ouverture)\b/)
  ) {
    intent = 'delivery_inquiry';
    suggestedStatus = 'Intéressé';
    scoreDelta += 15;
  }

  // 10. Payment Methods Inquiry
  else if (
    norm.match(/\b(moyen de paiement|mode de paiement|paiement|payer par|wave|orange money|mtn|moov|carte bancaire|espece|a la livraison|virement)\b/)
  ) {
    intent = 'payment_inquiry';
    suggestedStatus = 'Intéressé';
    scoreDelta += 20;
  }

  // 11. Price & Budget Objections
  else if (
    norm.match(/\b(cher|trop cher|hors de prix|reduire le prix|reduction|remise|rabais|geste commercial|negocier|promo|promotion|moins cher|trop eleve|au dessus de mon budget)\b/)
  ) {
    intent = 'objection_price';
    suggestedStatus = 'Intéressé';
    scoreDelta += 10;
  }

  // 12. Trust & Quality Objections
  else if (
    norm.match(/\b(garantie|qualite|fiable|confiance|vrai|original|authentique|est[- ]?ce sur|peur de me faire arnaquer|preuve|temoignage|avis)\b/)
  ) {
    intent = 'objection_trust';
    suggestedStatus = 'Intéressé';
    scoreDelta += 15;
  }

  // 13. Catalog & Products Discovery
  else if (
    norm.match(/\b(produits?|services?|articles?|catalogue|menu|carte|que proposez[- ]?vous|vos offres|vos prestations|qu['’]est[- ]?ce que vous vendez|vos modeles|montrez[- ]?moi|la liste)\b/) &&
    !directlyMentionedProduct
  ) {
    intent = 'catalog_discovery';
    suggestedStatus = 'En conversation';
    scoreDelta += 15;
  }

  // 14. Specific Product Inquiry or Comparison
  else if (matchedProduct) {
    if (norm.match(/\b(difference|comparer|lequel choisir|lequel est mieux|comparaison)\b/)) {
      intent = 'product_comparison';
    } else {
      intent = 'product_inquiry';
    }
    suggestedStatus = 'Intéressé';
    scoreDelta += 20;
    detectedNeed = matchedProduct.name;
  }

  // 15. About the Business
  else if (
    norm.match(/\b(qui etes[- ]?vous|presentez[- ]?vous|votre entreprise|parlez[- ]?moi de vous|c['’]est quoi votre societe)\b/)
  ) {
    intent = 'about_business';
    suggestedStatus = 'En conversation';
    scoreDelta += 10;
  }

  // 16. Contextual Short Responses (e.g. "Oui", "Celui-là", "D'accord", "Non")
  else if (
    norm.match(/^(oui|ouais|d['’]accord|ok|yes|exactement|parfait|super|tres bien|absolument|je veux bien|ca me va|celui[- ]?la|celle[- ]?la|le deuxieme|le premier|interessant)$/) ||
    norm.match(/^(non|pas maintenant|plus tard|pas vraiment|bof)$/)
  ) {
    if (norm.match(/^(non|pas maintenant|plus tard)$/)) {
      intent = 'contextual_decline';
      scoreDelta -= 5;
    } else {
      intent = 'short_contextual';
      scoreDelta += 15;
      suggestedStatus = matchedProduct ? 'Intention d\'achat' : 'En conversation';
      if (matchedProduct) detectedNeed = matchedProduct.name;
    }
  }

  // 17. Greetings
  else if (
    norm.match(/\b(bonjour|salut|bonsoir|hello|hi|coucou|bon matin|salam|bien le bonjour|hey)\b/)
  ) {
    intent = 'greeting';
    scoreDelta += 5;
    suggestedStatus = (Array.isArray(history) && history.length > 0) ? 'En conversation' : 'Nouveau';
  }

  // 18. Default Qualification
  else {
    intent = 'qualification';
    scoreDelta += 10;
    suggestedStatus = 'En conversation';
  }

  // Budget detection (e.g. "50000 fcfa", "20 000 FCFA", "150 €", "$500")
  const budgetMatch = rawText.match(/(\d+[\s\d]*)\s*(fcfa|f cfa|cfa|frs|euros?|€|\$)/i);
  if (budgetMatch) {
    detectedBudget = budgetMatch[0].trim();
    scoreDelta += 15;
  }

  const newScore = Math.min(100, Math.max(0, currentScore + scoreDelta));
  const isQualified = newScore >= 60;
  if (isQualified && suggestedStatus === 'En conversation') {
    suggestedStatus = 'Qualifié';
  }

  return {
    intent,
    scoreDelta,
    newScore,
    isQualified,
    isHumanRequested,
    suggestedStatus,
    matchedProduct,
    detectedNeed,
    detectedBudget
  };
}

/**
 * Builds a strict, high-converting system prompt for the AI model
 * rigorously enforcing multi-tenant isolation, WhatsApp brevity, and company goals.
 */
export function buildSystemPrompt({
  agentConfig = {},
  products = [],
  businessData = {},
  faqs = [],
  lastProduct = null,
  contact = null
} = {}) {
  const agentName = agentConfig.name || 'Awa';
  const companyName = businessData.name || agentConfig.company_description || 'Notre entreprise';
  const companyDesc = businessData.description || agentConfig.company_description || '';
  const country = businessData.country || agentConfig.country || "Côte d'Ivoire";
  const currency = businessData.currency || 'FCFA';
  const tone = agentConfig.tone || 'Professionnel et chaleureux';
  const objective = agentConfig.objective || 'Conseiller et convertir les prospects en clients';
  const customInstructions = agentConfig.custom_instructions || '';

  // Format products list
  const catalogText = (Array.isArray(products) && products.length > 0)
    ? products.map((p, idx) => {
        const priceStr = `${Number(p.price || 0).toLocaleString('fr-FR')} ${p.currency || currency}`;
        const argsStr = Array.isArray(p.sales_arguments) && p.sales_arguments.length > 0
          ? `\n    - Arguments clés : ${p.sales_arguments.join('; ')}`
          : '';
        const descStr = p.description ? `\n    - Description : ${p.description}` : '';
        const catStr = p.category ? ` (Catégorie: ${p.category})` : '';
        const availStr = p.is_available === false ? ' [ACTUELLEMENT INDISPONIBLE]' : ' [DISPONIBLE]';
        return `  ${idx + 1}. ${p.name} - ${priceStr}${catStr}${availStr}${descStr}${argsStr}`;
      }).join('\n\n')
    : 'Aucun produit spécifique renseigné dans le catalogue pour le moment.';

  // Format FAQs if available
  const faqsText = (Array.isArray(faqs) && faqs.length > 0)
    ? faqs.map(f => `  • Q: ${f.question}\n    R: ${f.answer}`).join('\n')
    : 'Aucune FAQ spécifique enregistrée.';

  // Contextual memory summary
  const lastProdText = lastProduct 
    ? `Dernier produit abordé avec ce prospect : "${lastProduct.name}" (${Number(lastProduct.price || 0).toLocaleString('fr-FR')} ${lastProduct.currency || currency})`
    : 'Aucun produit spécifique abordé pour l\'instant.';

  const contactSummary = contact
    ? `Nom du prospect : ${contact.name || 'Inconnu'}\nStatut CRM : ${contact.status || 'En conversation'}\nScore actuel : ${contact.score || 0}/100`
    : '';

  return `Tu es ${agentName}, le commercial IA officiel et exclusif de l'entreprise "${companyName}", située en ${country}.
Ton rôle est de représenter dignement cette entreprise, conseiller les clients avec précision, traiter leurs objections et les amener vers la vente ou la réservation.

============================================================
IDENTITÉ DE L'ENTREPRISE (CONFIDENTIEL & EXCLUSIF) :
Nom commercial : ${companyName}
Localisation : ${country}
Devise officielle : ${currency}
Description de l'activité : ${companyDesc || 'Entreprise commerciale de référence.'}
Ton de communication : ${tone}
Objectif commercial prioritaire : ${objective}
${contactSummary}
${lastProdText}

============================================================
CATALOGUE COMMERCIAL OFFICIEL (SOURCE UNIQUE DE VÉRITÉ) :
${catalogText}

============================================================
QUESTIONS FRÉQUENTES & INFORMATIONS PRATIQUES (FAQ) :
${faqsText}

============================================================
RÈGLES D'OR DU COMMERCIAL WHATSAPP (À RESPECTER STRICTEMENT) :
1. ADAPTATION WHATSAPP : Réponds de manière concise, percutante, fluide et aérée (2 à 4 phrases courtes maximum). Utilise quelques émojis professionnels avec parcimonie.
2. PAS DE PAVÉS : Ne noie JAMAIS le prospect sous un long texte. Pose UNE SEULE question ciblée par message pour maintenir la conversation active.
3. VÉRACITÉ ABSOLUE : N'invente JAMAIS un prix, une caractéristique, une réduction ou une fausse disponibilité. Utilise STRICTEMENT les prix et données du catalogue ci-dessus.
4. REPONSES COURTES DU PROSPECT : Si le client dit "Oui", "Celui-là", "Le deuxième", "C'est combien ?", sers-toi du dernier produit discuté pour répondre directement sans lui redemander ce qu'il veut.
5. CONVERSION BIENVEILLANTE : Si le prospect montre une intention d'achat ou pose une question sur un produit, donne le prix exact et propose immédiatement la suite concrète (ex: "Souhaitez-vous que je valide votre commande ?" ou "Préférez-vous être livré ou récupérer sur place ?").
6. ÉTANCHÉITÉ MULTI-TENANT : Tu représentes UNIQUEMENT "${companyName}". Tu ne dois JAMAIS mentionner d'autres marques, ni Komiya Digital, ni mélanger des informations extérieures.
7. PASSER LA MAIN À UN HUMAIN : Si le client demande expressément un conseiller humain, confirme poliment la prise en charge et le passage de relais.

============================================================
INSTRUCTIONS COMMERCIALES SPÉCIFIQUES DU PROPRIÉTAIRE :
${customInstructions || 'Sois accueillant, efficace et oriente toujours vers la satisfaction du client.'}
`;
}

/**
 * Intelligent Deterministic Commercial Response Engine (Fail-safe Fallback)
 * Formulates realistic, context-aware, customized sales replies for any business
 * even if LLM provider is offline, keyless or rate-limited.
 */
export function generateDeterministicCommercialReply({
  analysis,
  agentConfig = {},
  products = [],
  businessData = {},
  faqs = [],
  history = [],
  incomingMessage = ''
}) {
  const agentName = agentConfig.name || 'Awa';
  const companyName = businessData.name || agentConfig.company_description || 'notre boutique';
  const currency = businessData.currency || 'FCFA';
  const targetProduct = analysis.matchedProduct || (products.length > 0 ? products[0] : null);

  const formatPrice = (p) => {
    if (!p) return '';
    return `${Number(p.price || 0).toLocaleString('fr-FR')} ${p.currency || currency}`;
  };

  switch (analysis.intent) {
    case 'human_handover':
      return `C'est bien noté ! Je mets la conversation en pause et je transmets votre demande directement à un conseiller de ${companyName}. Un membre de notre équipe va prendre le relais sous peu.`;

    case 'complaint_refund':
      return `Je comprends parfaitement votre préoccupation et je suis désolé pour ce désagrément. Je préviens immédiatement notre responsable chez ${companyName} pour traiter votre dossier en priorité. Pouvez-vous me préciser votre référence ou situation ?`;

    case 'greeting': {
      // If history already has messages, do not repeat welcoming pitch
      if (Array.isArray(history) && history.length > 1) {
        return `Bonjour à nouveau ! Comment puis-je vous accompagner sur nos offres chez ${companyName} aujourd'hui ?`;
      }
      if (products.length > 0) {
        return `Bonjour et bienvenue chez ${companyName} ! Je suis ${agentName}, votre conseiller commercial. Êtes-vous à la recherche d'un produit en particulier ou souhaitez-vous découvrir nos meilleures offres ?`;
      }
      return `Bonjour et bienvenue chez ${companyName} ! Je suis ${agentName}, votre conseiller commercial. Comment puis-je vous aider aujourd'hui ?`;
    }

    case 'catalog_discovery': {
      if (products.length === 0) {
        return `Bienvenue chez ${companyName} ! Notre catalogue est en cours d'actualisation. Quel type d'article ou prestation recherchez-vous en particulier ?`;
      }
      const topProducts = products.slice(0, 3).map(p => `• *${p.name}* : ${formatPrice(p)}`).join('\n');
      const moreText = products.length > 3 ? `\n... et d'autres options encore disponibles !` : '';
      return `Voici les offres actuellement disponibles chez *${companyName}* :\n\n${topProducts}${moreText}\n\nLequel de ces articles attire votre attention ?`;
    }

    case 'price_inquiry': {
      if (targetProduct) {
        const argText = Array.isArray(targetProduct.sales_arguments) && targetProduct.sales_arguments.length > 0
          ? ` (${targetProduct.sales_arguments[0]})`
          : '';
        return `Le tarif officiel pour *${targetProduct.name}* est de *${formatPrice(targetProduct)}*${argText}. Souhaitez-vous que nous organisions votre commande dès maintenant ?`;
      }
      if (products.length > 0) {
        const priceList = products.slice(0, 2).map(p => `• ${p.name} : *${formatPrice(p)}*`).join('\n');
        return `Nos tarifs dépendent de l'article choisi chez ${companyName}. Par exemple :\n${priceList}\n\nQuel article vous intéresse précisément ?`;
      }
      return `Nos prix sont très compétitifs chez ${companyName}. De quel article ou service souhaitez-vous connaître le tarif ?`;
    }

    case 'purchase_intent': {
      if (targetProduct) {
        return `Excellente décision ! Pour finaliser votre commande de *${targetProduct.name}* (${formatPrice(targetProduct)}), pourriez-vous me communiquer votre nom complet et votre lieu de livraison souhaité ?`;
      }
      return `C'est une excellente initiative ! Pour finaliser votre commande chez ${companyName}, confirmez-moi simplement le modèle souhaité ainsi que votre ville de livraison.`;
    }

    case 'booking_intent': {
      if (targetProduct) {
        return `Parfait ! Pour organiser votre réservation pour *${targetProduct.name}*, pour quelle date et quelle heure cela vous conviendrait-il le mieux ?`;
      }
      return `Avec plaisir ! Pour enregistrer votre réservation chez ${companyName}, quelle date et quel créneau horaire préférez-vous ?`;
    }

    case 'quote_request': {
      if (targetProduct) {
        return `Nous pouvons établir votre devis pour *${targetProduct.name}* (${formatPrice(targetProduct)}). Avez-vous des quantités ou des options spécifiques à prévoir ?`;
      }
      return `C'est bien noté pour votre demande de devis chez ${companyName}. Quels sont les éléments ou quantités souhaités pour vous envoyer une proposition précise ?`;
    }

    case 'demo_request': {
      if (targetProduct) {
        return `Nous serions ravis de vous faire découvrir *${targetProduct.name}* en action ! Quel jour de la semaine seriez-vous disponible pour une démonstration ?`;
      }
      return `Avec plaisir pour vous présenter nos prestations en démonstration ! Quand seriez-vous disponible pour échanger ?`;
    }

    case 'availability_inquiry': {
      if (targetProduct) {
        if (targetProduct.is_available === false) {
          return `*${targetProduct.name}* est temporairement en rupture de stock. Souhaitez-vous que je vous propose une alternative disponible équivalente chez ${companyName} ?`;
        }
        return `Oui, *${targetProduct.name}* est bien disponible au tarif de ${formatPrice(targetProduct)} ! Souhaitez-vous le réserver ou vous faire livrer ?`;
      }
      return `La majorité de nos produits sont immédiatement disponibles chez ${companyName}. Quel article en particulier souhaitez-vous réserver ?`;
    }

    case 'delivery_inquiry': {
      return `Nous assurons des livraisons rapides et soignées pour l'ensemble de nos clients chez ${companyName}. Dans quelle ville ou quartier souhaitez-vous recevoir votre commande ?`;
    }

    case 'payment_inquiry': {
      return `Chez ${companyName}, nous acceptons les paiements sécurisés par Mobile Money (Wave, Orange Money, MTN, Moov) ainsi que le règlement à la livraison selon votre localisation. Quelle méthode vous convient le mieux ?`;
    }

    case 'objection_price': {
      if (targetProduct) {
        const qualityArg = (Array.isArray(targetProduct.sales_arguments) && targetProduct.sales_arguments.length > 0)
          ? targetProduct.sales_arguments[0]
          : "sa qualité supérieure et sa durabilité éprouvée";
        return `Je comprends tout à fait votre souci de budget. Le tarif de ${formatPrice(targetProduct)} s'explique par ${qualityArg}, ce qui en fait un investissement très rentable. Souhaitez-vous voir une formule adaptée ?`;
      }
      return `Nous veillons à offrir le meilleur rapport qualité/prix du marché chez ${companyName}. Avez-vous une enveloppe budgétaire précise pour que je vous oriente vers la solution idéale ?`;
    }

    case 'objection_trust': {
      return `Votre confiance est notre priorité absolue chez ${companyName}. Tous nos produits sont 100% conformes et vérifiés avant expédition avec garantie de satisfaction. Voulez-vous voir les retours de nos clients ?`;
    }

    case 'product_comparison': {
      if (products.length >= 2) {
        return `La différence principale réside dans les spécifications et fonctionnalités : *${products[0].name}* (${formatPrice(products[0])}) offre l'essentiel, tandis que *${products[1].name}* (${formatPrice(products[1])}) propose un niveau de performance supérieur. Lequel correspond le mieux à votre usage ?`;
      }
      return `Chacun de nos produits répond à un besoin précis chez ${companyName}. Dites-moi vos critères clés pour que je vous oriente vers le choix idéal !`;
    }

    case 'product_inquiry': {
      if (targetProduct) {
        const desc = targetProduct.description ? `${targetProduct.description}. ` : '';
        return `*${targetProduct.name}* est proposé à *${formatPrice(targetProduct)}*. ${desc}Avez-vous une question spécifique sur cet article ou souhaitez-vous le commander ?`;
      }
      return `Chez ${companyName}, nous disposons de plusieurs modèles de qualité. Quelle caractéristique est la plus importante pour vous ?`;
    }

    case 'short_contextual': {
      if (targetProduct) {
        return `Entendu pour *${targetProduct.name}* (${formatPrice(targetProduct)}) ! Souhaitez-vous que je valide la commande ou avez-vous une dernière question ?`;
      }
      return `C'est bien noté ! Quelle est la prochaine étape qui vous arrange : passer commande ou obtenir plus de précisions ?`;
    }

    case 'contextual_decline': {
      return `Aucun souci, prenez votre temps ! Je reste à votre entière disposition chez ${companyName} dès que vous aurez besoin de conseils. Bonne journée !`;
    }

    case 'about_business': {
      const desc = businessData.description || agentConfig.company_description || "une entreprise dédiée à la qualité et au service client";
      return `${companyName} est ${desc}. Nous accompagnons nos clients avec passion. Quel projet ou besoin commercial pouvons-nous concrétiser ensemble ?`;
    }

    default: {
      if (targetProduct) {
        return `Je suis là pour vous conseiller sur *${targetProduct.name}* (${formatPrice(targetProduct)}) ou tout autre article de ${companyName}. Que souhaitez-vous savoir ?`;
      }
      if (products.length > 0) {
        return `Je suis là pour vous guider parmi nos offres chez ${companyName}. Souhaitez-vous que je vous présente nos produits les plus populaires ?`;
      }
      return `Merci pour votre message ! Je suis à votre service pour vous orienter chez ${companyName}. Quel est votre besoin aujourd'hui ?`;
    }
  }
}

/**
 * Normalizes history array for Gemini API compatibility
 */
function normalizeGeminiHistory(history = []) {
  if (!Array.isArray(history)) return [];
  const valid = [];

  for (const item of history) {
    if (!item) continue;
    const role = (item.role === 'model' || item.role === 'assistant' || item.sender_type === 'ai') ? 'model' : 'user';
    let text = '';

    if (typeof item === 'string') {
      text = item;
    } else if (typeof item.text === 'string') {
      text = item.text;
    } else if (typeof item.content === 'string') {
      text = item.content;
    } else if (Array.isArray(item.parts)) {
      text = item.parts.map(p => (typeof p === 'string' ? p : p.text || '')).join(' ');
    }

    if (text.trim()) {
      valid.push({
        role,
        parts: [{ text: text.trim() }]
      });
    }
  }

  return valid;
}

/**
 * Central Multi-Tenant AI Commercial Service Pipeline
 */
export async function processAIService({
  senderPhone,
  incomingMessage = '',
  history = [],
  agentConfig = {},
  products = [],
  businessData = {},
  faqs = [],
  contact = null,
  currentScore = 0
}) {
  const companyName = businessData.name || agentConfig.company_description || '';

  // 1. Identify previous product discussed in conversation
  const lastProduct = extractLastMentionedProduct(history, products, companyName);

  // 2. Comprehensive intent & qualification scoring
  const analysis = analyzeIntentAndScore(
    incomingMessage,
    currentScore,
    history,
    products,
    lastProduct,
    companyName
  );

  // 3. Immediate handover handling if human was requested
  if (analysis.isHumanRequested) {
    const handoverText = generateDeterministicCommercialReply({
      analysis,
      agentConfig,
      products,
      businessData,
      faqs,
      history,
      incomingMessage
    });
    return {
      replyText: handoverText,
      analysis,
      handoverRequired: true,
      engine: 'handover'
    };
  }

  // 4. Check if Gemini API is available and configured
  const apiKey = config.gemini.apiKey;
  const isKeyConfigured = Boolean(apiKey && apiKey.trim().length > 15 && !apiKey.includes('your_gemini_api_key'));

  if (!isKeyConfigured) {
    // Generate high-quality deterministic response using real company catalog & context
    const deterministicReply = generateDeterministicCommercialReply({
      analysis,
      agentConfig,
      products,
      businessData,
      faqs,
      history,
      incomingMessage
    });

    return {
      replyText: deterministicReply,
      analysis,
      handoverRequired: false,
      engine: 'deterministic_commercial'
    };
  }

  // 5. LLM Generation via Gemini API
  try {
    const ai = new GoogleGenAI({ apiKey });
    const systemInstruction = buildSystemPrompt({
      agentConfig,
      products,
      businessData,
      faqs,
      lastProduct: analysis.matchedProduct || lastProduct,
      contact
    });

    const formattedHistory = normalizeGeminiHistory(history);
    const contents = [
      ...formattedHistory,
      { role: 'user', parts: [{ text: incomingMessage }] }
    ];

    // Use official Gemini Developer API models
    let replyText = '';
    const modelsToTry = ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction,
            temperature: 0.6,
            maxOutputTokens: 350
          }
        });

        if (response?.text && response.text.trim().length > 0) {
          replyText = response.text.trim();
          break;
        }
      } catch (genErr) {
        lastError = genErr;
        console.warn(`[AIService] ${modelName} call note:`, genErr.message);
      }
    }

    if (!replyText) {
      throw lastError || new Error('Empty response from Gemini');
    }

    return {
      replyText,
      analysis,
      handoverRequired: false,
      engine: 'gemini'
    };
  } catch (error) {
    console.warn('[AIService Note] Gemini generation fallback to deterministic engine:', error.message);
    const fallbackReply = generateDeterministicCommercialReply({
      analysis,
      agentConfig,
      products,
      businessData,
      faqs,
      history,
      incomingMessage
    });

    return {
      replyText: fallbackReply,
      analysis,
      handoverRequired: false,
      engine: 'deterministic_fallback'
    };
  }
}
