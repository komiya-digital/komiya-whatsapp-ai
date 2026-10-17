-- ========================================================
-- Komiya WhatsApp AI - Complete Supabase Database Schema with RLS
-- ========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles (Tied directly to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'owner',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Businesses (Tenant Container)
CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  country TEXT DEFAULT 'Côte d''Ivoire',
  currency TEXT DEFAULT 'FCFA',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. WhatsApp Connections (WASenderAPI credentials & status)
CREATE TABLE IF NOT EXISTS public.whatsapp_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  session_id TEXT,
  phone_number TEXT,
  api_key TEXT,
  webhook_secret TEXT,
  status TEXT DEFAULT 'disconnected', -- 'connected', 'disconnected', 'syncing'
  is_connected BOOLEAN DEFAULT FALSE,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. AI Agents (Sales Persona & Instructions per Business)
CREATE TABLE IF NOT EXISTS public.ai_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Awa',
  company_description TEXT,
  products_summary TEXT,
  ideal_client TEXT,
  country TEXT DEFAULT 'Côte d''Ivoire',
  tone TEXT DEFAULT 'Professionnel', -- 'Professionnel', 'Amical', 'Commercial', 'Simple'
  objective TEXT DEFAULT 'Vendre + qualifier', -- 'Vendre', 'Qualifier', 'Prendre rendez-vous', 'Support client', 'Vendre + qualifier'
  custom_instructions TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Products & Services Catalog
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'FCFA',
  category TEXT DEFAULT 'Général',
  is_available BOOLEAN DEFAULT TRUE,
  sales_arguments TEXT[],
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Product FAQs
CREATE TABLE IF NOT EXISTS public.product_faqs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Contacts / Leads (Prospects CRM)
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT,
  whatsapp_number TEXT NOT NULL,
  source TEXT DEFAULT 'WhatsApp Webhook',
  interested_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  need TEXT,
  budget TEXT,
  location TEXT,
  status TEXT DEFAULT 'Nouveau', -- 'Nouveau', 'En conversation', 'Qualifié', 'Non qualifié', 'À relancer', 'Client'
  score INTEGER DEFAULT 0, -- 0 to 100
  last_message TEXT,
  last_interaction_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Conversations
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  is_ai_active BOOLEAN DEFAULT TRUE,
  unread_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Messages
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  direction TEXT NOT NULL, -- 'inbound', 'outbound'
  sender_type TEXT NOT NULL, -- 'user', 'ai', 'human'
  content TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Conversation Notes
CREATE TABLE IF NOT EXISTS public.conversation_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Tags
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#00C896',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Contact Tags
CREATE TABLE IF NOT EXISTS public.contact_tags (
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (contact_id, tag_id)
);

-- 13. Automations
CREATE TABLE IF NOT EXISTS public.automations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger_type TEXT NOT NULL, -- 'instant_reply', 'qualification', 'follow_up', 'human_handover'
  is_enabled BOOLEAN DEFAULT TRUE,
  settings_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Analytics Events
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'conversation_created', 'lead_qualified', 'message_sent', 'ai_response'
  metric_value NUMERIC DEFAULT 1,
  metadata_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Policy helper: Check if auth.uid() owns the business
CREATE OR REPLACE FUNCTION public.user_belongs_to_business(b_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.businesses
    WHERE id = b_id AND owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Businesses Policies
DROP POLICY IF EXISTS "Owners can manage business" ON public.businesses;
CREATE POLICY "Owners can manage business" ON public.businesses FOR ALL USING (owner_id = auth.uid());

-- 3. WhatsApp Connections Policies
DROP POLICY IF EXISTS "Business user can manage whatsapp" ON public.whatsapp_connections;
CREATE POLICY "Business user can manage whatsapp" ON public.whatsapp_connections FOR ALL USING (public.user_belongs_to_business(business_id));

-- 4. AI Agents Policies
DROP POLICY IF EXISTS "Business user can manage ai agent" ON public.ai_agents;
CREATE POLICY "Business user can manage ai agent" ON public.ai_agents FOR ALL USING (public.user_belongs_to_business(business_id));

-- 5. Products Policies
DROP POLICY IF EXISTS "Business user can manage products" ON public.products;
CREATE POLICY "Business user can manage products" ON public.products FOR ALL USING (public.user_belongs_to_business(business_id));

-- 6. Product FAQs Policies
DROP POLICY IF EXISTS "Business user can manage FAQs" ON public.product_faqs;
CREATE POLICY "Business user can manage FAQs" ON public.product_faqs FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = product_id AND public.user_belongs_to_business(p.business_id)
  )
);

-- 7. Contacts Policies
DROP POLICY IF EXISTS "Business user can manage contacts" ON public.contacts;
CREATE POLICY "Business user can manage contacts" ON public.contacts FOR ALL USING (public.user_belongs_to_business(business_id));

-- 8. Conversations Policies
DROP POLICY IF EXISTS "Business user can manage conversations" ON public.conversations;
CREATE POLICY "Business user can manage conversations" ON public.conversations FOR ALL USING (public.user_belongs_to_business(business_id));

-- 9. Messages Policies
DROP POLICY IF EXISTS "Business user can manage messages" ON public.messages;
CREATE POLICY "Business user can manage messages" ON public.messages FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id AND public.user_belongs_to_business(c.business_id)
  )
);

-- 10. Conversation Notes Policies
DROP POLICY IF EXISTS "Business user can manage notes" ON public.conversation_notes;
CREATE POLICY "Business user can manage notes" ON public.conversation_notes FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id AND public.user_belongs_to_business(c.business_id)
  )
);

-- 11. Tags Policies
DROP POLICY IF EXISTS "Business user can manage tags" ON public.tags;
CREATE POLICY "Business user can manage tags" ON public.tags FOR ALL USING (public.user_belongs_to_business(business_id));

-- 12. Contact Tags Policies
DROP POLICY IF EXISTS "Business user can manage contact tags" ON public.contact_tags;
CREATE POLICY "Business user can manage contact tags" ON public.contact_tags FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.contacts c
    WHERE c.id = contact_id AND public.user_belongs_to_business(c.business_id)
  )
);

-- 13. Automations Policies
DROP POLICY IF EXISTS "Business user can manage automations" ON public.automations;
CREATE POLICY "Business user can manage automations" ON public.automations FOR ALL USING (public.user_belongs_to_business(business_id));

-- 14. Analytics Events Policies
DROP POLICY IF EXISTS "Business user can manage analytics" ON public.analytics_events;
CREATE POLICY "Business user can manage analytics" ON public.analytics_events FOR ALL USING (public.user_belongs_to_business(business_id));

-- ========================================================
-- AUTOMATIC USER PROVISIONING TRIGGER (Optional Helper)
-- ========================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
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
  INSERT INTO public.businesses (owner_id, name, country, currency, onboarding_completed)
  VALUES (new.id, user_company_name, 'Côte d''Ivoire', 'FCFA', FALSE)
  RETURNING id INTO new_biz_id;

  -- 3. Create Default AI Agent
  INSERT INTO public.ai_agents (business_id, name, company_description, country, tone, objective)
  VALUES (new_biz_id, 'Awa', user_company_name, 'Côte d''Ivoire', 'Professionnel', 'Vendre + qualifier');

  -- 4. Create Default Automations
  INSERT INTO public.automations (business_id, name, trigger_type, is_enabled, settings_json)
  VALUES
    (new_biz_id, 'Réponse instantanée IA', 'instant_reply', true, '{"description":"L''IA répond en moins de 10 secondes aux nouveaux messages entrants."}'::jsonb),
    (new_biz_id, 'Qualification automatique', 'qualification', true, '{"description":"Extrait le besoin, le budget et le produit d''intérêt pendant l''échange."}'::jsonb),
    (new_biz_id, 'Relance après 6h', 'follow_up', true, '{"description":"Envoie un message de relance personnalisé si le prospect ne répond plus."}'::jsonb),
    (new_biz_id, 'Passage de main humain', 'human_handover', true, '{"description":"Désactive l''IA et alerte le propriétaire si un humain est demandé."}'::jsonb);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
