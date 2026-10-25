import React, { useState } from 'react';
import { Sparkles, Building, Phone, Bot, Package, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { 
  updateBusiness, 
  upsertWhatsAppConnection, 
  upsertAiAgent, 
  createProduct 
} from '../lib/supabaseClient';

export default function OnboardingModal({ isOpen, onClose }) {
  const { business, user, ensureBusiness, completeOnboarding } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [stepError, setStepError] = useState('');

  // Step 2 Form: Business
  const [businessName, setBusinessName] = useState(business?.name || '');
  const [description, setDescription] = useState(business?.description || '');
  const [country, setCountry] = useState(business?.country || 'Côte d\'Ivoire');
  const [currency, setCurrency] = useState(business?.currency || 'FCFA');

  // Step 3 Form: WhatsApp
  const [phoneNumber, setPhoneNumber] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [apiKey, setApiKey] = useState('');

  // Step 4 Form: AI Agent
  const [agentName, setAgentName] = useState('Awa');
  const [tone, setTone] = useState('Professionnel');
  const [objective, setObjective] = useState('Vendre + qualifier');
  const [customInstructions, setCustomInstructions] = useState('');

  // Step 5 Form: First Product
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productDescription, setProductDescription] = useState('');

  if (!isOpen) return null;

  const handleNext = async () => {
    setStepError('');

    let currentBiz = business;
    if ((!currentBiz?.id || currentBiz.id === user?.id) && ensureBusiness) {
      try {
        currentBiz = await ensureBusiness();
      } catch (e) {}
    }

    if (!currentBiz?.id) {
      setStep(prev => prev + 1);
      return;
    }

    // Validation par étape
    if (step === 2 && !businessName.trim()) {
      setStepError("Le nom de l'entreprise est requis.");
      return;
    }
    if (step === 5 && productName.trim() && !productPrice) {
      setStepError('Le prix du produit est requis si vous renseignez un nom.');
      return;
    }

    setLoading(true);
    try {
      if (step === 2) {
        try {
          await updateBusiness(currentBiz.id, {
            name: businessName.trim() || currentBiz.name,
            description,
            country,
            currency
          });
        } catch (e) {
          console.warn('Business update note in onboarding:', e);
        }
      } else if (step === 3) {
        if (phoneNumber || sessionId || apiKey) {
          const isConn = Boolean(sessionId && apiKey && phoneNumber);
          const connData = {
            phoneNumber,
            sessionId,
            apiKey,
            isConnected: isConn,
            status: isConn ? 'connected' : 'disconnected'
          };
          // 1. Instant local persistence
          try {
            localStorage.setItem('komiya_wa_connection', JSON.stringify(connData));
          } catch (e) {}

          // 2. Sync to Supabase using resolved business
          try {
            await upsertWhatsAppConnection(currentBiz.id, connData);
          } catch (waErr) {
            console.warn('WhatsApp onboarding sync note:', waErr.message);
          }
        }
      } else if (step === 4) {
        const agentPayload = {
          name: agentName,
          companyDescription: description || businessName,
          country,
          tone,
          objective,
          customInstructions,
          isActive: true
        };
        try {
          localStorage.setItem('komiya_ai_agent_' + currentBiz.id, JSON.stringify(agentPayload));
        } catch (e) {}
        try {
          await upsertAiAgent(currentBiz.id, agentPayload);
        } catch (aiErr) {
          console.warn('AI agent onboarding sync note:', aiErr.message);
        }
      } else if (step === 5) {
        if (productName.trim() && productPrice) {
          const productPayload = {
            name: productName.trim(),
            price: Number(productPrice),
            currency,
            description: productDescription,
            category: 'Général',
            isAvailable: true
          };
          try {
            const cached = JSON.parse(localStorage.getItem('komiya_products_' + currentBiz.id) || '[]');
            localStorage.setItem('komiya_products_' + currentBiz.id, JSON.stringify([productPayload, ...cached]));
          } catch (e) {}
          try {
            await createProduct(currentBiz.id, productPayload);
          } catch (prodErr) {
            console.warn('Product onboarding sync note:', prodErr.message);
          }
        }
      }
      setStep(prev => prev + 1);
    } catch (err) {
      console.error('Onboarding step error:', err);
      setStepError(err.message || 'Une erreur est survenue. Vérifiez vos données et réessayez.');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      await completeOnboarding();
    } catch (e) {
      console.warn('Complete onboarding error:', e);
    } finally {
      setLoading(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 sm:p-8 shadow-2xl text-white relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Progress bar */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-extrabold text-xs flex items-center justify-center">
              {step}
            </span>
            <span className="text-xs font-bold text-slate-300">Étape {step} sur 6</span>
          </div>
          <div className="flex space-x-1.5">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div 
                key={i} 
                className={`h-1.5 w-6 rounded-full transition-all ${
                  i <= step ? 'bg-emerald-400' : 'bg-slate-800'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-5">
          {/* STEP 1: Bienvenue */}
          {step === 1 && (
            <div className="text-center py-6 space-y-4">
              <div className="inline-flex p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Sparkles className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight">Bienvenue sur votre espace 👋</h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Votre commercial IA autonome est prêt à être configuré. En quelques étapes simples, connectez votre WhatsApp et commencez à convertir vos prospects en clients 24h/24.
              </p>
            </div>
          )}

          {/* STEP 2: Configurez votre entreprise */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2.5">
                <Building className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold">Configurez votre entreprise</h3>
              </div>
              <p className="text-xs text-slate-400">Ces informations aident l'IA à parler fidèlement de votre activité.</p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nom de l'entreprise</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Ex: Komiya Digital"
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description courte de l'activité</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Boutique de vêtements et formations e-commerce"
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Pays</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Devise</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white"
                  >
                    <option value="FCFA">FCFA</option>
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Connectez votre WhatsApp */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2.5">
                <Phone className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold">Connectez votre WhatsApp (WASenderAPI)</h3>
              </div>
              <p className="text-xs text-slate-400">
                Vous pourrez également configurer ou modifier ces identifiants à tout moment dans l'onglet WhatsApp.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Numéro WhatsApp du business</label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+22500000000"
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">WASender Session ID</label>
                <input
                  type="text"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  placeholder="Ex: 121080"
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">WASender API Key / Token</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Bearer Token..."
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>
            </div>
          )}

          {/* STEP 4: Configurez votre assistant IA */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2.5">
                <Bot className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold">Configurez votre assistant commercial IA</h3>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nom de l'assistant</label>
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="Ex: Awa"
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Ton</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white"
                  >
                    <option value="Professionnel">Professionnel</option>
                    <option value="Amical">Amical</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Simple">Simple</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Objectif</label>
                  <select
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white"
                  >
                    <option value="Vendre + qualifier">Vendre + qualifier</option>
                    <option value="Vendre">Vendre</option>
                    <option value="Qualifier">Qualifier</option>
                    <option value="Prendre rendez-vous">Prendre rendez-vous</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Consignes spécifiques</label>
                <textarea
                  rows={2}
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="Ex: Répondre avec politesse, demander le nom et le budget du prospect..."
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>
            </div>
          )}

          {/* STEP 5: Ajoutez votre premier produit */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2.5">
                <Package className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold">Ajoutez votre premier produit ou service</h3>
              </div>
              <p className="text-xs text-slate-400">Votre IA utilisera cette offre pour proposer des devis et vendre.</p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nom du produit / formation / service</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Ex: Pack Formation WhatsApp Pro"
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Prix ({currency})</label>
                <input
                  type="number"
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                  placeholder="Ex: 50000"
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description rapide</label>
                <textarea
                  rows={2}
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  placeholder="Avantages, bénéfices pour le client..."
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>
            </div>
          )}

          {/* STEP 6: Prêt 🚀 */}
          {step === 6 && (
            <div className="text-center py-6 space-y-4">
              <div className="inline-flex p-4 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight">Votre assistant WhatsApp est prêt 🚀</h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Toutes les configurations de votre espace sont enregistrées. Vous pouvez maintenant accéder à votre tableau de bord et suivre vos conversations en direct.
              </p>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        {stepError && (
          <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
            ⚠️ {stepError}
          </div>
        )}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
          {step > 1 && step < 6 ? (
            <button
              type="button"
              onClick={() => setStep(prev => prev - 1)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white flex items-center space-x-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Précédent</span>
            </button>
          ) : (
            <div />
          )}

          {step < 6 ? (
            <button
              type="button"
              disabled={loading}
              onClick={handleNext}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center space-x-1.5 transition-all"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{step === 1 ? 'Commencer la configuration' : 'Continuer'}</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={handleFinish}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center space-x-1.5 transition-all"
            >
              <span>Accéder à mon Dashboard</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
