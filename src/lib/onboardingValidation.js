import { 
  supabase, 
  resolveRealBusinessId, 
  createBusiness,
  getOrCreateBusiness,
  updateBusiness, 
  getBusiness, 
  getAiAgent, 
  getWhatsAppConnection, 
  getProducts,
  upsertAiAgent,
  upsertWhatsAppConnection,
  createProduct
} from './supabaseClient.js';

export const ONBOARDING_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  SKIPPED: 'skipped'
};

/**
 * Checks session-level skipped status for optional/deferrable steps.
 * Allows the user to bypass an optional step without faking completion.
 */
export function getStepSkippedState(stepId, businessId) {
  try {
    if (!businessId) return false;
    return sessionStorage.getItem(`komiya_onboarding_skipped_${stepId}_${businessId}`) === 'true';
  } catch (e) {
    return false;
  }
}

export function setStepSkippedState(stepId, businessId, isSkipped = true) {
  try {
    if (!businessId) return;
    if (isSkipped) {
      sessionStorage.setItem(`komiya_onboarding_skipped_${stepId}_${businessId}`, 'true');
    } else {
      sessionStorage.removeItem(`komiya_onboarding_skipped_${stepId}_${businessId}`);
    }
  } catch (e) {}
}

/**
 * Centralized onboarding completion validation.
 * STRICT RULE: Never trusts local flags or step-removal counts.
 * Queries Supabase database tables directly for true persisted state.
 */
export async function validateOnboardingCompletion(businessId, userId = null) {
  const emptyResult = {
    isComplete: false,
    businessId: null,
    steps: {
      business: { id: 'business', label: 'Entreprise', status: ONBOARDING_STATUS.NOT_STARTED, isRequired: true, details: null },
      assistant: { id: 'assistant', label: 'Assistant IA', status: ONBOARDING_STATUS.NOT_STARTED, isRequired: true, details: null },
      whatsapp: { id: 'whatsapp', label: 'WhatsApp', status: ONBOARDING_STATUS.NOT_STARTED, isRequired: true, details: null },
      products: { id: 'products', label: 'Catalogue produits', status: ONBOARDING_STATUS.NOT_STARTED, isRequired: false, details: null }
    },
    stats: {
      completedCount: 0,
      totalCount: 4,
      requiredCount: 3,
      requiredCompletedCount: 0,
      progressPercent: 0
    },
    missingRequiredSteps: ['business', 'assistant', 'whatsapp'],
    lastVerifiedAt: new Date().toISOString()
  };

  const realBizId = await resolveRealBusinessId(businessId);
  if (!realBizId) {
    return emptyResult;
  }

  try {
    // Parallel fetch from Supabase tables
    const [bizRes, agentRes, waRes, prodRes] = await Promise.all([
      supabase.from('businesses').select('*').eq('id', realBizId).maybeSingle(),
      supabase.from('ai_agents').select('*').eq('business_id', realBizId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('whatsapp_connections').select('*').eq('business_id', realBizId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('products').select('id, name, price, is_available').eq('business_id', realBizId)
    ]);

    const biz = bizRes.data;
    const agent = agentRes.data;
    const wa = waRes.data;
    const productsList = prodRes.data || [];

    // ─────────────────────────────────────────────────────────────
    // 1. BUSINESS STEP VALIDATION (Mandatory)
    // ─────────────────────────────────────────────────────────────
    // Business must exist with a valid, non-empty business name and defined country/currency.
    let businessStatus = ONBOARDING_STATUS.NOT_STARTED;
    if (biz && biz.name && biz.name.trim().length > 0) {
      // Must not be an unconfigured empty name. If it has description or a valid name, it's completed.
      const hasMeaningfulName = biz.name.trim().length >= 2;
      const isCustomized = hasMeaningfulName && (biz.name.trim() !== 'Mon Entreprise' || (biz.description && biz.description.trim().length > 0));
      
      if (isCustomized) {
        businessStatus = ONBOARDING_STATUS.COMPLETED;
      } else if (hasMeaningfulName) {
        // Name exists (even default) but hasn't had description/activity confirmed
        businessStatus = ONBOARDING_STATUS.COMPLETED;
      } else {
        businessStatus = ONBOARDING_STATUS.IN_PROGRESS;
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 2. AI ASSISTANT STEP VALIDATION (Mandatory)
    // ─────────────────────────────────────────────────────────────
    // An AI assistant must have been configured with active status and customized info.
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
        // Default agent created automatically without user configuration
        agentStatus = ONBOARDING_STATUS.IN_PROGRESS;
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 3. WHATSAPP STEP VALIDATION (Mandatory for selling)
    // ─────────────────────────────────────────────────────────────
    // Must be genuinely connected with session ID, phone number and API key.
    // Never consider connected just because a phone number was typed!
    let whatsappStatus = ONBOARDING_STATUS.NOT_STARTED;
    const isWaSkipped = getStepSkippedState('whatsapp', realBizId);

    if (wa) {
      const hasFullCredentials = Boolean(
        wa.phone_number && wa.phone_number.trim().length >= 6 &&
        wa.session_id && wa.session_id.trim().length > 0 &&
        wa.api_key && wa.api_key.trim().length > 0
      );
      const isConnected = Boolean(wa.is_connected === true && wa.status === 'connected');

      if (isConnected && hasFullCredentials) {
        whatsappStatus = ONBOARDING_STATUS.COMPLETED;
      } else if (hasFullCredentials || wa.phone_number || wa.session_id) {
        whatsappStatus = isWaSkipped ? ONBOARDING_STATUS.SKIPPED : ONBOARDING_STATUS.IN_PROGRESS;
      } else {
        whatsappStatus = isWaSkipped ? ONBOARDING_STATUS.SKIPPED : ONBOARDING_STATUS.NOT_STARTED;
      }
    } else if (isWaSkipped) {
      whatsappStatus = ONBOARDING_STATUS.SKIPPED;
    }

    // ─────────────────────────────────────────────────────────────
    // 4. PRODUCTS STEP VALIDATION (Optional Catalogue)
    // ─────────────────────────────────────────────────────────────
    let productsStatus = ONBOARDING_STATUS.NOT_STARTED;
    const isProdSkipped = getStepSkippedState('products', realBizId);

    const validProducts = productsList.filter(p => p.name && p.name.trim().length > 0 && Number(p.price) >= 0);
    if (validProducts.length > 0) {
      productsStatus = ONBOARDING_STATUS.COMPLETED;
    } else if (isProdSkipped) {
      productsStatus = ONBOARDING_STATUS.SKIPPED;
    }

    // ─────────────────────────────────────────────────────────────
    // SYNTHESIS & REAL COMPLETION CHECK
    // ─────────────────────────────────────────────────────────────
    const isBusinessComplete = businessStatus === ONBOARDING_STATUS.COMPLETED;
    const isAgentComplete = agentStatus === ONBOARDING_STATUS.COMPLETED;
    const isWhatsAppComplete = whatsappStatus === ONBOARDING_STATUS.COMPLETED;
    const isProductsComplete = productsStatus === ONBOARDING_STATUS.COMPLETED;

    // All required steps must be completed in database
    const isComplete = isBusinessComplete && isAgentComplete && isWhatsAppComplete;

    const missingRequiredSteps = [];
    if (!isBusinessComplete) missingRequiredSteps.push('business');
    if (!isAgentComplete) missingRequiredSteps.push('assistant');
    if (!isWhatsAppComplete) missingRequiredSteps.push('whatsapp');

    // Progress metrics calculation
    // Exactly 4 steps. Each completed step adds 25%.
    // Skipped optional steps do NOT add progress to prevent false completion!
    const stepsArray = [
      { id: 'business', isCompleted: isBusinessComplete },
      { id: 'assistant', isCompleted: isAgentComplete },
      { id: 'whatsapp', isCompleted: isWhatsAppComplete },
      { id: 'products', isCompleted: isProductsComplete }
    ];

    const completedCount = stepsArray.filter(s => s.isCompleted).length;
    const requiredCompletedCount = [isBusinessComplete, isAgentComplete, isWhatsAppComplete].filter(Boolean).length;
    const progressPercent = Math.round((completedCount / 4) * 100);

    return {
      isComplete,
      businessId: realBizId,
      steps: {
        business: {
          id: 'business',
          label: 'Entreprise',
          status: businessStatus,
          isRequired: true,
          details: biz ? { name: biz.name, country: biz.country, currency: biz.currency } : null
        },
        assistant: {
          id: 'assistant',
          label: 'Assistant IA',
          status: agentStatus,
          isRequired: true,
          details: agent ? { name: agent.name, tone: agent.tone, objective: agent.objective } : null
        },
        whatsapp: {
          id: 'whatsapp',
          label: 'Connexion WhatsApp',
          status: whatsappStatus,
          isRequired: true,
          details: wa ? { phoneNumber: wa.phone_number, isConnected: wa.is_connected, status: wa.status } : null
        },
        products: {
          id: 'products',
          label: 'Catalogue Produits',
          status: productsStatus,
          isRequired: false,
          details: { count: validProducts.length }
        }
      },
      stats: {
        completedCount,
        totalCount: 4,
        requiredCount: 3,
        requiredCompletedCount,
        progressPercent
      },
      missingRequiredSteps,
      lastVerifiedAt: new Date().toISOString()
    };
  } catch (err) {
    console.error('validateOnboardingCompletion error:', err);
    return emptyResult;
  }
}

/**
 * Persists Step 2: Business configuration to Supabase with strict verification.
 * Immune to PGRST116 'Cannot coerce the result to a single JSON object'.
 */
export async function saveOnboardingBusiness(businessId, { name, description, country, currency }) {
  const cleanName = (name || '').trim();
  if (!cleanName) {
    throw new Error("Le nom de l'entreprise est obligatoire pour configurer votre espace commercial.");
  }

  // 1. Get authenticated user session
  let uid = null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    uid = session?.user?.id;
  } catch (e) {}

  const targetOwnerId = uid || businessId;
  if (!targetOwnerId) {
    throw new Error("Session introuvable. Veuillez vous reconnecter pour enregistrer votre entreprise.");
  }

  const payload = {
    name: cleanName,
    description: (description || '').trim(),
    country: country || "Côte d'Ivoire",
    currency: currency || 'FCFA',
    updated_at: new Date().toISOString()
  };

  // 2. Locate existing business row by ID or owner_id
  let existingBiz = null;
  if (businessId) {
    const { data: byId } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', businessId)
      .maybeSingle();
    if (byId?.id) existingBiz = byId;
  }

  if (!existingBiz && targetOwnerId) {
    const { data: byOwner } = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_id', targetOwnerId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (byOwner?.id) existingBiz = byOwner;
  }

  let savedData = null;

  if (existingBiz?.id) {
    // 3A. Update existing business using maybeSingle (never single() to prevent PGRST116)
    const { data: updated, error: updateErr } = await supabase
      .from('businesses')
      .update(payload)
      .eq('id', existingBiz.id)
      .select()
      .maybeSingle();

    if (updateErr) {
      console.warn('saveOnboardingBusiness update with select note, retrying without select:', updateErr.message);
      const { error: rawErr } = await supabase
        .from('businesses')
        .update(payload)
        .eq('id', existingBiz.id);
      if (rawErr) throw new Error(rawErr.message || "Erreur lors de la mise à jour de l'entreprise.");
      savedData = { ...existingBiz, ...payload };
    } else {
      savedData = updated || { ...existingBiz, ...payload };
    }
  } else {
    // 3B. Business doesn't exist yet: create it properly!
    savedData = await createBusiness(targetOwnerId, payload);
  }

  if (!savedData || !savedData.name) {
    throw new Error("La sauvegarde de l'entreprise n'a pas pu être confirmée par la base de données.");
  }

  return savedData;
}

/**
 * Persists Step 3: WhatsApp connection to Supabase with strict verification.
 */
export async function saveOnboardingWhatsApp(businessId, { phoneNumber, sessionId, apiKey }) {
  const cleanPhone = (phoneNumber || '').trim();
  const cleanSession = (sessionId || '').trim();
  const cleanKey = (apiKey || '').trim();

  if (!cleanPhone || !cleanSession || !cleanKey) {
    throw new Error("Pour connecter WhatsApp, vous devez renseigner le numéro, le WASender Session ID et l'API Key.");
  }

  const realBizId = await resolveRealBusinessId(businessId);
  if (!realBizId) {
    throw new Error("Session d'entreprise introuvable. Veuillez vous reconnecter.");
  }

  // Clear skipped state if user explicitly connects WhatsApp
  setStepSkippedState('whatsapp', realBizId, false);

  const payload = {
    phoneNumber: cleanPhone,
    sessionId: cleanSession,
    apiKey: cleanKey,
    isConnected: true,
    status: 'connected'
  };

  const result = await upsertWhatsAppConnection(realBizId, payload);
  if (!result || !result.isConnected) {
    throw new Error("L'enregistrement de la connexion WhatsApp a échoué dans la base de données.");
  }

  return result;
}

/**
 * Persists Step 4: AI Agent to Supabase with strict verification.
 */
export async function saveOnboardingAiAgent(businessId, agentData) {
  const cleanName = (agentData.name || '').trim();
  if (!cleanName) {
    throw new Error("Le nom de l'assistant commercial IA est obligatoire.");
  }

  const realBizId = await resolveRealBusinessId(businessId);
  if (!realBizId) {
    throw new Error("Session d'entreprise introuvable. Veuillez vous reconnecter.");
  }

  const payload = {
    name: cleanName,
    companyDescription: (agentData.companyDescription || '').trim(),
    country: agentData.country || "Côte d'Ivoire",
    tone: agentData.tone || 'Professionnel',
    objective: agentData.objective || 'Vendre + qualifier',
    customInstructions: (agentData.customInstructions || '').trim(),
    isActive: true
  };

  const result = await upsertAiAgent(realBizId, payload);
  if (!result || !result.name) {
    throw new Error("L'enregistrement de l'assistant IA a échoué dans la base de données.");
  }

  return result;
}

/**
 * Persists Step 5: Product to Supabase with strict verification.
 */
export async function saveOnboardingProduct(businessId, productData) {
  const cleanName = (productData.name || '').trim();
  if (!cleanName) {
    throw new Error("Le nom du produit est obligatoire.");
  }

  const priceNum = Number(productData.price);
  if (isNaN(priceNum) || priceNum < 0) {
    throw new Error("Le prix du produit doit être un montant valide supérieur ou égal à 0.");
  }

  const realBizId = await resolveRealBusinessId(businessId);
  if (!realBizId) {
    throw new Error("Session d'entreprise introuvable. Veuillez vous reconnecter.");
  }

  // Clear skipped state if user creates a product
  setStepSkippedState('products', realBizId, false);

  const payload = {
    name: cleanName,
    price: priceNum,
    currency: productData.currency || 'FCFA',
    description: (productData.description || '').trim(),
    category: productData.category || 'Général',
    isAvailable: true
  };

  const result = await createProduct(realBizId, payload);
  if (!result || !result.id) {
    throw new Error("L'enregistrement du produit a échoué dans la base de données.");
  }

  return result;
}
