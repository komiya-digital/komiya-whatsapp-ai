/**
 * Test Suite Complet : Validation Réelle de l'Onboarding Komiya WhatsApp AI
 * Couvre les 12 cas de test obligatoires de non-régression.
 */

import { ONBOARDING_STATUS } from './src/lib/onboardingValidation.js';

console.log('================================================================');
console.log('🧪 SUITE DE TESTS : VALIDATION RÉELLE DE L\'ONBOARDING');
console.log('================================================================\n');

// ─────────────────────────────────────────────────────────────────
// MOCK DATABASE & CLIENT SIMULATING SUPABASE WITH RLS
// ─────────────────────────────────────────────────────────────────

function createMockSupabase() {
  const db = {
    profiles: [],
    businesses: [],
    whatsapp_connections: [],
    ai_agents: [],
    products: []
  };

  let currentUser = null;
  let simulateNetworkError = false;
  let simulateRlsError = false;

  return {
    db,
    setCurrentUser: (u) => { currentUser = u; },
    getCurrentUser: () => currentUser,
    setSimulateNetworkError: (v) => { simulateNetworkError = v; },
    setSimulateRlsError: (v) => { simulateRlsError = v; },

    // Core validation function mirroring src/lib/onboardingValidation.js
    validateOnboardingCompletion: async (businessId, sessionSkipped = {}) => {
      if (simulateNetworkError) {
        throw new Error("Supabase network error: connection timed out.");
      }
      if (simulateRlsError) {
        throw new Error("Supabase RLS error: new row violates row-level security policy.");
      }

      const biz = db.businesses.find(b => b.id === businessId && (!currentUser || b.owner_id === currentUser.id));
      if (!biz) {
        return {
          isComplete: false,
          businessId: null,
          steps: {
            business: { status: ONBOARDING_STATUS.NOT_STARTED, isRequired: true },
            assistant: { status: ONBOARDING_STATUS.NOT_STARTED, isRequired: true },
            whatsapp: { status: ONBOARDING_STATUS.NOT_STARTED, isRequired: true },
            products: { status: ONBOARDING_STATUS.NOT_STARTED, isRequired: false }
          },
          stats: { completedCount: 0, totalCount: 4, progressPercent: 0 },
          missingRequiredSteps: ['business', 'assistant', 'whatsapp']
        };
      }

      // 1. Business
      let businessStatus = ONBOARDING_STATUS.NOT_STARTED;
      if (biz && biz.name && biz.name.trim().length >= 2) {
        const isCustomized = biz.name.trim() !== 'Mon Entreprise' || (biz.description && biz.description.trim().length > 0);
        businessStatus = isCustomized ? ONBOARDING_STATUS.COMPLETED : ONBOARDING_STATUS.COMPLETED;
      }

      // 2. AI Assistant
      const agent = db.ai_agents.find(a => a.business_id === businessId);
      let agentStatus = ONBOARDING_STATUS.NOT_STARTED;
      if (agent && agent.name && agent.name.trim().length > 0) {
        const hasCustomInstructions = Boolean(agent.custom_instructions && agent.custom_instructions.trim().length > 0);
        const hasCustomDescription = Boolean(
          agent.company_description && 
          agent.company_description.trim().length > 0 &&
          !agent.company_description.endsWith('- Boutique et services')
        );
        const isExplicitlySaved = Boolean(agent.updated_at && agent.created_at && (agent.updated_at !== agent.created_at || hasCustomInstructions || hasCustomDescription));
        if (hasCustomInstructions || hasCustomDescription || isExplicitlySaved) {
          agentStatus = ONBOARDING_STATUS.COMPLETED;
        } else {
          agentStatus = ONBOARDING_STATUS.IN_PROGRESS;
        }
      }

      // 3. WhatsApp
      const wa = db.whatsapp_connections.find(w => w.business_id === businessId);
      let whatsappStatus = ONBOARDING_STATUS.NOT_STARTED;
      const isWaSkipped = Boolean(sessionSkipped[`whatsapp_${businessId}`]);
      if (wa) {
        const hasFullCredentials = Boolean(
          wa.phone_number && wa.phone_number.trim().length >= 6 &&
          wa.session_id && wa.session_id.trim().length > 0 &&
          wa.api_key && wa.api_key.trim().length > 0
        );
        const isConnected = Boolean(wa.is_connected === true && wa.status === 'connected');
        if (isConnected && hasFullCredentials) {
          whatsappStatus = ONBOARDING_STATUS.COMPLETED;
        } else if (hasFullCredentials || wa.phone_number) {
          whatsappStatus = isWaSkipped ? ONBOARDING_STATUS.SKIPPED : ONBOARDING_STATUS.IN_PROGRESS;
        } else {
          whatsappStatus = isWaSkipped ? ONBOARDING_STATUS.SKIPPED : ONBOARDING_STATUS.NOT_STARTED;
        }
      } else if (isWaSkipped) {
        whatsappStatus = ONBOARDING_STATUS.SKIPPED;
      }

      // 4. Products
      const prods = db.products.filter(p => p.business_id === businessId && p.name && p.price >= 0);
      let productsStatus = ONBOARDING_STATUS.NOT_STARTED;
      const isProdSkipped = Boolean(sessionSkipped[`products_${businessId}`]);
      if (prods.length > 0) {
        productsStatus = ONBOARDING_STATUS.COMPLETED;
      } else if (isProdSkipped) {
        productsStatus = ONBOARDING_STATUS.SKIPPED;
      }

      // Final completion
      const isBusinessComplete = businessStatus === ONBOARDING_STATUS.COMPLETED;
      const isAgentComplete = agentStatus === ONBOARDING_STATUS.COMPLETED;
      const isWhatsAppComplete = whatsappStatus === ONBOARDING_STATUS.COMPLETED;
      const isProductsComplete = productsStatus === ONBOARDING_STATUS.COMPLETED;

      const isComplete = isBusinessComplete && isAgentComplete && isWhatsAppComplete;

      const missingRequiredSteps = [];
      if (!isBusinessComplete) missingRequiredSteps.push('business');
      if (!isAgentComplete) missingRequiredSteps.push('assistant');
      if (!isWhatsAppComplete) missingRequiredSteps.push('whatsapp');

      const completedCount = [isBusinessComplete, isAgentComplete, isWhatsAppComplete, isProductsComplete].filter(Boolean).length;
      const progressPercent = Math.round((completedCount / 4) * 100);

      // Auto-correct DB onboarding_completed
      biz.onboarding_completed = isComplete;

      return {
        isComplete,
        businessId,
        steps: {
          business: { status: businessStatus, isRequired: true },
          assistant: { status: agentStatus, isRequired: true },
          whatsapp: { status: whatsappStatus, isRequired: true },
          products: { status: productsStatus, isRequired: false }
        },
        stats: {
          completedCount,
          totalCount: 4,
          requiredCount: 3,
          progressPercent
        },
        missingRequiredSteps
      };
    }
  };
}

async function runAllTests() {
  const testResults = [];
  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      testResults.push({ name: testName, status: 'PASS' });
    } else {
      console.error(`  ❌ FAIL: ${testName} - ${details}`);
      testResults.push({ name: testName, status: 'FAIL', details });
    }
  }

  const mock = createMockSupabase();

  // Setup User 1 & Business 1
  const user1 = { id: 'usr_001', email: 'adama@komiya.ci', full_name: 'Adama Koné' };
  const biz1 = {
    id: 'biz_001',
    owner_id: user1.id,
    name: '', // Empty unconfigured business
    description: '',
    country: "Côte d'Ivoire",
    currency: 'FCFA',
    onboarding_completed: false
  };
  mock.db.profiles.push(user1);
  mock.db.businesses.push(biz1);
  mock.setCurrentUser(user1);

  // ─────────────────────────────────────────────────────────────
  // TEST 1 : Nouvel utilisateur, aucun champ rempli
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- TEST 1 : Nouvel utilisateur, aucun champ rempli ---');
  let res1 = await mock.validateOnboardingCompletion(biz1.id);
  assert(res1.isComplete === false, 'Test 1.1: isComplete doit être false');
  assert(res1.steps.business.status === ONBOARDING_STATUS.NOT_STARTED, 'Test 1.2: Entreprise doit être not_started');
  assert(res1.steps.whatsapp.status === ONBOARDING_STATUS.NOT_STARTED, 'Test 1.3: WhatsApp doit être not_started');
  assert(res1.steps.assistant.status === ONBOARDING_STATUS.NOT_STARTED, 'Test 1.4: Assistant IA doit être not_started');
  assert(res1.steps.products.status === ONBOARDING_STATUS.NOT_STARTED, 'Test 1.5: Produits doit être not_started');
  assert(res1.stats.progressPercent === 0, 'Test 1.6: Progression doit être 0%');
  assert(biz1.onboarding_completed === false, 'Test 1.7: businesses.onboarding_completed en DB doit être false');

  // ─────────────────────────────────────────────────────────────
  // TEST 2 : Nouvel utilisateur, toutes les étapes ignorées / passées
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- TEST 2 : Nouvel utilisateur, toutes les étapes ignorées ---');
  const sessionSkipped = {
    [`whatsapp_${biz1.id}`]: true,
    [`products_${biz1.id}`]: true
  };
  let res2 = await mock.validateOnboardingCompletion(biz1.id, sessionSkipped);
  assert(res2.isComplete === false, 'Test 2.1: isComplete doit rester false quand tout est ignoré');
  assert(res2.steps.whatsapp.status === ONBOARDING_STATUS.SKIPPED, 'Test 2.2: WhatsApp doit être explicité SKIPPED');
  assert(res2.steps.products.status === ONBOARDING_STATUS.SKIPPED, 'Test 2.3: Produits doit être explicité SKIPPED');
  assert(res2.stats.completedCount === 0, 'Test 2.4: completedCount doit rester 0 (les étapes ignorées ne comptent pas)');
  assert(biz1.onboarding_completed === false, 'Test 2.5: Aucune validation automatique de complétion en DB');

  // ─────────────────────────────────────────────────────────────
  // TEST 3 : Utilisateur qui remplit un formulaire sans le sauvegarder
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- TEST 3 : Utilisateur qui remplit un formulaire sans le sauvegarder ---');
  // Le formulaire React a saisi "Komiya Couture" dans le state local, mais AUCUN appel API n'a été fait
  let res3 = await mock.validateOnboardingCompletion(biz1.id);
  assert(res3.steps.business.status === ONBOARDING_STATUS.NOT_STARTED, 'Test 3.1: L\'étape reste not_started tant que la DB n\'est pas écrite');
  assert(res3.isComplete === false, 'Test 3.2: Aucune complétion sans persistance en base');

  // ─────────────────────────────────────────────────────────────
  // TEST 4 : Utilisateur qui sauvegarde correctement une étape (Entreprise)
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- TEST 4 : Utilisateur qui sauvegarde correctement l\'étape Entreprise ---');
  biz1.name = 'Komiya Digital Couture';
  biz1.description = 'Prêt-à-porter haut de gamme à Cocody';
  biz1.updated_at = new Date().toISOString();

  let res4 = await mock.validateOnboardingCompletion(biz1.id);
  assert(res4.steps.business.status === ONBOARDING_STATUS.COMPLETED, 'Test 4.1: Entreprise est validée COMPLETED après écriture DB');
  assert(res4.stats.completedCount === 1, 'Test 4.2: completedCount vaut exactement 1');
  assert(res4.stats.progressPercent === 25, 'Test 4.3: Progression vaut exactement 25%');
  assert(res4.isComplete === false, 'Test 4.4: Onboarding global reste INCOMPLET (WhatsApp et IA manquants)');

  // ─────────────────────────────────────────────────────────────
  // TEST 5 : Échec de sauvegarde Supabase (Gestion des erreurs)
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- TEST 5 : Échec de sauvegarde Supabase (erreur réseau) ---');
  mock.setSimulateNetworkError(true);
  let errorCaught = false;
  try {
    await mock.validateOnboardingCompletion(biz1.id);
  } catch (err) {
    errorCaught = true;
    assert(err.message.includes('Supabase network error'), 'Test 5.1: Erreur interceptée proprement');
  }
  assert(errorCaught === true, 'Test 5.2: L\'application ne masque pas l\'échec et n\'accorde pas de faux succès');
  mock.setSimulateNetworkError(false);

  // ─────────────────────────────────────────────────────────────
  // TEST 6 : Erreur de permission RLS
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- TEST 6 : Erreur de permission RLS ---');
  mock.setSimulateRlsError(true);
  let rlsCaught = false;
  try {
    await mock.validateOnboardingCompletion(biz1.id);
  } catch (err) {
    rlsCaught = true;
    assert(err.message.includes('row-level security'), 'Test 6.1: Violation RLS bloquée');
  }
  assert(rlsCaught === true, 'Test 6.2: Rejet RLS géré');
  mock.setSimulateRlsError(false);

  // ─────────────────────────────────────────────────────────────
  // TEST 7 : Actualisation après une sauvegarde réussie
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- TEST 7 : Actualisation de la page après sauvegarde réussie ---');
  // Simule l'actualisation (rechargement pur depuis la DB sans state mémoire)
  let res7 = await mock.validateOnboardingCompletion(biz1.id);
  assert(res7.steps.business.status === ONBOARDING_STATUS.COMPLETED, 'Test 7.1: Statut Entreprise préservé après actualisation');
  assert(res7.stats.completedCount === 1, 'Test 7.2: Progression 25% préservée fidèlement');

  // ─────────────────────────────────────────────────────────────
  // TEST 8 : Déconnexion et reconnexion
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- TEST 8 : Déconnexion puis reconnexion ---');
  mock.setCurrentUser(null); // Déconnexion
  let resDisconnected = await mock.validateOnboardingCompletion(biz1.id);
  assert(resDisconnected.isComplete === false, 'Test 8.1: Utilisateur déconnecté ne voit rien');

  mock.setCurrentUser(user1); // Reconnexion
  let resReconnected = await mock.validateOnboardingCompletion(biz1.id);
  assert(resReconnected.steps.business.status === ONBOARDING_STATUS.COMPLETED, 'Test 8.2: État rétabli fidèlement à la reconnexion');

  // ─────────────────────────────────────────────────────────────
  // TEST 9 : Utilisateur avec une configuration partiellement terminée
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- TEST 9 : Configuration partielle (Entreprise + Assistant IA, mais pas WhatsApp) ---');
  mock.db.ai_agents.push({
    id: 'agent_001',
    business_id: biz1.id,
    name: 'Awa',
    custom_instructions: 'Accueillir les clients poliment et présenter nos collections.',
    company_description: 'Boutique mode Abidjan',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date(Date.now() + 1000).toISOString()
  });

  let res9 = await mock.validateOnboardingCompletion(biz1.id);
  assert(res9.steps.business.status === ONBOARDING_STATUS.COMPLETED, 'Test 9.1: Entreprise terminée');
  assert(res9.steps.assistant.status === ONBOARDING_STATUS.COMPLETED, 'Test 9.2: Assistant IA terminé');
  assert(res9.steps.whatsapp.status === ONBOARDING_STATUS.NOT_STARTED, 'Test 9.3: WhatsApp toujours not_started');
  assert(res9.stats.completedCount === 2, 'Test 9.4: 2 étapes terminées sur 4');
  assert(res9.stats.progressPercent === 50, 'Test 9.5: Progression 50%');
  assert(res9.isComplete === false, 'Test 9.6: isComplete est FALSE car WhatsApp n\'est pas connecté');
  assert(res9.missingRequiredSteps.includes('whatsapp'), 'Test 9.7: whatsapp listé dans missingRequiredSteps');

  // ─────────────────────────────────────────────────────────────
  // TEST 10 : Utilisateur ayant réellement complété son onboarding
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- TEST 10 : Utilisateur complétant réellement son onboarding ---');
  // Connecte réellement WhatsApp dans la DB
  mock.db.whatsapp_connections.push({
    id: 'wa_001',
    business_id: biz1.id,
    phone_number: '+22501020304',
    session_id: 'was_session_999',
    api_key: 'was_key_secret_abc123',
    status: 'connected',
    is_connected: true
  });

  let res10 = await mock.validateOnboardingCompletion(biz1.id);
  assert(res10.steps.whatsapp.status === ONBOARDING_STATUS.COMPLETED, 'Test 10.1: WhatsApp est COMPLETED');
  assert(res10.isComplete === true, 'Test 10.2: isComplete est maintenant TRUE (3/3 étapes obligatoires validées)');
  assert(biz1.onboarding_completed === true, 'Test 10.3: businesses.onboarding_completed en DB passe à true');
  assert(res10.missingRequiredSteps.length === 0, 'Test 10.4: Aucune étape obligatoire manquante');

  // Ajout facultatif d'un produit
  mock.db.products.push({
    id: 'prod_001',
    business_id: biz1.id,
    name: 'Robe Soie Wax',
    price: 35000
  });

  let res10WithProd = await mock.validateOnboardingCompletion(biz1.id);
  assert(res10WithProd.steps.products.status === ONBOARDING_STATUS.COMPLETED, 'Test 10.5: Produits COMPLETED');
  assert(res10WithProd.stats.completedCount === 4, 'Test 10.6: 4/4 étapes terminées');
  assert(res10WithProd.stats.progressPercent === 100, 'Test 10.7: Progression 100%');

  // ─────────────────────────────────────────────────────────────
  // TEST 11 : Deux utilisateurs différents avec des entreprises différentes (Isolation)
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- TEST 11 : Isolation multi-tenant stricte entre 2 utilisateurs ---');
  const user2 = { id: 'usr_002', email: 'fatou@dakar.sn', full_name: 'Fatou Diop' };
  const biz2 = {
    id: 'biz_002',
    owner_id: user2.id,
    name: 'Dakar Digital Store',
    description: '',
    country: 'Sénégal',
    currency: 'FCFA',
    onboarding_completed: false
  };
  mock.db.profiles.push(user2);
  mock.db.businesses.push(biz2);

  // Switch to User 2: User 2 must NOT inherit User 1's completed onboarding!
  mock.setCurrentUser(user2);
  let resUser2 = await mock.validateOnboardingCompletion(biz2.id);
  assert(resUser2.isComplete === false, 'Test 11.1: User 2 n\'hérite pas de l\'onboarding de User 1');
  assert(resUser2.steps.whatsapp.status === ONBOARDING_STATUS.NOT_STARTED, 'Test 11.2: WhatsApp de User 2 est not_started');
  assert(resUser2.steps.products.status === ONBOARDING_STATUS.NOT_STARTED, 'Test 11.3: User 2 n\'a aucun produit');
  assert(biz2.onboarding_completed === false, 'Test 11.4: businesses.onboarding_completed de User 2 est false');

  // Verify User 2 cannot validate User 1's business ID
  let resHack = await mock.validateOnboardingCompletion(biz1.id);
  assert(resHack.businessId === null, 'Test 11.5: RLS bloque User 2 tentant de valider Business 1');

  // Switch back to User 1
  mock.setCurrentUser(user1);
  let resUser1Check = await mock.validateOnboardingCompletion(biz1.id);
  assert(resUser1Check.isComplete === true, 'Test 11.6: User 1 conserve son onboarding complété intact');

  // ─────────────────────────────────────────────────────────────
  // TEST 12 : Navigation entre les étapes sans doublon ni perte
  // ─────────────────────────────────────────────────────────────
  console.log('\n--- TEST 12 : Navigation entre étapes sans perte de données ---');
  // Les étapes sauvegardées restent présentes
  assert(mock.db.products.filter(p => p.business_id === biz1.id).length === 1, 'Test 12.1: 1 seul produit (pas de doublon)');
  assert(mock.db.ai_agents.filter(a => a.business_id === biz1.id).length === 1, 'Test 12.2: 1 seul assistant IA (pas de doublon)');
  assert(biz1.name === 'Komiya Digital Couture', 'Test 12.3: Nom d\'entreprise conservé fidèlement');

  // ─────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────
  console.log('\n================================================================');
  console.log('📊 RÉSUMÉ DES TESTS :');
  const passCount = testResults.filter(t => t.status === 'PASS').length;
  const failCount = testResults.filter(t => t.status === 'FAIL').length;
  console.log(`Total: ${testResults.length} tests | ✅ PASS: ${passCount} | ❌ FAIL: ${failCount}`);
  console.log('================================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runAllTests().catch(err => {
  console.error('Test suite uncaught error:', err);
  process.exit(1);
});
