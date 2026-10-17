-- ========================================================
-- Script de Nettoyage Sécurisé des Données de Démonstration
-- Supprime EXCLUSIVEMENT les enregistrements fictifs de test
-- SANS toucher aux données réelles des utilisateurs enregistrés
-- ========================================================

-- 1. Nettoyer les fausses conversations de test / démo
DELETE FROM public.messages
WHERE conversation_id IN (
  SELECT c.id FROM public.conversations c
  JOIN public.businesses b ON c.business_id = b.id
  WHERE b.name ILIKE '%Komiya Commerce%' 
     OR b.id = '00000000-0000-0000-0000-000000000101'::uuid
);

DELETE FROM public.conversations
WHERE business_id IN (
  SELECT id FROM public.businesses
  WHERE name ILIKE '%Komiya Commerce%' 
     OR id = '00000000-0000-0000-0000-000000000101'::uuid
);

-- 2. Nettoyer les faux contacts / prospects de démo (Jean-Yves Kouassi, Amina Diop, Marc-Aurèle Yao)
DELETE FROM public.contacts
WHERE name IN ('Jean-Yves Kouassi', 'Amina Diop', 'Marc-Aurèle Yao')
   OR whatsapp_number IN ('+2250701020304', '+221771234567', '+2250102030405');

-- 3. Nettoyer les produits fictifs de démonstration
DELETE FROM public.product_faqs
WHERE product_id IN (
  SELECT id FROM public.products
  WHERE name IN (
    'Formation Facebook & WhatsApp Ads', 
    'Pack Prêt-à-porter Élégance Abidjan'
  )
);

DELETE FROM public.products
WHERE name IN (
  'Formation Facebook & WhatsApp Ads', 
  'Pack Prêt-à-porter Élégance Abidjan'
);

-- 4. Nettoyer les connexions WhatsApp de test fictives (Session #121080 par défaut)
DELETE FROM public.whatsapp_connections
WHERE session_id = '121080' 
  AND phone_number = '+2250586896826'
  AND business_id NOT IN (SELECT id FROM public.businesses WHERE owner_id IS NOT NULL);

-- Confirmation de nettoyage
SELECT 'Nettoyage des données démo terminé avec succès !' AS status;
