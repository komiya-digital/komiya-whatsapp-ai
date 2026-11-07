import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REGISTRY_FILE = path.join(__dirname, '../../.tenant_registry.json');

// In-memory tenant and conversation store
class TenantRegistry {
  constructor() {
    this.tenants = new Map(); // businessId -> tenantData
    this.conversations = new Map(); // `${businessId}_${phone}` -> message array
    this.contacts = new Map(); // `${businessId}_${phone}` -> contact object
    this.loadFromDisk();
  }

  loadFromDisk() {
    try {
      if (fs.existsSync(REGISTRY_FILE)) {
        const raw = fs.readFileSync(REGISTRY_FILE, 'utf-8');
        const data = JSON.parse(raw);
        if (Array.isArray(data.tenants)) {
          for (const t of data.tenants) {
            if (t?.id) this.tenants.set(t.id, t);
          }
        }
        if (data.conversations && typeof data.conversations === 'object') {
          for (const [k, v] of Object.entries(data.conversations)) {
            if (Array.isArray(v)) this.conversations.set(k, v);
          }
        }
        if (data.contacts && typeof data.contacts === 'object') {
          for (const [k, v] of Object.entries(data.contacts)) {
            if (v && typeof v === 'object') this.contacts.set(k, v);
          }
        }
        console.log(`[TenantRegistry] Loaded ${this.tenants.size} tenant(s) from disk.`);
      }
    } catch (err) {
      console.warn('[TenantRegistry] Note loading from disk:', err.message);
    }
  }

  saveToDisk() {
    try {
      const data = {
        tenants: Array.from(this.tenants.values()),
        conversations: Object.fromEntries(this.conversations),
        contacts: Object.fromEntries(this.contacts),
        updatedAt: new Date().toISOString()
      };
      fs.writeFileSync(REGISTRY_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[TenantRegistry] Note saving to disk:', err.message);
    }
  }

  /**
   * Preloads all active businesses and their catalogs from Supabase on startup
   */
  async initFromSupabase(supabaseServer) {
    if (!supabaseServer) return;
    try {
      console.log('[TenantRegistry] Preloading tenants from Supabase...');
      const { data: businesses, error: bErr } = await supabaseServer
        .from('businesses')
        .select('*');

      if (bErr || !Array.isArray(businesses) || businesses.length === 0) {
        console.log('[TenantRegistry] No businesses returned from Supabase on boot:', bErr?.message || '0 found');
        return;
      }

      for (const biz of businesses) {
        const [connRes, agentRes, prodRes] = await Promise.all([
          supabaseServer.from('whatsapp_connections').select('*').eq('business_id', biz.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
          supabaseServer.from('ai_agents').select('*').eq('business_id', biz.id).maybeSingle(),
          supabaseServer.from('products').select('*').eq('business_id', biz.id).eq('is_available', true)
        ]);

        const conn = connRes?.data || null;
        const agent = agentRes?.data || null;
        const products = prodRes?.data || [];

        this.registerTenant({
          businessId: biz.id,
          sessionId: conn?.session_id || null,
          phoneNumber: conn?.phone_number || null,
          apiKey: conn?.api_key || null,
          businessData: biz,
          agentConfig: agent || {},
          products: products
        });
      }
      console.log(`[TenantRegistry] Successfully preloaded ${this.tenants.size} tenant(s) from Supabase.`);
    } catch (err) {
      console.warn('[TenantRegistry] Preload note:', err.message);
    }
  }

  /**
   * Register or update a tenant's complete commercial context
   */
  registerTenant({
    businessId,
    sessionId = null,
    phoneNumber = null,
    apiKey = null,
    businessData = {},
    agentConfig = {},
    products = [],
    faqs = []
  }) {
    if (!businessId) return null;

    const existing = this.tenants.get(businessId) || {};
    const updated = {
      id: businessId,
      sessionId: sessionId || existing.sessionId || null,
      phoneNumber: phoneNumber || existing.phoneNumber || null,
      apiKey: apiKey || existing.apiKey || null,
      businessData: {
        id: businessId,
        name: businessData.name || existing.businessData?.name || 'Notre Entreprise',
        description: businessData.description || existing.businessData?.description || '',
        country: businessData.country || existing.businessData?.country || "Côte d'Ivoire",
        currency: businessData.currency || existing.businessData?.currency || 'FCFA',
        sector: businessData.sector || existing.businessData?.sector || ''
      },
      agentConfig: {
        name: agentConfig.name || existing.agentConfig?.name || 'Awa',
        company_description: agentConfig.company_description || businessData.name || existing.agentConfig?.company_description || '',
        country: agentConfig.country || businessData.country || existing.agentConfig?.country || "Côte d'Ivoire",
        tone: agentConfig.tone || existing.agentConfig?.tone || 'Professionnel et chaleureux',
        objective: agentConfig.objective || existing.agentConfig?.objective || 'Conseiller et convertir les prospects',
        custom_instructions: agentConfig.custom_instructions || existing.agentConfig?.custom_instructions || ''
      },
      products: Array.isArray(products) && products.length > 0 ? products : (existing.products || []),
      faqs: Array.isArray(faqs) && faqs.length > 0 ? faqs : (existing.faqs || []),
      updatedAt: new Date().toISOString()
    };

    this.tenants.set(businessId, updated);
    this.saveToDisk();
    console.log(`[TenantRegistry] Registered tenant "${updated.businessData.name}" (${businessId}) with ${updated.products.length} products.`);
    return updated;
  }

  /**
   * Find tenant by candidate sessions, phone number or business ID
   */
  findTenant({ sessionId = null, candidateSessionIds = [], phoneNumber = null, businessId = null }) {
    // 1. Direct Business ID match
    if (businessId && this.tenants.has(businessId)) {
      return this.tenants.get(businessId);
    }

    // 2. Candidate Session IDs match
    const sessions = [
      ...(Array.isArray(candidateSessionIds) ? candidateSessionIds : []),
      sessionId
    ].filter(Boolean).map(s => s.toString().trim().toLowerCase());

    for (const s of sessions) {
      for (const t of this.tenants.values()) {
        if (t.sessionId && t.sessionId.toString().trim().toLowerCase() === s) {
          return t;
        }
      }
    }

    // 3. Phone Number match
    if (phoneNumber) {
      const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
      for (const t of this.tenants.values()) {
        if (t.phoneNumber) {
          const tPhone = t.phoneNumber.replace(/[^0-9]/g, '');
          if (tPhone === cleanPhone || (cleanPhone.length > 6 && tPhone.endsWith(cleanPhone)) || (tPhone.length > 6 && cleanPhone.endsWith(tPhone))) {
            return t;
          }
        }
      }
    }

    // 4. Safe single tenant fallback: if exactly 1 tenant exists in registry, link to it
    if (this.tenants.size === 1) {
      const onlyTenant = Array.from(this.tenants.values())[0];
      return onlyTenant;
    }

    return null;
  }

  /**
   * Conversational Memory per Prospect and Tenant
   */
  getConversationHistory(businessId, phone, limit = 10) {
    const key = `${businessId}_${phone.replace(/[^0-9]/g, '')}`;
    const history = this.conversations.get(key) || [];
    return history.slice(-limit);
  }

  recordMessage(businessId, phone, role, content) {
    if (!businessId || !phone || !content) return;
    const key = `${businessId}_${phone.replace(/[^0-9]/g, '')}`;
    let history = this.conversations.get(key) || [];
    history.push({
      role: role === 'user' ? 'user' : 'model',
      content,
      timestamp: new Date().toISOString()
    });
    if (history.length > 30) {
      history = history.slice(-30);
    }
    this.conversations.set(key, history);
    this.saveToDisk();
  }

  /**
   * Contact CRM Profile Management
   */
  getContactCRM(businessId, phone) {
    const key = `${businessId}_${phone.replace(/[^0-9]/g, '')}`;
    return this.contacts.get(key) || null;
  }

  updateContactCRM(businessId, phone, updates = {}) {
    if (!businessId || !phone) return null;
    const key = `${businessId}_${phone.replace(/[^0-9]/g, '')}`;
    const existing = this.contacts.get(key) || {
      businessId,
      phone,
      name: 'Prospect WhatsApp',
      score: 10,
      status: 'Nouveau',
      createdAt: new Date().toISOString()
    };
    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.contacts.set(key, updated);
    this.saveToDisk();
    return updated;
  }

  getAllTenants() {
    return Array.from(this.tenants.values());
  }
}

export const tenantRegistry = new TenantRegistry();
