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
 * Robust Multi-Tenant Commercial Context Resolver
 * Checks candidate sessions, phone numbers, active connections, and tenant registry fallback.
 */
export async function getTenantCommercialContext({
  sessionId = null,
  candidateSessionIds = [],
  phoneNumber = null,
  candidatePhoneNumbers = [],
  businessId = null
}) {
  let context = null;

  const allCandidateSessions = [
    ...(Array.isArray(candidateSessionIds) ? candidateSessionIds : []),
    sessionId,
    config.wasender.sessionId
  ].filter(Boolean).map(s => s.toString().trim());

  const allCandidatePhones = [
    ...(Array.isArray(candidatePhoneNumbers) ? candidatePhoneNumbers : []),
    phoneNumber
  ].filter(Boolean).map(p => p.toString().replace(/[^0-9]/g, ''));

  // 1. Try resolving via Supabase
  if (supabaseServer) {
    try {
      let connection = null;

      // 1.1 Match by candidate session IDs
      for (const sId of allCandidateSessions) {
        const { data } = await supabaseServer
          .from('whatsapp_connections')
          .select('*, businesses(*)')
          .eq('session_id', sId)
          .maybeSingle();
        if (data) {
          connection = data;
          console.log(`[Tenant Match] Found connection via session_id "${sId}" for business "${data.businesses?.name}"`);
          break;
        }
      }

      // 1.2 Match by candidate phone numbers
      if (!connection && allCandidatePhones.length > 0) {
        for (const phone of allCandidatePhones) {
          const { data } = await supabaseServer
            .from('whatsapp_connections')
            .select('*, businesses(*)')
            .eq('phone_number', phone)
            .maybeSingle();
          if (data) {
            connection = data;
            console.log(`[Tenant Match] Found connection via phone "${phone}" for business "${data.businesses?.name}"`);
            break;
          }
        }
      }

      // 1.3 Match by businessId
      if (!connection && businessId) {
        const { data } = await supabaseServer
          .from('whatsapp_connections')
          .select('*, businesses(*)')
          .eq('business_id', businessId)
          .maybeSingle();
        if (data) connection = data;
      }

      // 1.4 Smart Single-Instance Fallback: If only 1 connection exists or only 1 is active
      if (!connection) {
        const { data: activeConns } = await supabaseServer
          .from('whatsapp_connections')
          .select('*, businesses(*)')
          .order('updated_at', { ascending: false })
          .limit(5);

        if (Array.isArray(activeConns) && activeConns.length > 0) {
          const connectedOnly = activeConns.filter(c => c.is_connected !== false);
          const chosenConn = connectedOnly.length === 1 ? connectedOnly[0] : (activeConns.length === 1 ? activeConns[0] : null);
          if (chosenConn) {
            connection = chosenConn;
            console.log(`[Tenant Match] Auto-matched to primary WhatsApp connection for business "${chosenConn.businesses?.name || chosenConn.business_id}"`);
          }
        }
      }

      // 1.5 Fallback to single registered business
      if (!connection) {
        const { data: businesses } = await supabaseServer
          .from('businesses')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(2);

        if (Array.isArray(businesses) && businesses.length === 1) {
          connection = {
            business_id: businesses[0].id,
            businesses: businesses[0],
            api_key: config.wasender.apiKey
          };
          console.log(`[Tenant Match] Single business fallback: "${businesses[0].name}" (${businesses[0].id})`);
        }
      }

      // If connection / business was identified
      if (connection && connection.business_id) {
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
          sessionId: connection.session_id || allCandidateSessions[0] || null,
          phoneNumber: connection.phone_number || allCandidatePhones[0] || null,
          apiKey: connection.api_key || config.wasender.apiKey,
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
    const cachedTenant = tenantRegistry.findTenant({ 
      sessionId, 
      candidateSessionIds: allCandidateSessions, 
      phoneNumber, 
      businessId 
    });
    if (cachedTenant) {
      context = cachedTenant;
      console.log(`[Tenant Match] Resolved via local TenantRegistry: "${cachedTenant.businessData?.name}"`);
    }
  }

  return context;
}
