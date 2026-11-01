import React from 'react';
import { CheckCircle2, Circle, ArrowRight, Sparkles, AlertCircle, Building, Bot, Phone, Package, Clock } from 'lucide-react';
import { ONBOARDING_STATUS } from '../lib/onboardingValidation';

export default function OnboardingChecklist({ 
  validationReport,
  isBusinessConfigured = false,
  isConnected = false, 
  isAgentConfigured = false, 
  hasProducts = false, 
  isAiActive = false,
  onNavigate 
}) {
  // If a full validation report is supplied, use it as ground truth; otherwise derive from props
  const bizStatus = validationReport?.steps?.business?.status || 
    (isBusinessConfigured ? ONBOARDING_STATUS.COMPLETED : ONBOARDING_STATUS.IN_PROGRESS);

  const agentStatus = validationReport?.steps?.assistant?.status || 
    (isAgentConfigured ? ONBOARDING_STATUS.COMPLETED : ONBOARDING_STATUS.NOT_STARTED);

  const waStatus = validationReport?.steps?.whatsapp?.status || 
    (isConnected ? ONBOARDING_STATUS.COMPLETED : ONBOARDING_STATUS.NOT_STARTED);

  const prodStatus = validationReport?.steps?.products?.status || 
    (hasProducts ? ONBOARDING_STATUS.COMPLETED : ONBOARDING_STATUS.NOT_STARTED);

  const steps = [
    {
      id: 'business',
      label: 'Entreprise configurée',
      icon: Building,
      status: bizStatus,
      isRequired: true,
      actionTab: 'settings',
      buttonText: 'Gérer l\'entreprise',
      description: 'Nom, coordonnées et pays de votre activité'
    },
    {
      id: 'assistant',
      label: 'Assistant IA configuré',
      icon: Bot,
      status: agentStatus,
      isRequired: true,
      actionTab: 'assistant',
      buttonText: 'Configurer votre IA',
      description: 'Consignes commerciales et personnalité'
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp connecté',
      icon: Phone,
      status: waStatus,
      isRequired: true,
      actionTab: 'whatsapp',
      buttonText: 'Connecter WhatsApp',
      description: 'Requis pour échanger et vendre en direct'
    },
    {
      id: 'products',
      label: 'Catalogue produits',
      icon: Package,
      status: prodStatus,
      isRequired: false,
      actionTab: 'products?action=new',
      buttonText: 'Ajouter un produit',
      description: 'Facultatif si vous vendez sans catalogue'
    }
  ];

  const completedCount = steps.filter(s => s.status === ONBOARDING_STATUS.COMPLETED).length;
  // All required steps must be completed for full readiness
  const isRequiredComplete = 
    bizStatus === ONBOARDING_STATUS.COMPLETED &&
    agentStatus === ONBOARDING_STATUS.COMPLETED &&
    waStatus === ONBOARDING_STATUS.COMPLETED;

  const isAllComplete = Boolean(validationReport?.isComplete ?? (isRequiredComplete && isConnected));
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white rounded-2xl p-6 border border-slate-800 shadow-xl mb-8 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold tracking-tight">Progression de mise en service</h2>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isAllComplete 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {isAllComplete ? 'Prêt à vendre' : 'Configuration requise'}
            </span>
          </div>
          <p className="text-sm text-slate-400">
            {isAllComplete 
              ? "🎉 Félicitations ! Votre commercial WhatsApp IA est 100% prêt à vendre 24h/24."
              : "Les informations réelles enregistrées dans Supabase déterminent l'activation de votre commercial IA."}
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700/50">
          <div className="text-right">
            <span className="text-xs text-slate-400 block font-medium">Étapes validées</span>
            <span className="text-sm font-bold text-emerald-400">{completedCount} / {steps.length} terminées</span>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-slate-700 flex items-center justify-center font-bold text-xs text-white relative">
            <span>{progressPercent}%</span>
          </div>
        </div>
      </div>

      {/* Completion alert if completely ready */}
      {isAllComplete && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-lg shrink-0">
              🚀
            </div>
            <div>
              <p className="font-bold text-emerald-300 text-sm">Votre commercial WhatsApp IA est opérationnel !</p>
              <p className="text-xs text-slate-300">Votre entreprise, assistant et session WhatsApp sont validés. Vos prospects seront accueillis en direct.</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('conversations')}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center space-x-1.5 shadow-md shadow-emerald-500/20 shrink-0"
          >
            <span>Voir le Chat Inbox</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Warning alert if incomplete */}
      {!isAllComplete && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-3.5 rounded-xl flex items-center justify-between gap-3 mb-4 text-xs">
          <div className="flex items-center space-x-2.5 text-amber-300">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              {waStatus !== ONBOARDING_STATUS.COMPLETED
                ? "Connexion WhatsApp requise : connectez votre WhatsApp pour activer les réponses IA en temps réel."
                : "Complétez les étapes manquantes pour finaliser l'activation de votre commercial IA."}
            </span>
          </div>
          {waStatus !== ONBOARDING_STATUS.COMPLETED && (
            <button
              onClick={() => onNavigate('whatsapp')}
              className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-colors shrink-0"
            >
              Connecter WhatsApp
            </button>
          )}
        </div>
      )}

      {/* Grid of 4 Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {steps.map((step, index) => {
          const isDone = step.status === ONBOARDING_STATUS.COMPLETED;
          const isSkipped = step.status === ONBOARDING_STATUS.SKIPPED;
          const Icon = step.icon;

          return (
            <div 
              key={step.id} 
              className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                isDone 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-sm' 
                  : isSkipped
                  ? 'bg-slate-800/40 border-slate-700/40 text-slate-400'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : isSkipped ? (
                      <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                    <span className={`text-xs font-semibold ${isDone ? 'text-emerald-300' : 'text-slate-200'}`}>
                      {index + 1}. {step.label}
                    </span>
                  </div>
                  {isDone ? (
                    <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 shrink-0">
                      Validé ✓
                    </span>
                  ) : isSkipped ? (
                    <span className="text-[10px] font-medium bg-slate-700/60 text-slate-400 px-1.5 py-0.5 rounded-full shrink-0">
                      Ignoré
                    </span>
                  ) : (
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${
                      step.isRequired ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-700 text-slate-400'
                    }`}>
                      {step.isRequired ? 'Requis' : 'Facultatif'}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mb-2">
                  {step.description}
                </p>
              </div>

              <div>
                {!isDone ? (
                  <button
                    onClick={() => onNavigate(step.actionTab)}
                    className="w-full mt-1.5 py-1.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center space-x-1"
                  >
                    <span>{step.buttonText}</span>
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </button>
                ) : (
                  <div className="flex items-center justify-between text-[11px] text-emerald-400/80 mt-1 pt-1 border-t border-emerald-500/20">
                    <span>Vérifié en base</span>
                    <button
                      type="button"
                      onClick={() => onNavigate(step.actionTab)}
                      className="text-[10px] text-slate-400 hover:text-emerald-300 underline font-medium"
                    >
                      Modifier
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
