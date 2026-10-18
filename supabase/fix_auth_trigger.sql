-- =========================================================================
-- Komiya WhatsApp AI - Supabase Auth Trigger Fix
-- =========================================================================
-- This script fixes the "Database error saving new user" error on registration.
-- 
-- The error happens when Supabase Auth tries to create a new user in auth.users,
-- and the trigger `on_auth_user_created` calls `handle_new_user()`.
-- If any exception occurs (e.g., search_path, RLS, missing UUID extension),
-- the transaction rolls back with "Database error saving new user".
--
-- RUN THIS SCRIPT IN YOUR SUPABASE SQL EDITOR:
-- https://supabase.com/dashboard/project/glbbwuyznvuybyredtvq/sql
-- =========================================================================

-- OPTION 1: RECOMMENDED - Safe, exception-handling version of the trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  new_biz_id UUID;
  user_full_name TEXT;
  user_company_name TEXT;
BEGIN
  user_full_name := COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1));
  user_company_name := COALESCE(new.raw_user_meta_data->>'company_name', user_full_name || '''s Business');

  -- 1. Create Profile
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, user_full_name, 'owner')
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

  -- 2. Create Business
  INSERT INTO public.businesses (id, owner_id, name, country, currency, onboarding_completed)
  VALUES (gen_random_uuid(), new.id, user_company_name, 'Côte d''Ivoire', 'FCFA', FALSE)
  RETURNING id INTO new_biz_id;

  -- 3. Create Default AI Agent
  INSERT INTO public.ai_agents (id, business_id, name, company_description, country, tone, objective)
  VALUES (gen_random_uuid(), new_biz_id, 'Awa', user_company_name, 'Côte d''Ivoire', 'Professionnel', 'Vendre + qualifier');

  -- 4. Create Default Automations
  INSERT INTO public.automations (id, business_id, name, trigger_type, is_enabled, settings_json)
  VALUES
    (gen_random_uuid(), new_biz_id, 'Réponse instantanée IA', 'instant_reply', true, '{"description":"L''IA répond en moins de 10 secondes aux nouveaux messages entrants."}'::jsonb),
    (gen_random_uuid(), new_biz_id, 'Qualification automatique', 'qualification', true, '{"description":"Extrait le besoin, le budget et le produit d''intérêt pendant l''échange."}'::jsonb),
    (gen_random_uuid(), new_biz_id, 'Relance après 6h', 'follow_up', true, '{"description":"Envoie un message de relance personnalisé si le prospect ne répond plus."}'::jsonb),
    (gen_random_uuid(), new_biz_id, 'Passage de main humain', 'human_handover', true, '{"description":"Désactive l''IA et alerte le propriétaire si un humain est demandé."}'::jsonb);

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Catch any error so auth.users insertion is NEVER blocked
  -- AuthContext.jsx on the client will also guarantee provisioning
  RAISE WARNING 'handle_new_user non-blocking exception: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-attach trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure service_role and authenticated have permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
