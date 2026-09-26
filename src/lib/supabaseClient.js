import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder_key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Initial Mock Application State
 */
export const initialMockState = {
  user: {
    id: 'usr_101',
    email: 'contact@komiyadigital.ci',
    fullName: 'Komiya Digital',
    role: 'owner'
  },
  business: {
    id: 'bus_101',
    name: 'Komiya Commerce',
    description: 'Vente de vêtements et formations e-commerce en Côte d\'Ivoire',
    country: 'Côte d\'Ivoire',
    currency: 'FCFA'
  },
  whatsapp: {
    sessionId: '121080',
    phoneNumber: '+2250586896826',
    apiKey: '8610|X0eFv8TP6STJGMuJIxdNVkofYIFnq6XbWzmfbhlI93d19213',
    isConnected: true,
    status: 'connected',
    lastSyncAt: new Date().toISOString()
  },
  aiAgent: {
    name: 'Awa',
    companyDescription: 'Komiya Commerce - Boutique spécialisée en mode et formations marketing à Abidjan.',
    productsSummary: 'Formations e-commerce, prêt-à-porter africain, coaching WhatsApp Marketing.',
    idealClient: 'Entrepreneurs, étudiants et professionnels d\'Afrique de l\'Ouest.',
    country: 'Côte d\'Ivoire',
    tone: 'Professionnel',
    objective: 'Vendre + qualifier',
    customInstructions: 'Pose une question à la fois. Reste toujours poli. Demande le nom, budget et besoin avant de marquer comme qualifié.',
    isActive: true
  },
  products: [
    {
      id: 'prod_1',
      name: 'Formation Facebook & WhatsApp Ads',
      description: 'Formation pratique complète pour acquérir 50 prospects par jour sur WhatsApp.',
      price: 50000,
      currency: 'FCFA',
      category: 'Formation',
      isAvailable: true,
      salesArguments: ['Accessible aux débutants', 'Accompagnement 30 jours', 'Exercices pratiques'],
      imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&auto=format&fit=crop&q=60',
      faqs: [
        { question: 'Est-ce adapté si je débute ?', answer: 'Oui, la formation commence par les bases zéro.' },
        { question: 'Combien de temps dure l\'accès ?', answer: 'Accès à vie avec mises à jour gratuites.' }
      ]
    },
    {
      id: 'prod_2',
      name: 'Pack Prêt-à-porter Élégance Abidjan',
      description: 'Ensemble en tissu pagne moderne d\'inspiration africaine.',
      price: 35000,
      currency: 'FCFA',
      category: 'Mode & Style',
      isAvailable: true,
      salesArguments: ['Tissu 100% coton', 'Livraison express à Abidjan', 'Finitions haut de gamme'],
      imageUrl: 'https://images.unsplash.com/photo-1590736704728-f4730bb30770?w=500&auto=format&fit=crop&q=60',
      faqs: [
        { question: 'Quelles sont les tailles disponibles ?', answer: 'Tailles du S au XXL disponibles.' }
      ]
    }
  ],
  contacts: [
    {
      id: 'ct_1',
      name: 'Jean-Yves Kouassi',
      whatsappNumber: '+2250701020304',
      source: 'WhatsApp Webhook',
      need: 'Souhaite former son équipe commerciale à WhatsApp Ads',
      budget: '100 000 FCFA',
      location: 'Abidjan, Cocody',
      status: 'Qualifié',
      score: 85,
      lastMessage: 'Je suis très intéressé par la formation 50k FCFA. Comment s\'inscrire ?',
      lastInteractionAt: new Date(Date.now() - 1000 * 60 * 15).toISOString()
    },
    {
      id: 'ct_2',
      name: 'Amina Diop',
      whatsappNumber: '+221771234567',
      source: 'WhatsApp Webhook',
      need: 'Informations sur la livraison au Sénégal',
      budget: '35 000 FCFA',
      location: 'Dakar',
      status: 'En conversation',
      score: 60,
      lastMessage: 'Est-ce que vous livrez aussi à Dakar ?',
      lastInteractionAt: new Date(Date.now() - 1000 * 60 * 45).toISOString()
    },
    {
      id: 'ct_3',
      name: 'Marc-Aurèle Yao',
      whatsappNumber: '+2250102030405',
      source: 'WhatsApp Webhook',
      need: 'Demande de réduction sur la formation',
      budget: 'Non identifié',
      location: 'Yopougon',
      status: 'À relancer',
      score: 40,
      lastMessage: 'Pouvez-vous me faire un prix à 30 000 FCFA ?',
      lastInteractionAt: new Date(Date.now() - 1000 * 60 * 360).toISOString()
    }
  ],
  conversations: [
    {
      id: 'conv_1',
      contactId: 'ct_1',
      contactName: 'Jean-Yves Kouassi',
      whatsappNumber: '+2250701020304',
      isAiActive: true,
      unreadCount: 0,
      status: 'active',
      messages: [
        { id: 'm1', direction: 'inbound', senderType: 'user', content: 'Bonjour, vous proposez des formations WhatsApp ?', timestamp: '10:15' },
        { id: 'm2', direction: 'outbound', senderType: 'ai', content: 'Bonjour Jean-Yves ! 👋 Oui tout à fait. Notre formation Formation Facebook & WhatsApp Ads est idéale pour obtenir 50 prospects par jour. Quel est votre domaine d\'activité ?', timestamp: '10:16' },
        { id: 'm3', direction: 'inbound', senderType: 'user', content: 'Je suis gérant d\'une boutique de cosmétiques à Cocody. Je cherche à former mes vendeurs.', timestamp: '10:18' },
        { id: 'm4', direction: 'outbound', senderType: 'ai', content: 'Super ! La formation coûte 50 000 FCFA et inclut 30 jours d\'accompagnement pratique. Quel est votre budget pour cette formation ?', timestamp: '10:19' },
        { id: 'm5', direction: 'inbound', senderType: 'user', content: 'Je suis très intéressé par la formation 50k FCFA. Comment s\'inscrire ?', timestamp: '10:20' }
      ]
    },
    {
      id: 'conv_2',
      contactId: 'ct_2',
      contactName: 'Amina Diop',
      whatsappNumber: '+221771234567',
      isAiActive: true,
      unreadCount: 1,
      status: 'active',
      messages: [
        { id: 'm10', direction: 'inbound', senderType: 'user', content: 'Bonjour ! Vos tenues prêt-à-porter sont disponibles ?', timestamp: '09:30' },
        { id: 'm11', direction: 'outbound', senderType: 'ai', content: 'Bonjour Amina ! 😊 Oui, le Pack Prêt-à-porter Élégance Abidjan est disponible au prix de 35 000 FCFA. Où êtes-vous située ?', timestamp: '09:31' },
        { id: 'm12', direction: 'inbound', senderType: 'user', content: 'Est-ce que vous livrez aussi à Dakar ?', timestamp: '09:45' }
      ]
    }
  ],
  automations: [
    { id: 'auto_1', name: 'Réponse instantanée IA', triggerType: 'instant_reply', isEnabled: true, description: 'L\'IA répond en moins de 10 secondes aux nouveaux messages entrants.' },
    { id: 'auto_2', name: 'Qualification automatique', triggerType: 'qualification', isEnabled: true, description: 'Extrait le besoin, le budget et le produit d\'intérêt pendant l\'échange.' },
    { id: 'auto_3', name: 'Relance après 6h', triggerType: 'follow_up', isEnabled: true, description: 'Envoie un message de relance personnalisé si le prospect ne répond plus.' },
    { id: 'auto_4', name: 'Passage de main humain', triggerType: 'human_handover', isEnabled: true, description: 'Désactive l\'IA et alerte le propriétaire si un humain est demandé.' }
  ]
};

export function getLocalStore() {
  if (typeof window === 'undefined') return initialMockState;
  const saved = localStorage.getItem('komiya_app_state');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return {
        ...initialMockState,
        ...parsed,
        user: { ...initialMockState.user, ...(parsed.user || {}) },
        business: { ...initialMockState.business, ...(parsed.business || {}) },
        whatsapp: { ...initialMockState.whatsapp, ...(parsed.whatsapp || {}) },
        aiAgent: { ...initialMockState.aiAgent, ...(parsed.aiAgent || {}) },
        products: Array.isArray(parsed.products) && parsed.products.length > 0 ? parsed.products : initialMockState.products,
        contacts: Array.isArray(parsed.contacts) && parsed.contacts.length > 0 ? parsed.contacts : initialMockState.contacts,
        conversations: Array.isArray(parsed.conversations) && parsed.conversations.length > 0 ? parsed.conversations : initialMockState.conversations,
        automations: Array.isArray(parsed.automations) && parsed.automations.length > 0 ? parsed.automations : initialMockState.automations,
      };
    } catch (e) {
      console.error('Failed to parse local state:', e);
    }
  }
  localStorage.setItem('komiya_app_state', JSON.stringify(initialMockState));
  return initialMockState;
}

export function saveLocalStore(state) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('komiya_app_state', JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save local store:', e);
  }
}
