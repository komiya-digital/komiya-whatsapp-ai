import React from 'react';
import { CheckCircle2, Circle, ArrowRight, Sparkles } from 'lucide-react';

export default function OnboardingChecklist({ 
  isConnected, 
  isAgentConfigured, 
  hasProducts, 
  isAiActive,
  onNavigate 
}) {
  const steps = [
    {
      id: 'whatsapp',
      label: 'WhatsApp connecté',
      completed: isConnected,
      actionTab: 'whatsapp',
      buttonText: 'Connecter WhatsApp'
    },
    {
      id: 'assistant',
      label: 'Assistant IA configuré',
      completed: isAgentConfigured,
      actionTab: 'assistant',
      buttonText: 'Configurer Awa'
    },
    {
      id: 'products',
      label: 'Premier produit ajouté',
      completed: hasProducts,
      actionTab: 'products',
      buttonText: 'Ajouter un produit'
    },
    {
      id: 'automations',
      label: 'IA automatique activée',
      completed: isAiActive,
      actionTab: 'assistant',
      buttonText: 'Activer l\'IA'
    }
  ];

  const completedCount = steps.filter(s => s.completed).length;
  const isAllComplete = completedCount === 4;
  const progressPercent = (completedCount / 4) * 100;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white rounded-2xl p-6 border border-slate-800 shadow-xl mb-8 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold tracking-tight">Checklist de démarrage Rapide</h2>
          </div>
          <p className="text-sm text-slate-400">
            {isAllComplete 
              ? "🎉 Félicitations ! Votre commercial WhatsApp IA est 100% prêt à vendre 24h/24."
              : "Complétez ces 4 étapes pour mettre en route votre commercial IA."}
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700/50">
          <div className="text-right">
            <span className="text-xs text-slate-400 block font-medium">Progression</span>
            <span className="text-sm font-bold text-emerald-400">{completedCount} / 4 terminées</span>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-slate-700 flex items-center justify-center font-bold text-xs text-white relative">
            <span>{Math.round(progressPercent)}%</span>
          </div>
        </div>
      </div>

      {isAllComplete ? (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
              🚀
            </div>
            <div>
              <p className="font-bold text-emerald-300 text-sm">Votre commercial WhatsApp IA est prêt !</p>
              <p className="text-xs text-slate-300">Il répondra automatiquement à tous les messages WhatsApp entrants.</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('conversations')}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center space-x-1.5 shadow-md shadow-emerald-500/20"
          >
            <span>Voir le Chat Inbox</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {steps.map((step, index) => (
            <div 
              key={step.id} 
              className={`p-3.5 rounded-xl border transition-all ${
                step.completed 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                  : 'bg-slate-800/50 border-slate-700/50 text-slate-300'
              }`}
            >
              <div className="flex items-center space-x-2.5 mb-2">
                {step.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-500 shrink-0" />
                )}
                <span className={`text-xs font-semibold ${step.completed ? 'line-through text-emerald-400/80' : 'text-slate-200'}`}>
                  Étape {index + 1}: {step.label}
                </span>
              </div>
              {!step.completed && (
                <button
                  onClick={() => onNavigate(step.actionTab)}
                  className="w-full mt-1.5 py-1.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center space-x-1"
                >
                  <span>{step.buttonText}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
