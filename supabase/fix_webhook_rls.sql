-- =========================================================================
-- Komiya WhatsApp AI - Webhook Multi-Tenant RLS & Security Functions
-- =========================================================================
-- Execute this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/glbbwuyznvuybyredtvq/sql
--
-- This script ensures the backend WhatsApp webhook server can securely query
-- WhatsApp connections and business commercial catalogs without being blocked
-- by Row Level Security (RLS) when executing as a backend service.
-- =========================================================================

-- 1. Helper to securely look up connection by session_id without leaking other data
CREATE OR REPLACE FUNCTION public.get_connection_by_session(p_session_id TEXT)
RETURNS TABLE (
  id UUID,
  business_id UUID,
  session_id TEXT,
  phone_number TEXT,
  api_key TEXT,
  status TEXT,
  is_connected BOOLEAN
)
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id,
    w.business_id,
    w.session_id,
    w.phone_number,
    w.api_key,
    w.status,
    w.is_connected
  FROM public.whatsapp_connections w
  WHERE w.session_id = p_session_id
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 2. Helper to fetch commercial context for a business
CREATE OR REPLACE FUNCTION public.get_business_catalog_for_ai(p_business_id UUID)
RETURNS JSONB
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'business', (SELECT row_to_json(b) FROM public.businesses b WHERE b.id = p_business_id),
    'agent', (SELECT row_to_json(a) FROM public.ai_agents a WHERE a.business_id = p_business_id LIMIT 1),
    'products', COALESCE((
      SELECT jsonb_agg(row_to_json(p)) 
      FROM public.products p 
      WHERE p.business_id = p_business_id AND p.is_available = true
    ), '[]'::jsonb)
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 3. Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_connection_by_session(TEXT) TO postgres, service_role, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_business_catalog_for_ai(UUID) TO postgres, service_role, anon, authenticated;

-- Ensure tables are accessible to service_role (bypasses RLS)
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
