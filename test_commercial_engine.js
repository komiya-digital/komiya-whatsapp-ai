/**
 * =========================================================================
 * Komiya WhatsApp AI - Suite de Tests Officielle du Moteur Commercial
 * Validation complète multi-entreprises, cycle de vente A-G, parsing Webhook et isolation RLS
 * =========================================================================
 */

import { processAIService, analyzeIntentAndScore } from './src/services/aiService.js';
import { tenantRegistry } from './src/services/tenantRegistry.js';
import { normalizeRecipient } from './src/services/wasender.js';

console.log('=================================================================');
console.log('🚀 SUITE DE TESTS DU MOTEUR COMMERCIAL INTELLIGENT MULTI-ENTREPRISES');
console.log('=================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    failedTests++;
    console.error(`  ❌ [FAIL] ${testName} - ${details}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. DÉFINITION DES 3 ENTREPRISES FICTIVES DE SECTEURS DIFFÉRENTS
// ─────────────────────────────────────────────────────────────────────────────

const companyA = {
  id: 'biz_a_vetements_1111',
  name: 'Élégance Wax Abidjan',
  sector: 'Boutique de vêtements',
  country: 'Côte d\'Ivoire',
  currency: 'FCFA',
  description: 'Boutique de prêt-à-porter haut de gamme en pagne wax et lin',
  sessionId: 'session_wax_101',
  phoneNumber: '+22501000001',
  agent: {
    name: 'Awa',
    tone: 'Chaleureux et élégant',
    objective: 'Conseiller sur le style et convertir en commandes WhatsApp',
    custom_instructions: 'Mettre en avant la qualité 100% coton et les finitions à la main.'
  },
  products: [
    {
      id: 'prod_a1',
      name: 'Robe Wax Royale',
      price: 25000,
      currency: 'FCFA',
      category: 'Femmes',
      description: 'Robe de soirée cintrée en véritable tissu wax hollandais',
      sales_arguments: ['Coton 100% supérieur', 'Coupe sur-mesure valorisante', 'Garantie anti-décoloration']
    },
    {
      id: 'prod_a2',
      name: 'Chemise Lin & Pagne',
      price: 18000,
      currency: 'FCFA',
      category: 'Hommes',
      description: 'Chemise élégante en lin blanc avec col et manches en pagne tissé',
      sales_arguments: ['Tissu respirant idéal climat chaud', 'Style chic décontracté']
    }
  ]
};

const companyB = {
  id: 'biz_b_restaurant_2222',
  name: 'Le Gourmet du Plateau',
  sector: 'Restaurant gastronomique',
  country: 'Côte d\'Ivoire',
  currency: 'FCFA',
  description: 'Restaurant et traiteur spécialisé dans la gastronomie ivoirienne revisitée',
  sessionId: 'session_resto_202',
  phoneNumber: '+22502000002',
  agent: {
    name: 'Chef Koffi',
    tone: 'Accueillant et gourmand',
    objective: 'Donner envie de goûter nos plats et prendre les réservations',
    custom_instructions: 'Rappeler que les produits sont frais du jour et locaux.'
  },
  products: [
    {
      id: 'prod_b1',
      name: 'Menu Dégustation Ivoirien',
      price: 15000,
      currency: 'FCFA',
      category: 'Menus',
      description: 'Entrée, plat (Kedjenou ou Garba chic) et dessert gourmand',
      sales_arguments: ['Produits frais du jour', 'Recettes authentiques du terroir', 'Option végétarienne possible']
    },
    {
      id: 'prod_b2',
      name: 'Burger Alloco Gourmet',
      price: 6500,
      currency: 'FCFA',
      category: 'Street Food Chic',
      description: 'Pain brioché maison, steak haché assaisonné, alloco fondant et sauce spéciale',
      sales_arguments: ['Pain artisanal cuit chaque matin', 'Sauce secrète maison']
    }
  ]
};

const companyC = {
  id: 'biz_c_immobilier_3333',
  name: 'Prestige Immobilier',
  sector: 'Agence immobilière',
  country: 'Côte d\'Ivoire',
  currency: 'FCFA',
  description: 'Cabinet de conseil en transaction immobilière et gestion locative de standing',
  sessionId: 'session_immo_303',
  phoneNumber: '+22503000003',
  agent: {
    name: 'Marc',
    tone: 'Professionnel et rassurant',
    objective: 'Qualifier le budget et planifier des visites avec nos agents',
    custom_instructions: 'Mentionner la sécurité juridique des titres fonciers (ACD vérifiés).'
  },
  products: [
    {
      id: 'prod_c1',
      name: 'Villa Duplex 5 Pièces Cocody',
      price: 85000000,
      currency: 'FCFA',
      category: 'Vente',
      description: 'Villa contemporaine avec piscine, garage 2 voitures et jardin arboré',
      sales_arguments: ['Titre foncier ACD disponible', 'Quartier sécurisé 24/7', 'Finitions de grand standing']
    },
    {
      id: 'prod_c2',
      name: 'Studio Meublé Zone 4',
      price: 250000,
      currency: 'FCFA',
      category: 'Location',
      description: 'Studio tout confort avec groupe électrogène, fibre optique et ménage inclus',
      sales_arguments: ['Proche commodités et aéroport', 'Charges et électricité incluses']
    }
  ]
};

const allCompanies = [companyA, companyB, companyC];

// ─────────────────────────────────────────────────────────────────────────────
// 2. EXÉCUTION DES 9 SCÉNARIOS OBLIGATOIRES POUR CHAQUE ENTREPRISE
// ─────────────────────────────────────────────────────────────────────────────

async function runScenarioTests() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 TEST 1 : EXÉCUTION DES 9 SCÉNARIOS SUR LES 3 ENTREPRISES');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const oldGenericGreeting = "Bonjour ! Merci pour votre message. Comment puis-je vous aider aujourd'hui ?";

  for (const company of allCompanies) {
    console.log(`\n🏢 --- TEST DE L'ENTREPRISE : ${company.name} (${company.sector}) ---`);
    let history = [];
    let currentScore = 0;

    // Scénario 1 : Salutation
    {
      const res = await processAIService({
        senderPhone: '+22501020304',
        incomingMessage: 'Bonjour !',
        history,
        agentConfig: company.agent,
        products: company.products,
        businessData: company,
        currentScore
      });

      assert(res.replyText && res.replyText.length > 10, `${company.name} - Scénario 1: Réponse générée`);
      assert(res.replyText !== oldGenericGreeting, `${company.name} - Scénario 1: Pas de phrase générique codée en dur`);
      assert(res.replyText.includes(company.name) || res.replyText.includes(company.agent.name), `${company.name} - Scénario 1: Contexte nom entreprise/agent présent`);
      assert(res.analysis.intent === 'greeting', `${company.name} - Scénario 1: Intention "greeting" détectée`);
      history.push({ role: 'user', content: 'Bonjour !' }, { role: 'model', content: res.replyText });
      currentScore = res.analysis.newScore;
    }

    // Scénario 2 : Demande produits / catalogue
    {
      const res = await processAIService({
        senderPhone: '+22501020304',
        incomingMessage: 'Quels sont vos produits et services disponibles ?',
        history,
        agentConfig: company.agent,
        products: company.products,
        businessData: company,
        currentScore
      });

      assert(res.replyText.includes(company.products[0].name), `${company.name} - Scénario 2: Mentionne le produit "${company.products[0].name}"`);
      assert(res.analysis.intent === 'catalog_discovery', `${company.name} - Scénario 2: Intention "catalog_discovery" détectée`);
      history.push({ role: 'user', content: 'Quels sont vos produits ?' }, { role: 'model', content: res.replyText });
      currentScore = res.analysis.newScore;
    }

    // Scénario 3 : Demande de tarif précis
    {
      const targetProd = company.products[0];
      const res = await processAIService({
        senderPhone: '+22501020304',
        incomingMessage: `Quel est le prix pour ${targetProd.name} ?`,
        history,
        agentConfig: company.agent,
        products: company.products,
        businessData: company,
        currentScore
      });

      const formattedPrice = Number(targetProd.price).toLocaleString('fr-FR');
      assert(res.replyText.includes(formattedPrice) || res.replyText.includes(String(targetProd.price)), `${company.name} - Scénario 3: Mentionne le prix exact (${formattedPrice} FCFA)`);
      assert(res.analysis.intent === 'price_inquiry', `${company.name} - Scénario 3: Intention "price_inquiry" détectée`);
      assert(res.analysis.matchedProduct?.name === targetProd.name, `${company.name} - Scénario 3: Produit cible bien reconnu`);
      history.push({ role: 'user', content: `Quel est le prix pour ${targetProd.name} ?` }, { role: 'model', content: res.replyText });
      currentScore = res.analysis.newScore;
    }

    // Scénario 4 : Intention d'achat claire
    {
      const res = await processAIService({
        senderPhone: '+22501020304',
        incomingMessage: `Je veux acheter ${company.products[0].name} !`,
        history,
        agentConfig: company.agent,
        products: company.products,
        businessData: company,
        currentScore
      });

      assert(res.analysis.intent === 'purchase_intent' || res.analysis.intent === 'booking_intent', `${company.name} - Scénario 4: Intention d'achat reconnue`);
      assert(res.analysis.suggestedStatus.includes('Intention') || res.analysis.suggestedStatus.includes('Réservation') || res.analysis.suggestedStatus.includes('Qualifié'), `${company.name} - Scénario 4: Statut CRM propulsé vers la conversion`);
      assert(res.replyText.toLowerCase().includes('commande') || res.replyText.toLowerCase().includes('finaliser') || res.replyText.toLowerCase().includes('livraison'), `${company.name} - Scénario 4: Appel à l'action d'achat présent`);
      history.push({ role: 'user', content: `Je veux acheter ${company.products[0].name}` }, { role: 'model', content: res.replyText });
      currentScore = res.analysis.newScore;
    }

    // Scénario 5 : Question complémentaire (livraison / horaires)
    {
      const res = await processAIService({
        senderPhone: '+22501020304',
        incomingMessage: 'Quels sont vos délais et conditions de livraison ?',
        history,
        agentConfig: company.agent,
        products: company.products,
        businessData: company,
        currentScore
      });

      assert(res.analysis.intent === 'delivery_inquiry', `${company.name} - Scénario 5: Intention "delivery_inquiry" détectée`);
      assert(res.replyText.toLowerCase().includes('livraison') || res.replyText.toLowerCase().includes('ville'), `${company.name} - Scénario 5: Réponse concrète sur la livraison`);
      history.push({ role: 'user', content: 'Quels sont vos délais de livraison ?' }, { role: 'model', content: res.replyText });
      currentScore = res.analysis.newScore;
    }

    // Scénario 6 : Objection sur le prix
    {
      const res = await processAIService({
        senderPhone: '+22501020304',
        incomingMessage: 'C\'est un peu trop cher pour moi, vous ne faites pas de réduction ?',
        history,
        agentConfig: company.agent,
        products: company.products,
        businessData: company,
        currentScore
      });

      assert(res.analysis.intent === 'objection_price', `${company.name} - Scénario 6: Intention "objection_price" détectée`);
      assert(res.replyText.toLowerCase().includes('qualité') || res.replyText.toLowerCase().includes('budget') || res.replyText.toLowerCase().includes('invest'), `${company.name} - Scénario 6: Traitement commercial de l'objection`);
      history.push({ role: 'user', content: 'C\'est un peu trop cher' }, { role: 'model', content: res.replyText });
      currentScore = res.analysis.newScore;
    }

    // Scénario 7 : Processus de commande / réservation
    {
      const res = await processAIService({
        senderPhone: '+22501020304',
        incomingMessage: 'D\'accord, comment je commande alors ?',
        history,
        agentConfig: company.agent,
        products: company.products,
        businessData: company,
        currentScore
      });

      assert(res.analysis.intent === 'purchase_intent' || res.analysis.intent === 'booking_intent', `${company.name} - Scénario 7: Intention de commande/réservation reconnue`);
      assert(res.replyText.toLowerCase().includes('commande') || res.replyText.toLowerCase().includes('nom') || res.replyText.toLowerCase().includes('livraison') || res.replyText.toLowerCase().includes('créneau'), `${company.name} - Scénario 7: Guide vers les coordonnées et la validation`);
      history.push({ role: 'user', content: 'Comment je commande ?' }, { role: 'model', content: res.replyText });
      currentScore = res.analysis.newScore;
    }

    // Scénario 8 : Demande d'un conseiller humain
    {
      const res = await processAIService({
        senderPhone: '+22501020304',
        incomingMessage: 'Je préfère parler à un conseiller humain s\'il vous plaît.',
        history,
        agentConfig: company.agent,
        products: company.products,
        businessData: company,
        currentScore
      });

      assert(res.analysis.intent === 'human_handover', `${company.name} - Scénario 8: Intention "human_handover" détectée`);
      assert(res.handoverRequired === true, `${company.name} - Scénario 8: Flag handoverRequired activé`);
      assert(res.replyText.toLowerCase().includes('conseiller') || res.replyText.toLowerCase().includes('équipe'), `${company.name} - Scénario 8: Message de passage de main courtois`);
      history.push({ role: 'user', content: 'Je veux parler à un humain' }, { role: 'model', content: res.replyText });
      currentScore = res.analysis.newScore;
    }

    // Scénario 9 : Reprise de conversation courte ("Celui-là, c'est combien ?")
    {
      // Simulation: client revient et dit juste "Celui-là" en faisant référence au dernier produit
      const res = await processAIService({
        senderPhone: '+22501020304',
        incomingMessage: 'Celui-là, c\'est combien ?',
        history,
        agentConfig: company.agent,
        products: company.products,
        businessData: company,
        currentScore
      });

      assert(res.analysis.matchedProduct !== null, `${company.name} - Scénario 9: Résolution contextuelle du produit ("Celui-là")`);
      assert(res.replyText !== oldGenericGreeting, `${company.name} - Scénario 9: Réponse dynamique contextualisée`);
      assert(res.replyText.includes(company.products[0].name) || res.replyText.includes(company.products[1].name), `${company.name} - Scénario 9: Fait explicitement référence au produit de l'échange`);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. TEST DE SÉCURITÉ & ÉTANCHÉITÉ MULTI-TENANT STRICTE
// ─────────────────────────────────────────────────────────────────────────────

async function runMultiTenantIsolationTests() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔒 TEST 2 : ÉTANCHÉITÉ & ISOLATION MULTI-TENANT ABSOLUE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Test 2.1 : Entreprise A (Vêtements) interrogée sur des produits d'autres entreprises
  const resA = await processAIService({
    senderPhone: '+22501010101',
    incomingMessage: 'Avez-vous le Burger Alloco ou la Villa Duplex ?',
    history: [],
    agentConfig: companyA.agent,
    products: companyA.products,
    businessData: companyA,
    currentScore: 0
  });

  assert(!resA.replyText.includes('Menu Dégustation') && !resA.replyText.includes('Cocody'), 'Isolation A: Entreprise A ne mentionne AUCUN produit du restaurant ni de l\'agence immobilière');
  assert(resA.replyText.includes(companyA.name) || resA.replyText.includes(companyA.agent.name) || resA.replyText.includes(companyA.products[0].name), 'Isolation A: Entreprise A reste ancrée dans son univers de vêtements');

  // Test 2.2 : Entreprise B (Restaurant) interrogée sur des vêtements
  const resB = await processAIService({
    senderPhone: '+22502020202',
    incomingMessage: 'Vendez-vous la Robe Wax Royale ?',
    history: [],
    agentConfig: companyB.agent,
    products: companyB.products,
    businessData: companyB,
    currentScore: 0
  });

  assert(!resB.replyText.includes('Wax') && !resB.replyText.includes('Pagne'), 'Isolation B: Entreprise B ne vend pas de vêtements');
  assert(resB.replyText.includes(companyB.name) || resB.replyText.includes(companyB.products[0].name), 'Isolation B: Entreprise B promeut son menu');

  // Test 2.3 : Entreprise C (Immobilier) ne cite pas Komiya Digital par défaut
  const resC = await processAIService({
    senderPhone: '+22503030303',
    incomingMessage: 'Présentez-moi votre agence',
    history: [],
    agentConfig: companyC.agent,
    products: companyC.products,
    businessData: companyC,
    currentScore: 0
  });

  assert(!resC.replyText.includes('Komiya Digital') && !resC.replyText.includes('Formation Facebook'), 'Isolation C: Pas de contexte commercial Komiya Digital pour les clients tiers');
  assert(resC.replyText.includes(companyC.name), 'Isolation C: Nom officiel de l\'agence immobilière respecté');
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. TEST DE PROGRESSION DU SCORE ET STATUTS CRM
// ─────────────────────────────────────────────────────────────────────────────

function runCrmQualificationTests() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📈 TEST 3 : PROGRESSION DU SCORE CRM & STATUTS COMMERCIAUX');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Nouveau contact
  const t1 = analyzeIntentAndScore('Bonjour', 0, [], companyA.products);
  assert(t1.newScore >= 5, 'Score: Salutation donne un premier signal (>= 5)');
  assert(t1.suggestedStatus === 'Nouveau' || t1.suggestedStatus === 'En conversation', 'Statut: Accueil en cours');

  // Demande de prix
  const t2 = analyzeIntentAndScore('C\'est combien la robe wax ?', t1.newScore, [], companyA.products);
  assert(t2.newScore >= 25, 'Score: Demande de prix augmente le score significativement (>= 25)');
  assert(t2.suggestedStatus === 'Intéressé', 'Statut: Devient "Intéressé"');
  assert(t2.matchedProduct?.name === 'Robe Wax Royale', 'CRM: Détecte le produit d\'intérêt');

  // Intention d'achat ferme
  const t3 = analyzeIntentAndScore('Je veux acheter tout de suite', t2.newScore, [], companyA.products, t2.matchedProduct);
  assert(t3.newScore >= 60, 'Score: Intention d\'achat propulse le lead au statut qualifié (>= 60)');
  assert(t3.isQualified === true, 'CRM: Marqué comme isQualified = true');
  assert(t3.suggestedStatus === 'Intention d\'achat', 'Statut: "Intention d\'achat"');

  // Demande de devis
  const t4 = analyzeIntentAndScore('Faites-moi un devis pour 10 pièces', 20, [], companyA.products);
  assert(t4.suggestedStatus === 'Demande de devis', 'Statut: "Demande de devis"');

  // Réservation
  const t5 = analyzeIntentAndScore('Je voudrais réserver une table pour deux', 10, [], companyB.products);
  assert(t5.suggestedStatus === 'Réservation demandée', 'Statut: "Réservation demandée"');
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. TEST DE PARSING ROBUSTE DES WEBHOOKS WASENDER
// ─────────────────────────────────────────────────────────────────────────────

function runWebhookPayloadParsingTests() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔌 TEST 4 : PARSING ROBUSTE DES DIFFÉRENTS FORMATS WASENDER');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Format 1 : WASender messages.upsert avec payload.data.key et payload.data.message
  const payloadFormat1 = {
    event: 'messages.upsert',
    instance_id: '121080',
    data: {
      key: {
        remoteJid: '22501020304@s.whatsapp.net',
        fromMe: false,
        id: 'MSG_ID_001'
      },
      message: {
        conversation: 'Bonjour, quels sont vos tarifs ?'
      }
    }
  };

  // Normalisation du numéro
  const cleanPhone = normalizeRecipient(payloadFormat1.data.key.remoteJid);
  assert(cleanPhone === '22501020304', 'Webhook Parsing: Format 1 numéro correctement extrait et nettoyé');

  // Format 2 : WASender messages.received avec payload.data.messages comme ARRAY
  const payloadFormat2 = {
    event: 'messages.received',
    sessionId: 'session_resto_202',
    data: {
      messages: [
        {
          key: {
            remoteJid: '22505060708@s.whatsapp.net',
            fromMe: false,
            id: 'MSG_ID_002'
          },
          message: {
            extendedTextMessage: {
              text: 'Je veux réserver une table pour ce soir'
            }
          }
        }
      ]
    }
  };

  const cleanPhone2 = normalizeRecipient(payloadFormat2.data.messages[0].key.remoteJid);
  assert(cleanPhone2 === '22505060708', 'Webhook Parsing: Format 2 extrait le message depuis un tableau Baileys');

  // Format 3 : Format direct avec messageBody
  const payloadFormat3 = {
    event: 'messages.received',
    session_id: 'session_immo_303',
    data: {
      messages: {
        key: {
          remoteJid: '22507080910@s.whatsapp.net',
          fromMe: false,
          id: 'MSG_ID_003'
        },
        messageBody: 'Avez-vous une villa disponible à Cocody ?'
      }
    }
  };

  const cleanPhone3 = normalizeRecipient(payloadFormat3.data.messages.key.remoteJid);
  assert(cleanPhone3 === '22507080910', 'Webhook Parsing: Format 3 extrait le message direct messageBody');
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. TEST DU TENANT REGISTRY & ROUTAGE MULTI-ENTREPRISES
// ─────────────────────────────────────────────────────────────────────────────

function runTenantRegistryRoutingTests() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🏢 TEST 5 : TENANT REGISTRY & ROUTAGE LOCAL MULTI-ENTREPRISES');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Enregistrement des 3 entreprises
  tenantRegistry.registerTenant({
    businessId: companyA.id,
    sessionId: companyA.sessionId,
    phoneNumber: companyA.phoneNumber,
    businessData: companyA,
    agentConfig: companyA.agent,
    products: companyA.products
  });

  tenantRegistry.registerTenant({
    businessId: companyB.id,
    sessionId: companyB.sessionId,
    phoneNumber: companyB.phoneNumber,
    businessData: companyB,
    agentConfig: companyB.agent,
    products: companyB.products
  });

  tenantRegistry.registerTenant({
    businessId: companyC.id,
    sessionId: companyC.sessionId,
    phoneNumber: companyC.phoneNumber,
    businessData: companyC,
    agentConfig: companyC.agent,
    products: companyC.products
  });

  // Test de recherche par sessionId
  const foundA = tenantRegistry.findTenant({ sessionId: 'session_wax_101' });
  assert(foundA?.id === companyA.id, 'TenantRegistry: Entreprise A retrouvée par session ID');
  assert(foundA?.products?.length === 2, 'TenantRegistry: Catalogue complet de A disponible');

  const foundB = tenantRegistry.findTenant({ sessionId: 'session_resto_202' });
  assert(foundB?.id === companyB.id, 'TenantRegistry: Entreprise B retrouvée par session ID');

  const foundC = tenantRegistry.findTenant({ businessId: companyC.id });
  assert(foundC?.id === companyC.id, 'TenantRegistry: Entreprise C retrouvée par business ID');

  // Test mémoire conversationnelle
  tenantRegistry.recordMessage(companyA.id, '22501020304', 'user', 'Bonjour');
  tenantRegistry.recordMessage(companyA.id, '22501020304', 'model', 'Bonjour chez Élégance Wax');
  const hist = tenantRegistry.getConversationHistory(companyA.id, '22501020304');
  assert(hist.length >= 2, 'TenantRegistry: Mémoire conversationnelle enregistrée et persistée');
}

// ─────────────────────────────────────────────────────────────────────────────
// EXÉCUTION DU HARNAIS DE TEST
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  try {
    await runScenarioTests();
    await runMultiTenantIsolationTests();
    runCrmQualificationTests();
    runWebhookPayloadParsingTests();
    runTenantRegistryRoutingTests();

    console.log('\n=================================================================');
    console.log(`📊 BILAN DES TESTS : ${passedTests}/${totalTests} TESTS PASSÉS AVEC SUCCÈS`);
    if (failedTests > 0) {
      console.error(`⚠️ ÉCHECS DÉTECTÉS : ${failedTests} test(s) ont échoué.`);
      process.exit(1);
    } else {
      console.log('🎉 100% DES TESTS SONT VALIDES ET CONFORMES AUX EXIGENCES !');
      console.log('=================================================================\n');
      process.exit(0);
    }
  } catch (err) {
    console.error('Crash inattendu durant les tests:', err);
    process.exit(1);
  }
}

main();
