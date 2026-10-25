import { createClient } from '@supabase/supabase-js';

const defaultSupabaseUrl = 'https://glbbwuyznvuybyredtvq.supabase.co';
const defaultSupabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsYmJ3dXl6bnZ1eWJ5cmVkdHZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk4MjU4NjIsImV4cCI6MjEwNTQwMTg2Mn0.h_D3gDBwMZTGiGGChj55TAAl_t2360l1cewKO91khy8';

const metaEnv = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};
const procEnv = (typeof process !== 'undefined' && process.env) ? process.env : {};

const supabaseUrl = metaEnv.VITE_SUPABASE_URL || procEnv.VITE_SUPABASE_URL || procEnv.SUPABASE_URL || defaultSupabaseUrl;
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || procEnv.VITE_SUPABASE_ANON_KEY || procEnv.SUPABASE_ANON_KEY || defaultSupabaseAnonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// ─── PROFILE HELPERS ──────────────────────────────────────────────

export async function getProfile(userId) {
  if (!userId) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

export async function upsertProfile(userId, updates) {
  if (!userId) return null;
  const payload = {
    id: userId,
    ...updates,
    updated_at: new Date().toISOString()
  };

  // 1. Try direct update first to preserve email NOT NULL constraint
  const { data: updateData, error: updateError } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .maybeSingle();

  if (!updateError && updateData) {
    return updateData;
  }

  // 2. If row does not exist yet, fallback to upsert
  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── BUSINESS HELPERS ─────────────────────────────────────────────

export async function getBusiness(ownerId) {
  if (!ownerId) return null;
  try {
    // 1. Fetch plain business row first (never fails on relation join)
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.warn('getBusiness select error:', error.message);
      // Fallback: try querying without order
      const { data: fallbackData } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', ownerId)
        .limit(1)
        .maybeSingle();
      if (fallbackData) return fallbackData;
      return null;
    }

    if (!data) return null;

    // 2. Fetch whatsapp_connections separately to guarantee no join error can crash getBusiness
    try {
      const { data: waConns } = await supabase
        .from('whatsapp_connections')
        .select('*')
        .eq('business_id', data.id)
        .order('created_at', { ascending: false });
      data.whatsapp_connections = waConns || [];
    } catch (e) {
      data.whatsapp_connections = [];
    }

    return data;
  } catch (e) {
    console.warn('getBusiness catch error:', e);
    return null;
  }
}

export async function createBusiness(ownerId, businessData = {}) {
  if (!ownerId) throw new Error('ownerId requis pour créer une entreprise');

  // 1. Check if one already exists first
  try {
    const existing = await getBusiness(ownerId);
    if (existing?.id) return existing;
  } catch (e) {
    // continue
  }

  // 2. Ensure profile exists in public.profiles first!
  // In Supabase schema: businesses.owner_id REFERENCES public.profiles(id)
  try {
    const { data: existingProf } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', ownerId)
      .maybeSingle();

    if (!existingProf) {
      const userEmail = businessData.email || 'user@komiya.ci';
      const userFullName = businessData.fullName || businessData.name || 'Propriétaire';
      await supabase
        .from('profiles')
        .upsert({
          id: ownerId,
          email: userEmail,
          full_name: userFullName,
          role: 'owner',
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
    }
  } catch (profErr) {
    console.warn('Profile ensure before business create note:', profErr);
  }

  const payload = {
    owner_id: ownerId,
    name: businessData.name || 'Mon Entreprise',
    description: businessData.description || '',
    country: businessData.country || 'Côte d\'Ivoire',
    currency: businessData.currency || 'FCFA',
    onboarding_completed: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('businesses')
    .insert(payload)
    .select()
    .maybeSingle();

  if (error) {
    console.warn('createBusiness insert note, attempting recovery:', error.message);
    // If duplicate or conflict, fetch the existing one directly
    const { data: recovered } = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_id', ownerId)
      .limit(1)
      .maybeSingle();

    if (recovered?.id) return recovered;

    // Retry insert without select in case select RLS policy failed
    const { error: rawErr } = await supabase
      .from('businesses')
      .insert(payload);

    if (!rawErr) {
      const { data: retryFetch } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', ownerId)
        .limit(1)
        .maybeSingle();
      if (retryFetch?.id) return retryFetch;
    }

    throw error;
  }

  return data;
}

export async function getOrCreateBusiness(ownerId, defaultData = {}) {
  if (!ownerId) return null;
  let biz = await getBusiness(ownerId);
  if (!biz?.id) {
    biz = await createBusiness(ownerId, defaultData);
  }
  return biz;
}

export async function updateBusiness(businessId, updates) {
  if (!businessId) return null;
  const { data, error } = await supabase
    .from('businesses')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', businessId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ─── PRODUCTS HELPERS ─────────────────────────────────────────────

export async function getProducts(businessId) {
  if (!businessId) return [];
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        faqs:product_faqs(id, question, answer)
      `)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getProducts error:', error.message);
      return [];
    }

    return (data || []).map(p => ({
      id: p.id,
      businessId: p.business_id,
      name: p.name,
      description: p.description,
      price: Number(p.price) || 0,
      currency: p.currency || 'FCFA',
      category: p.category || 'Général',
      isAvailable: p.is_available ?? true,
      salesArguments: p.sales_arguments || [],
      imageUrl: p.image_url || '',
      faqs: p.faqs || [],
      createdAt: p.created_at
    }));
  } catch (err) {
    console.error('getProducts error:', err);
    return [];
  }
}

export async function createProduct(businessId, product) {
  const { data, error } = await supabase
    .from('products')
    .insert({
      business_id: businessId,
      name: product.name,
      description: product.description,
      price: Number(product.price) || 0,
      currency: product.currency || 'FCFA',
      category: product.category || 'Général',
      is_available: product.isAvailable ?? true,
      sales_arguments: product.salesArguments || [],
      image_url: product.imageUrl || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();
  if (error) throw error;

  // Insert FAQs if any
  if (product.faqs && product.faqs.length > 0) {
    const faqRows = product.faqs.map(f => ({
      product_id: data.id,
      question: f.question,
      answer: f.answer,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    await supabase.from('product_faqs').insert(faqRows);
  }

  return {
    ...data,
    businessId: data.business_id,
    isAvailable: data.is_available,
    salesArguments: data.sales_arguments,
    imageUrl: data.image_url,
    faqs: product.faqs || []
  };
}

export async function updateProduct(productId, updates) {
  const payload = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) payload.name = updates.name;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.price !== undefined) payload.price = Number(updates.price);
  if (updates.currency !== undefined) payload.currency = updates.currency;
  if (updates.category !== undefined) payload.category = updates.category;
  if (updates.isAvailable !== undefined) payload.is_available = updates.isAvailable;
  if (updates.salesArguments !== undefined) payload.sales_arguments = updates.salesArguments;
  if (updates.imageUrl !== undefined) payload.image_url = updates.imageUrl;

  const { data, error } = await supabase
    .from('products')
    .update(payload)
    .eq('id', productId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProduct(productId) {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId);
  if (error) throw error;
}

// ─── CONTACTS HELPERS ─────────────────────────────────────────────

export async function getContacts(businessId) {
  if (!businessId) return [];
  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('business_id', businessId)
      .order('last_interaction_at', { ascending: false });

    if (error) {
      console.error('getContacts error:', error.message);
      return [];
    }

    return (data || []).map(formatContact);
  } catch (err) {
    console.error('getContacts error:', err);
    return [];
  }
}

function formatContact(c) {
  return {
    id: c.id,
    businessId: c.business_id,
    name: c.name || 'Prospect WhatsApp',
    whatsappNumber: c.whatsapp_number,
    source: c.source || 'WhatsApp Webhook',
    need: c.need || '',
    budget: c.budget || '',
    location: c.location || '',
    status: c.status || 'Nouveau',
    score: c.score ?? 0,
    lastMessage: c.last_message || '',
    lastInteractionAt: c.last_interaction_at,
    createdAt: c.created_at
  };
}

export async function updateContactStatus(contactId, status, score) {
  const updates = { status, updated_at: new Date().toISOString() };
  if (score !== undefined) updates.score = score;
  const { data, error } = await supabase
    .from('contacts')
    .update(updates)
    .eq('id', contactId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createContact(businessId, contactData) {
  if (!businessId) throw new Error('businessId requis pour créer un contact');
  const payload = {
    business_id: businessId,
    name: contactData.name || 'Prospect WhatsApp',
    whatsapp_number: contactData.whatsappNumber || contactData.whatsapp_number,
    need: contactData.need || '',
    budget: contactData.budget || '',
    location: contactData.location || '',
    status: contactData.status || 'Nouveau',
    score: Number(contactData.score) || 50,
    source: contactData.source || 'Manuel',
    last_message: contactData.lastMessage || 'Contact créé manuellement',
    last_interaction_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  const { data, error } = await supabase
    .from('contacts')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return formatContact(data);
}

// ─── CONVERSATIONS HELPERS ────────────────────────────────────────

export async function getConversations(businessId) {
  if (!businessId) return [];
  try {
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        contact:contacts(id, name, whatsapp_number, status, score, need, budget, location)
      `)
      .eq('business_id', businessId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('getConversations error:', error.message);
      return [];
    }

    return (data || []).map(formatConv);
  } catch (err) {
    console.error('getConversations error:', err);
    return [];
  }
}

function formatConv(conv) {
  return {
    id: conv.id,
    businessId: conv.business_id,
    contactId: conv.contact_id,
    contactName: conv.contact?.name || 'Prospect WhatsApp',
    whatsappNumber: conv.contact?.whatsapp_number || '',
    isAiActive: conv.is_ai_active ?? true,
    unreadCount: conv.unread_count || 0,
    status: conv.status || 'active',
    updatedAt: conv.updated_at,
    contact: conv.contact ? {
      id: conv.contact.id,
      name: conv.contact.name,
      whatsappNumber: conv.contact.whatsapp_number,
      status: conv.contact.status,
      score: conv.contact.score,
      need: conv.contact.need,
      budget: conv.contact.budget,
      location: conv.contact.location
    } : null
  };
}

export async function getMessages(conversationId) {
  if (!conversationId) return [];
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []).map(m => ({
    id: m.id,
    conversationId: m.conversation_id,
    direction: m.direction,
    senderType: m.sender_type,
    content: m.content,
    timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    createdAt: m.created_at
  }));
}

export async function createMessage(conversationId, message) {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      direction: message.direction || 'outbound',
      sender_type: message.senderType || 'human',
      content: message.content,
      created_at: new Date().toISOString()
    })
    .select()
    .single();
  if (error) throw error;

  // Touch conversation updated_at
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId);

  return {
    id: data.id,
    conversationId: data.conversation_id,
    direction: data.direction,
    senderType: data.sender_type,
    content: data.content,
    timestamp: new Date(data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
}

export async function toggleConversationAI(conversationId, isAiActive) {
  const { data, error } = await supabase
    .from('conversations')
    .update({ is_ai_active: isAiActive, updated_at: new Date().toISOString() })
    .eq('id', conversationId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── CONVERSATION NOTES & TAGS ────────────────────────────────────

export async function getConversationNotes(conversationId) {
  if (!conversationId) return [];
  const { data, error } = await supabase
    .from('conversation_notes')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });
  if (error) return [];
  return (data || []).map(n => n.content);
}

export async function addConversationNote(conversationId, authorId, content) {
  const { data, error } = await supabase
    .from('conversation_notes')
    .insert({
      conversation_id: conversationId,
      author_id: authorId,
      content,
      created_at: new Date().toISOString()
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getTags(businessId) {
  if (!businessId) return [];
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .eq('business_id', businessId);
  if (error) return [];
  return data || [];
}

export async function createTag(businessId, name, color = '#00C896') {
  const { data, error } = await supabase
    .from('tags')
    .insert({ business_id: businessId, name, color })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── AI AGENT HELPERS ─────────────────────────────────────────────

export async function getAiAgent(businessId) {
  if (!businessId) return null;
  const { data, error } = await supabase
    .from('ai_agents')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  if (!data) return null;

  return {
    id: data.id,
    businessId: data.business_id,
    name: data.name || 'Awa',
    companyDescription: data.company_description || '',
    productsSummary: data.products_summary || '',
    idealClient: data.ideal_client || '',
    country: data.country || 'Côte d\'Ivoire',
    tone: data.tone || 'Professionnel',
    objective: data.objective || 'Vendre + qualifier',
    customInstructions: data.custom_instructions || '',
    isActive: data.is_active ?? true
  };
}

export async function upsertAiAgent(businessId, agentData) {
  const existing = await getAiAgent(businessId);
  const payload = {
    name: agentData.name || existing?.name || 'Awa',
    company_description: agentData.companyDescription || agentData.company_description || existing?.companyDescription || '',
    products_summary: agentData.productsSummary || agentData.products_summary || existing?.productsSummary || '',
    ideal_client: agentData.idealClient || agentData.ideal_client || existing?.idealClient || '',
    country: agentData.country || existing?.country || 'Côte d\'Ivoire',
    tone: agentData.tone || existing?.tone || 'Professionnel',
    objective: agentData.objective || existing?.objective || 'Vendre + qualifier',
    custom_instructions: agentData.customInstructions || agentData.custom_instructions || existing?.customInstructions || '',
    is_active: agentData.isActive ?? agentData.is_active ?? existing?.isActive ?? true,
    updated_at: new Date().toISOString()
  };

  if (existing?.id) {
    const { data, error } = await supabase
      .from('ai_agents')
      .update(payload)
      .eq('id', existing.id)
      .select()
      .maybeSingle();
    if (error) throw error;
    const res = data || { ...payload, id: existing.id, business_id: businessId };
    return {
      ...res,
      id: res.id,
      businessId: res.business_id,
      companyDescription: res.company_description,
      productsSummary: res.products_summary,
      idealClient: res.ideal_client,
      customInstructions: res.custom_instructions,
      isActive: res.is_active
    };
  } else {
    const { data, error } = await supabase
      .from('ai_agents')
      .insert({ ...payload, business_id: businessId, created_at: new Date().toISOString() })
      .select()
      .maybeSingle();
    if (error) throw error;
    const res = data || { ...payload, business_id: businessId };
    return {
      ...res,
      businessId: res.business_id,
      companyDescription: res.company_description,
      productsSummary: res.products_summary,
      idealClient: res.ideal_client,
      customInstructions: res.custom_instructions,
      isActive: res.is_active
    };
  }
}

export async function toggleAiAgentActive(businessId, isActive) {
  return upsertAiAgent(businessId, { isActive });
}

// ─── WHATSAPP HELPERS ─────────────────────────────────────────────

export async function getWhatsAppConnection(businessId) {
  if (!businessId) return null;
  const { data, error } = await supabase
    .from('whatsapp_connections')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  if (!data) return null;

  return {
    id: data.id,
    businessId: data.business_id,
    sessionId: data.session_id || '',
    phoneNumber: data.phone_number || '',
    apiKey: data.api_key || '',
    status: data.status || 'disconnected',
    isConnected: data.is_connected ?? false,
    lastSyncAt: data.last_sync_at
  };
}

export async function upsertWhatsAppConnection(businessId, connectionData) {
  const existing = await getWhatsAppConnection(businessId);
  const payload = {
    session_id: connectionData.sessionId || connectionData.session_id || existing?.sessionId || '',
    phone_number: connectionData.phoneNumber || connectionData.phone_number || existing?.phoneNumber || '',
    api_key: connectionData.apiKey || connectionData.api_key || existing?.apiKey || '',
    status: connectionData.status || (connectionData.isConnected ? 'connected' : 'disconnected'),
    is_connected: connectionData.isConnected ?? true,
    last_sync_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (existing?.id) {
    const { data, error } = await supabase
      .from('whatsapp_connections')
      .update(payload)
      .eq('id', existing.id)
      .select()
      .maybeSingle();
    if (error) throw error;
    const res = data || { ...payload, id: existing.id, business_id: businessId };
    return {
      ...res,
      businessId: res.business_id,
      sessionId: res.session_id,
      phoneNumber: res.phone_number,
      apiKey: res.api_key,
      isConnected: res.is_connected
    };
  } else {
    const { data, error } = await supabase
      .from('whatsapp_connections')
      .insert({ ...payload, business_id: businessId, created_at: new Date().toISOString() })
      .select()
      .maybeSingle();
    if (error) throw error;
    const res = data || { ...payload, business_id: businessId };
    return {
      ...res,
      businessId: res.business_id,
      sessionId: res.session_id,
      phoneNumber: res.phone_number,
      apiKey: res.api_key,
      isConnected: res.is_connected
    };
  }
}

// ─── AUTOMATIONS HELPERS ──────────────────────────────────────────

export async function getAutomations(businessId) {
  if (!businessId) return [];
  const { data, error } = await supabase
    .from('automations')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  if (!data || data.length === 0) {
    return upsertDefaultAutomations(businessId);
  }
  return data.map(a => ({
    id: a.id,
    businessId: a.business_id,
    name: a.name,
    triggerType: a.trigger_type,
    isEnabled: a.is_enabled ?? true,
    settingsJson: a.settings_json || {},
    description: a.settings_json?.description || ''
  }));
}

export async function updateAutomation(automationId, isEnabled, settingsJson) {
  const updates = { is_enabled: isEnabled, updated_at: new Date().toISOString() };
  if (settingsJson) updates.settings_json = settingsJson;

  const { data, error } = await supabase
    .from('automations')
    .update(updates)
    .eq('id', automationId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function upsertDefaultAutomations(businessId) {
  if (!businessId) return [];
  const defaults = [
    {
      business_id: businessId,
      name: 'Réponse instantanée IA',
      trigger_type: 'instant_reply',
      is_enabled: true,
      settings_json: { description: "L'IA répond en moins de 10 secondes aux nouveaux messages entrants." }
    },
    {
      business_id: businessId,
      name: 'Qualification automatique des leads',
      trigger_type: 'qualification',
      is_enabled: true,
      settings_json: { description: "Extrait le besoin, le budget et le produit d'intérêt pendant l'échange." }
    },
    {
      business_id: businessId,
      name: 'Relance automatique des prospects inactifs',
      trigger_type: 'follow_up',
      is_enabled: true,
      settings_json: { description: "Envoie un message de relance personnalisé si le prospect ne répond plus." }
    },
    {
      business_id: businessId,
      name: 'Passage de main humain (Alerte)',
      trigger_type: 'human_handover',
      is_enabled: true,
      settings_json: { description: "Désactive l'IA et alerte le propriétaire si un humain est demandé." }
    }
  ];

  const { data, error } = await supabase
    .from('automations')
    .upsert(defaults, { onConflict: 'business_id,trigger_type' })
    .select();
  if (error) {
    // If table doesn't have unique constraint, fallback to insert
    const insertRes = await supabase.from('automations').insert(defaults).select();
    if (!insertRes.error && insertRes.data) {
      return insertRes.data.map(a => ({
        id: a.id,
        businessId: a.business_id,
        name: a.name,
        triggerType: a.trigger_type,
        isEnabled: a.is_enabled ?? true,
        settingsJson: a.settings_json || {},
        description: a.settings_json?.description || ''
      }));
    }
  }
  return (data || []).map(a => ({
    id: a.id,
    businessId: a.business_id,
    name: a.name,
    triggerType: a.trigger_type,
    isEnabled: a.is_enabled ?? true,
    settingsJson: a.settings_json || {},
    description: a.settings_json?.description || ''
  }));
}

// ─── ANALYTICS & DASHBOARD HELPERS ────────────────────────────────

export async function getDashboardStats(businessId) {
  if (!businessId) {
    return {
      conversationsCount: 0,
      todayConversationsCount: 0,
      qualifiedContactsCount: 0,
      followUpContactsCount: 0,
      clientsCount: 0,
      totalMessagesCount: 0,
      totalProductsCount: 0,
      qualificationRate: '0%',
      recentActivity: []
    };
  }

  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayIso = todayStart.toISOString();

    const [
      convAll,
      convToday,
      contactsAll,
      contactsQualified,
      contactsFollowUp,
      contactsClient,
      productsAll,
      recentContacts
    ] = await Promise.all([
      supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('business_id', businessId),
      supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('business_id', businessId).gte('created_at', todayIso),
      supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('business_id', businessId),
      supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('business_id', businessId).eq('status', 'Qualifié'),
      supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('business_id', businessId).eq('status', 'À relancer'),
      supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('business_id', businessId).eq('status', 'Client'),
      supabase.from('products').select('id, price', { count: 'exact' }).eq('business_id', businessId),
      supabase.from('contacts').select('*').eq('business_id', businessId).order('last_interaction_at', { ascending: false }).limit(6)
    ]);

    // Real messages count strictly for this business
    let totalMessages = 0;
    try {
      const { data: convRows } = await supabase
        .from('conversations')
        .select('id')
        .eq('business_id', businessId);
      if (convRows && convRows.length > 0) {
        const ids = convRows.map(c => c.id);
        const { count } = await supabase
          .from('messages')
          .select('id', { count: 'exact', head: true })
          .in('conversation_id', ids);
        totalMessages = count || 0;
      }
    } catch (e) {
      console.warn('messages count query note:', e);
    }

    const totalContacts = contactsAll?.count || 0;
    const totalQualified = contactsQualified?.count || 0;
    const qualRate = totalContacts > 0 ? Math.round((totalQualified / totalContacts) * 100) : 0;

    const clientsCount = contactsClient?.count || 0;
    const productsList = productsAll?.data || [];
    const avgPrice = productsList.length > 0 
      ? Math.round(productsList.reduce((acc, p) => acc + (Number(p.price) || 0), 0) / productsList.length)
      : 0;
    const estimatedRevenue = clientsCount * avgPrice;

    // Build real recent activity list from contacts in Supabase
    const recentActivity = [];
    if (recentContacts?.data && recentContacts.data.length > 0) {
      for (const c of recentContacts.data) {
        recentActivity.push({
          id: c.id,
          type: c.status === 'Qualifié' ? 'qualification' : (c.status === 'À relancer' ? 'alert' : 'lead'),
          title: c.status === 'Qualifié' ? 'Qualification réussie' : (c.status === 'À relancer' ? 'Intervention requise' : 'Nouveau prospect'),
          contactName: c.name || 'Prospect WhatsApp',
          phone: c.whatsapp_number,
          detail: c.need ? `Intérêt: ${c.need}` : (c.budget ? `Budget: ${c.budget}` : 'Échange WhatsApp actif'),
          score: c.score ?? (c.status === 'Qualifié' ? 80 : 50),
          status: c.status || 'Nouveau',
          time: new Date(c.last_interaction_at || c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          dateIso: c.last_interaction_at || c.created_at
        });
      }
    }

    return {
      conversationsCount: convAll?.count || 0,
      todayConversationsCount: convToday?.count || 0,
      qualifiedContactsCount: totalQualified,
      followUpContactsCount: contactsFollowUp?.count || 0,
      clientsCount,
      estimatedRevenue,
      averageCart: avgPrice,
      totalMessagesCount: totalMessages,
      totalProductsCount: productsAll?.count || productsList.length,
      qualificationRate: `${qualRate}%`,
      recentActivity
    };
  } catch (err) {
    console.error('getDashboardStats failed:', err);
    return {
      conversationsCount: 0,
      todayConversationsCount: 0,
      qualifiedContactsCount: 0,
      followUpContactsCount: 0,
      clientsCount: 0,
      estimatedRevenue: 0,
      averageCart: 0,
      totalMessagesCount: 0,
      totalProductsCount: 0,
      qualificationRate: '0%',
      recentActivity: []
    };
  }
}

export async function getAnalyticsStats(businessId, period = '7d') {
  if (!businessId) {
    return {
      conversations: 0,
      contacts: 0,
      messages: 0,
      qualified: 0,
      clients: 0,
      conversionRate: '0%',
      qualificationRate: '0%'
    };
  }

  const now = new Date();
  let since;
  if (period === 'today') {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    since = todayStart.toISOString();
  } else if (period === '7d') {
    since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  } else {
    since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  }

  const [convResult, contactResult, qualifiedResult, clientResult] = await Promise.all([
    supabase.from('conversations').select('id', { count: 'exact', head: true }).eq('business_id', businessId).gte('created_at', since),
    supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('business_id', businessId).gte('created_at', since),
    supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('business_id', businessId).eq('status', 'Qualifié').gte('created_at', since),
    supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('business_id', businessId).eq('status', 'Client').gte('created_at', since),
  ]);

  let msgCount = 0;
  try {
    const { data: convRows } = await supabase
      .from('conversations')
      .select('id')
      .eq('business_id', businessId);
    if (convRows && convRows.length > 0) {
      const ids = convRows.map(c => c.id);
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .in('conversation_id', ids)
        .gte('created_at', since);
      msgCount = count || 0;
    }
  } catch (e) {
    console.warn('analytics messages count note:', e);
  }

  const convCount = convResult.count || 0;
  const contCount = contactResult.count || 0;
  const qualCount = qualifiedResult.count || 0;
  const clientCount = clientResult.count || 0;

  return {
    conversations: convCount,
    contacts: contCount,
    messages: msgCount,
    qualified: qualCount,
    clients: clientCount,
    qualificationRate: contCount > 0 ? `${Math.round((qualCount / contCount) * 100)}%` : '0%',
    conversionRate: contCount > 0 ? `${Math.round((clientCount / contCount) * 100)}%` : '0%'
  };
}

