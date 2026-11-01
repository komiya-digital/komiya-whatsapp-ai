import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Building, 
  Phone, 
  Bot, 
  Package, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  X,
  AlertCircle,
  Clock,
  ShieldCheck,
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { 
  validateOnboardingCompletion, 
  saveOnboardingBusiness, 
  saveOnboardingWhatsApp, 
  saveOnboardingAiAgent, 
  saveOnboardingProduct,
  setStepSkippedState,
  getStepSkippedState,
  ONBOARDING_STATUS
} from '../lib/onboardingValidation';

export default function OnboardingModal({ isOpen, onClose }) {
  const { business, user, ensureBusiness, completeOnboarding, refreshUserData } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [stepError, setStepError] = useState('');
  const [validationReport, setValidationReport] = useState(null);

  // Step 2 Form: Business
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [country, setCountry] = useState("Côte d'Ivoire");
  const [currency, setCurrency] = useState('FCFA');

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

  // Sync initial state when modal opens
  useEffect(() => {
    if (business) {
      if (business.name && business.name !== 'Mon Entreprise') {
        setBusinessName(business.name);
      }
      if (business.description) setDescription(business.description);
      if (business.country) setCountry(business.country);
      if (business.currency) setCurrency(business.currency);
    }
  }, [business]);

  // When reaching Step 6, perform real database validation
  useEffect(() => {
    if (step === 6 && business?.id) {
      validateOnboardingCompletion(business.id, user?.id).then(res => {
        setValidationReport(res);
      }).catch(err => {
        console.error('Validation error on step 6:', err);
      });
    }
  }, [step, business?.id, user?.id]);

  if (!isOpen) return null;

  // Session-only dismiss without completing onboarding
  const handleDismiss = () => {
    const targetId = business?.id || user?.id;
    if (targetId) {
      try {
        sessionStorage.setItem('komiya_onboarding_dismissed_' + targetId, 'true');
      } catch (e) {}
    }
    onClose();
  };

  // Final confirmation on Step 6
  const handleFinalize = async () => {
    setLoading(true);
    setStepError('');
    try {
      let currentBiz = business;
      if (!currentBiz?.id && ensureBusiness) {
        currentBiz = await ensureBusiness();
      }

      if (!currentBiz?.id) {
        throw new Error("Impossible d'identifier votre entreprise. Veuillez vous reconnecter.");
      }

      // Re-verify real database data before finalizing
      const report = await validateOnboardingCompletion(currentBiz.id, user?.id);
      setValidationReport(report);

      if (report.isComplete) {
        // Genuine completion verified in DB!
        await completeOnboarding();
      } else {
        // Mandatory steps still missing: do NOT declare complete!
        // Mark session dismissed so user can access dashboard and complete later.
        handleDismiss();
        return;
      }

      if (refreshUserData) {
        await refreshUserData().catch(() => {});
      }
      onClose();
    } catch (err) {
      console.error('Onboarding finalize error:', err);
      setStepError(err.message || 'Une erreur est survenue lors de la finalisation.');
    } finally {
      setLoading(false);
    }
  };

  // Skip handlers for optional steps
  const handleSkipWhatsApp = () => {
    setStepError('');
    if (business?.id) {
      setStepSkippedState('whatsapp', business.id, true);
    }
    setStep(4);
  };

  const handleSkipProducts = () => {
    setStepError('');
    if (business?.id) {
      setStepSkippedState('products', business.id, true);
    }
    setStep(6);
  };

  // Next step handler with strict real database persistence
  const handleNext = async () => {
    setStepError('');

    let currentBiz = business;
    if ((!currentBiz?.id || currentBiz.id === user?.id) && ensureBusiness) {
      try {
        currentBiz = await ensureBusiness();
      } catch (e) {
        console.warn('ensureBusiness error in handleNext:', e);
      }
    }

    if (!currentBiz?.id) {
      setStepError("Erreur d'authentification : impossible d'accéder à l'espace entreprise.");
      return;
    }

    setLoading(true);

    try {
      if (step === 1) {
        // Simple welcome step
        setStep(2);
      } else if (step === 2) {
        // ─────────────────────────────────────────────────────────────
        // STEP 2: Business configuration (MANDATORY)
        // ─────────────────────────────────────────────────────────────
        if (!businessName.trim()) {
          setStepError("Le nom de l'entreprise est obligatoire pour créer votre espace commercial.");
          setLoading(false);
          return;
        }

        const savedBiz = await saveOnboardingBusiness(currentBiz.id, {
          name: businessName.trim(),
          description: description.trim(),
          country,
          currency
        });

        if (savedBiz?.id) {
          currentBiz = savedBiz;
        }

        if (refreshUserData) {
          refreshUserData().catch(() => {});
        }

        setStep(3);
      } else if (step === 3) {
        // ─────────────────────────────────────────────────────────────
        // STEP 3: WhatsApp connection (MANDATORY TO SELL ON WHATSAPP)
        // ─────────────────────────────────────────────────────────────
        const hasPhone = Boolean(phoneNumber.trim());
        const hasSession = Boolean(sessionId.trim());
        const hasKey = Boolean(apiKey.trim());

        if (!hasPhone && !hasSession && !hasKey) {
          setStepError("Veuillez renseigner vos identifiants WhatsApp ou cliquer sur « Configurer plus tard » ci-dessous.");
          setLoading(false);
          return;
        }

        if (!hasPhone || !hasSession || !hasKey) {
          setStepError("Tous les champs (numéro WhatsApp, WASender Session ID et API Key) sont requis pour connecter WhatsApp.");
          setLoading(false);
          return;
        }

        await saveOnboardingWhatsApp(currentBiz.id, {
          phoneNumber: phoneNumber.trim(),
          sessionId: sessionId.trim(),
          apiKey: apiKey.trim()
        });

        if (refreshUserData) {
          refreshUserData().catch(() => {});
        }

        setStep(4);
      } else if (step === 4) {
        // ─────────────────────────────────────────────────────────────
        // STEP 4: AI Agent configuration (MANDATORY)
        // ─────────────────────────────────────────────────────────────
        if (!agentName.trim()) {
          setStepError("Le nom de votre assistant commercial IA est obligatoire.");
          setLoading(false);
          return;
        }

        await saveOnboardingAiAgent(currentBiz.id, {
          name: agentName.trim(),
          companyDescription: description.trim() || businessName.trim(),
          country,
          tone,
          objective,
          customInstructions: customInstructions.trim()
        });

        if (refreshUserData) {
          refreshUserData().catch(() => {});
        }

        setStep(5);
      } else if (step === 5) {
        // ─────────────────────────────────────────────────────────────
        // STEP 5: First product (OPTIONAL)
        // ─────────────────────────────────────────────────────────────
        if (productName.trim() || productPrice) {
          if (!productName.trim()) {
            setStepError("Veuillez indiquer le nom de votre produit ou cliquer sur « Passer cette étape ».");
            setLoading(false);
            return;
          }
          const priceNum = Number(productPrice);
          if (isNaN(priceNum) || priceNum < 0) {
            setStepError("Le prix du produit doit être un montant valide (ex: 15000).");
            setLoading(false);
            return;
          }

          await saveOnboardingProduct(currentBiz.id, {
            name: productName.trim(),
            price: priceNum,
            currency,
            description: productDescription.trim()
          });

          if (refreshUserData) {
            refreshUserData().catch(() => {});
          }
        } else {
          // Empty inputs without clicking skip: ask user or skip
          handleSkipProducts();
          return;
        }

        setStep(6);
      }
    } catch (err) {
      console.error('Onboarding step persistence error:', err);
      // Keep user input completely intact, display clean readable error
      setStepError(err.message || "Erreur de sauvegarde. Vérifiez vos informations et réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-6 sm:p-8 shadow-2xl text-white relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header & Steps */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-extrabold text-xs flex items-center justify-center">
              {step}
            </span>
            <span className="text-xs font-bold text-slate-300">Étape {step} sur 6</span>
          </div>
          <div className="flex items-center space-x-3">
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
            <button
              type="button"
              onClick={handleDismiss}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Fermer (configuration à compléter ultérieurement)"
            >
              <X className="w-5 h-5" />
            </button>
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
              <h2 className="text-2xl font-extrabold tracking-tight">Bienvenue sur Komiya WhatsApp AI 👋</h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Configurez votre espace entreprise et votre assistant commercial IA. Chaque étape enregistrée est immédiatement vérifiée et sécurisée en base de données.
              </p>
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="text-xs text-slate-500 hover:text-slate-300 underline font-medium"
                >
                  Explorer le tableau de bord d'abord (configuration incomplète)
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Configurez votre entreprise */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2.5">
                <Building className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold">Configurez votre entreprise</h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">Obligatoire</span>
              </div>
              <p className="text-xs text-slate-400">Ces informations ancrent l'identité de votre espace commercial et de votre IA.</p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nom de l'entreprise <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Ex: Komiya Digital"
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description courte de l'activité</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Boutique de mode et accessoires à Abidjan"
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Pays</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Devise</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
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
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <Phone className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold">Connectez votre WhatsApp</h3>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">Requis pour vendre</span>
              </div>
              <p className="text-xs text-slate-400">
                Connectez votre compte WASenderAPI. Si vous n'avez pas encore vos clés API, vous pouvez passer cette étape et la configurer plus tard depuis l'onglet WhatsApp.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Numéro WhatsApp du business</label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+22501020304"
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">WASender Session ID</label>
                <input
                  type="text"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  placeholder="Ex: 121080"
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">WASender API Key / Token</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Bearer Token..."
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-1 flex items-center justify-between text-xs text-slate-400">
                <span>Pas encore vos clés WASenderAPI ?</span>
                <button
                  type="button"
                  onClick={handleSkipWhatsApp}
                  className="text-emerald-400 hover:text-emerald-300 underline font-semibold"
                >
                  Configurer plus tard (Passer)
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Configurez votre assistant IA */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2.5">
                <Bot className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold">Configurez votre assistant commercial IA</h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">Obligatoire</span>
              </div>
              <p className="text-xs text-slate-400">Définissez la personnalité et les instructions commerciales de votre IA.</p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nom de l'assistant <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="Ex: Awa"
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Ton</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
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
                    className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Vendre + qualifier">Vendre + qualifier</option>
                    <option value="Vendre">Vendre</option>
                    <option value="Qualifier">Qualifier</option>
                    <option value="Prendre rendez-vous">Prendre rendez-vous</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Consignes spécifiques de vente</label>
                <textarea
                  rows={2}
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="Ex: Accueillir avec bienveillance, présenter les prix en FCFA, qualifier le budget..."
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          {/* STEP 5: Ajoutez votre premier produit */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <Package className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-base font-bold">Ajoutez votre premier produit ou service</h3>
                </div>
                <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-bold">Facultatif</span>
              </div>
              <p className="text-xs text-slate-400">
                L'IA utilisera ce catalogue pour argumenter et proposer des devis. Vous pouvez ignorer cette étape si votre activité ne requiert pas de catalogue d'articles.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nom du produit / service</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Ex: Robe Wax Royale ou Formation Pro"
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Prix ({currency})</label>
                <input
                  type="number"
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                  placeholder="Ex: 25000"
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description courte</label>
                <textarea
                  rows={2}
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  placeholder="Avantages, délais de livraison, détails de l'offre..."
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-1 flex items-center justify-between text-xs text-slate-400">
                <span>Pas de catalogue à ajouter pour l'instant ?</span>
                <button
                  type="button"
                  onClick={handleSkipProducts}
                  className="text-emerald-400 hover:text-emerald-300 underline font-semibold"
                >
                  Passer cette étape (optionnel)
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: Bilan réel & Finalisation */}
          {step === 6 && (
            <div className="space-y-4 py-2">
              <div className="text-center space-y-2">
                <div className={`inline-flex p-3.5 rounded-2xl ${
                  validationReport?.isComplete 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  {validationReport?.isComplete ? (
                    <CheckCircle2 className="w-10 h-10" />
                  ) : (
                    <Clock className="w-10 h-10" />
                  )}
                </div>
                <h2 className="text-xl font-extrabold tracking-tight">
                  {validationReport?.isComplete 
                    ? "Votre commercial WhatsApp IA est prêt 🚀"
                    : "Bilan de votre configuration"}
                </h2>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {validationReport?.isComplete 
                    ? "Toutes les étapes obligatoires ont été validées et enregistrées avec succès dans Supabase."
                    : "Votre espace a été initialisé, mais certaines étapes obligatoires restent à compléter avant d'activer les ventes autonomes."}
                </p>
              </div>

              {/* Status List */}
              <div className="space-y-2.5 bg-slate-800/60 p-4 rounded-2xl border border-slate-700/60">
                {/* 1. Entreprise */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    {validationReport?.steps?.business?.status === ONBOARDING_STATUS.COMPLETED ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                    )}
                    <span className="font-semibold text-slate-200">1. Entreprise :</span>
                    <span className="text-slate-400 truncate max-w-[200px]">
                      {businessName || validationReport?.steps?.business?.details?.name || 'Non configurée'}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                    validationReport?.steps?.business?.status === ONBOARDING_STATUS.COMPLETED
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}>
                    {validationReport?.steps?.business?.status === ONBOARDING_STATUS.COMPLETED ? 'Validé ✓' : 'À compléter'}
                  </span>
                </div>

                {/* 2. Assistant IA */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    {validationReport?.steps?.assistant?.status === ONBOARDING_STATUS.COMPLETED ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                    )}
                    <span className="font-semibold text-slate-200">2. Assistant IA :</span>
                    <span className="text-slate-400 truncate max-w-[200px]">
                      {agentName || validationReport?.steps?.assistant?.details?.name || 'À configurer'}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                    validationReport?.steps?.assistant?.status === ONBOARDING_STATUS.COMPLETED
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}>
                    {validationReport?.steps?.assistant?.status === ONBOARDING_STATUS.COMPLETED ? 'Validé ✓' : 'À configurer'}
                  </span>
                </div>

                {/* 3. WhatsApp */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    {validationReport?.steps?.whatsapp?.status === ONBOARDING_STATUS.COMPLETED ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Clock className="w-4 h-4 text-amber-400" />
                    )}
                    <span className="font-semibold text-slate-200">3. WhatsApp :</span>
                    <span className="text-slate-400">
                      {validationReport?.steps?.whatsapp?.status === ONBOARDING_STATUS.COMPLETED
                        ? 'Connecté'
                        : 'Non connecté (WASender)'}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                    validationReport?.steps?.whatsapp?.status === ONBOARDING_STATUS.COMPLETED
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {validationReport?.steps?.whatsapp?.status === ONBOARDING_STATUS.COMPLETED ? 'Connecté ✓' : 'Ignoré (à connecter)'}
                  </span>
                </div>

                {/* 4. Catalogue Produits */}
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    {validationReport?.steps?.products?.status === ONBOARDING_STATUS.COMPLETED ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <HelpCircle className="w-4 h-4 text-slate-500" />
                    )}
                    <span className="font-semibold text-slate-200">4. Produits :</span>
                    <span className="text-slate-400">
                      {validationReport?.steps?.products?.status === ONBOARDING_STATUS.COMPLETED
                        ? `${validationReport.steps.products.details.count} produit(s) enregistré(s)`
                        : 'Aucun produit (facultatif)'}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                    validationReport?.steps?.products?.status === ONBOARDING_STATUS.COMPLETED
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-700 text-slate-300'
                  }`}>
                    {validationReport?.steps?.products?.status === ONBOARDING_STATUS.COMPLETED ? 'Validé ✓' : 'Facultatif'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Step error banner */}
        {stepError && (
          <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{stepError}</span>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
          {step > 1 && step < 6 ? (
            <button
              type="button"
              disabled={loading}
              onClick={() => {
                setStepError('');
                setStep(prev => prev - 1);
              }}
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
                  <span>{step === 1 ? 'Commencer la configuration' : 'Enregistrer et continuer'}</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={handleFinalize}
              className={`px-6 py-2.5 font-bold text-xs rounded-xl shadow-lg flex items-center space-x-1.5 transition-all ${
                validationReport?.isComplete
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
              }`}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {validationReport?.isComplete
                      ? 'Accéder à mon Dashboard (100% prêt)'
                      : 'Accéder au Dashboard (configuration à compléter)'}
                  </span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
