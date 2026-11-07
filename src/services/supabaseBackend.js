import { createClient } from '@supabase/supabase-js';
import { config } from '../config.js';
import { tenantRegistry } from './tenantRegistry.js';

const url = config.supabase.url || process.env.VITE_SUPABASE_URL || '';
const serviceKey = config.supabase.serviceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const anonKey = config.supabase.anonKey || process.env.VITE_SUPABASE_ANON_KEY || '';
const effectiveKey = serviceKey || anonKey || '';

export const isServiceRole = Boolean(serviceKey && serviceKey.length > 20);

export const supabaseServer = (url && effectiveKey) 
  ? createClient(url, effectiveKey, { auth: { persistSession: false } })
  : null;

/**
 * Robust Multi-Tenant Context Fetcher
 * Tries Supabase (with service role or RPC), then falls back to tenantRegistry.
 */
export async function getTenantCommercialContext({
  sessionId = null,
  phoneNumber = null,
  businessId = null
}) {
  let context = null;

  // 1. If Supabase is available and has service role or connection table is accessible
  if (supabaseServer) {
    try {
      let connection = null;

      if (sessionId) {
        const { data } = await supabaseServer
          .from('whatsapp_connections')
          .select('*, businesses(*)')
          .eq('session_id', sessionId.toString())
          .maybeSingle();
        if (data) connection = data;
      }

      if (!connection && phoneNumber) {
        const { data } = await supabaseServer
          .from('whatsapp_connections')
          .select('*, businesses(*)')
          .eq('phone_number', phoneNumber)
          .maybeSingle();
        if (data) connection = data;
      }

      if (!connection && businessId) {
        const { data } = await supabaseServer
          .from('whatsapp_connections')
          .select('*, businesses(*)')
          .eq('business_id', businessId)
          .maybeSingle();
        if (data) connection = data;
      }

      // If connection was found via Supabase
      if (connection) {
        const bId = connection.business_id;
        const bData = connection.businesses || {};

        // Fetch AI Agent and products specifically for this business
        const [agentRes, prodRes] = await Promise.all([
          supabaseServer.from('ai_agents').select('*').eq('business_id', bId).maybeSingle(),
          supabaseServer.from('products').select('*').eq('business_id', bId).eq('is_available', true)
        ]);

        const agentConfig = agentRes?.data || {
          name: 'Awa',
          company_description: bData.name || 'Notre Entreprise',
          country: bData.country || "Côte d'Ivoire",
          tone: 'Professionnel et chaleureux',
          objective: 'Conseiller et convertir les prospects'
        };

        const products = prodRes?.data || [];
        let faqs = [];

        if (products.length > 0) {
          const productIds = products.map(p => p.id);
          const { data: faqsData } = await supabaseServer
            .from('product_faqs')
            .select('*')
            .in('product_id', productIds);
          if (faqsData) faqs = faqsData;
        }

        // Cache in tenantRegistry for fail-safe resilience
        context = tenantRegistry.registerTenant({
          businessId: bId,
          sessionId: connection.session_id,
          phoneNumber: connection.phone_number,
          apiKey: connection.api_key,
          businessData: bData,
          agentConfig,
          products,
          faqs
        });
      }
    } catch (dbErr) {
      console.warn('[SupabaseBackend] Note during context query:', dbErr.message);
    }
  }

  // 2. Fallback to tenantRegistry if not resolved via Supabase
  if (!context) {
    const cachedTenant = tenantRegistry.findTenant({ sessionId, phoneNumber, businessId });
    if (cachedTenant) {
      context = cachedTenant;
    }
  }

  return context;
}
