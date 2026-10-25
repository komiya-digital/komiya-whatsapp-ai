import React, { useState, useEffect, useCallback } from 'react';
import { Zap, Clock, UserCheck, AlertTriangle, ShieldCheck, CheckCircle2, RefreshCw, Bot, ArrowRight, MessageSquare, Sparkles } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { getAutomations, updateAutomation, getAiAgent, toggleAiAgentActive } from '../lib/supabaseClient';

export default function Automations({ onNavigate }) {
  const { user, business, ensureBusiness, refreshUserData } = useAuth();

  const [automations, setAutomations] = useState([]);
  const [aiAgent, setAiAgent] = useState(null);
  const [isAiMasterActive, setIsAiMasterActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [togglingMaster, setTogglingMaster] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const loadData = useCallback(async () => {
    let currentBiz = business;
    if (!currentBiz?.id && ensureBusiness) {
      try {
        currentBiz = await ensureBusiness();
      } catch (e) {}
    }
    const bizId = currentBiz?.id || user?.id;
    if (!bizId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [autos, agent] = await Promise.all([
        getAutomations(bizId).catch(() => []),
        getAiAgent(bizId).catch(() => null)
      ]);
      setAutomations(autos || []);
      setAiAgent(agent);
      setIsAiMasterActive(Boolean(agent?.isActive ?? true));
    } catch (err) {
      console.error('Error fetching automations & AI agent:', err);
    } finally {
      setLoading(false);
    }
  }, [business?.id, ensureBusiness, user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleMasterAI = async () => {
    let currentBiz = business;
    if (!currentBiz?.id && ensureBusiness) {
      try {
        currentBiz = await ensureBusiness();
      } catch (e) {}
    }
    const bizId = currentBiz?.id || user?.id;
    if (!bizId) return;
    const nextState = !isAiMasterActive;
    setIsAiMasterActive(nextState);
    setTogglingMaster(true);
    setStatusMessage('');

    try {
      await toggleAiAgentActive(bizId, nextState);
      if (refreshUserData) {
        try { await refreshUserData(); } catch (e) {}
      }
      setStatusMessage(
        nextState 
          ? '🟢 Commercial IA activé avec succès ! Il répondra automatiquement à tous les messages entrants.'
          : '⚪ Commercial IA mis en pause. Les messages entrants ne recevront plus de réponses automatisées.'
      );
    } catch (err) {
      console.error('Error toggling Master AI:', err);
      setIsAiMasterActive(!nextState); // rollback
      setStatusMessage('⚠️ Impossible de mettre à jour le statut de l\'IA : ' + (err.message || 'erreur Supabase'));
    } finally {
      setTogglingMaster(false);
    }
  };

  const toggleAutomation = async (id) => {
    const auto = automations.find(a => a.id === id);
    if (!auto) return;

    const nextState = !auto.isEnabled;
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, isEnabled: nextState } : a));

    try {
      await updateAutomation(id, nextState);
      if (refreshUserData) {
        try { await refreshUserData(); } catch (e) {}
      }
    } catch (err) {
      console.error('Error updating automation:', err);
      // rollback
      setAutomations(prev => prev.map(a => a.id === id ? { ...a, isEnabled: !nextState } : a));
      setStatusMessage('⚠️ Erreur lors de la mise à jour du scénario.');
    }
  };

  const handleActivateAll = async () => {
    let currentBiz = business;
    if (!currentBiz?.id && ensureBusiness) {
      try {
        currentBiz = await ensureBusiness();
      } catch (e) {}
    }
    const bizId = currentBiz?.id || user?.id;
    if (!bizId) return;
    setTogglingMaster(true);
    try {
      // 1. Activate Master AI
      await toggleAiAgentActive(bizId, true);
      setIsAiMasterActive(true);

      // 2. Activate all 4 automation workflows
      const updated = await Promise.all(
        automations.map(async (a) => {
          if (!a.isEnabled) {
            await updateAutomation(a.id, true).catch(() => {});
          }
          return { ...a, isEnabled: true };
        })
      );
      setAutomations(updated);

      if (refreshUserData) {
        try { await refreshUserData(); } catch (e) {}
      }
      setStatusMessage('🎉 Tous les scénarios et le commercial IA sont désormais 100% actifs !');
    } catch (err) {
      console.error('Error activating all:', err);
      setStatusMessage('⚠️ Erreur lors de l\'activation globale.');
    } finally {
      setTogglingMaster(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-700">Chargement de vos automatisations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <Zap className="w-5 h-5 text-emerald-500" />
            <span>Automatisations & Scénarios WhatsApp</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gérez la réactivité de votre commercial IA, les relances automatiques et les alertes d'intervention humaine pour {business?.name || 'votre compte'}.
          </p>
        </div>

        <button
          type="button"
          onClick={handleActivateAll}
          disabled={togglingMaster}
          className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-300 transition-colors shrink-0 flex items-center space-x-1.5"
        >
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>Tout activer en 1 clic</span>
        </button>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-xl text-xs font-bold border ${
          statusMessage.includes('🟢') || statusMessage.includes('🎉')
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          {statusMessage}
        </div>
      )}

      {/* MASTER AI ACTIVATION HERO CARD */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white rounded-2xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Bot className="w-5 h-5" />
              </span>
              <h2 className="text-base font-extrabold tracking-tight">
                Interrupteur Général : Commercial IA WhatsApp
              </h2>
            </div>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              {isAiMasterActive ? (
                <span className="text-emerald-400 font-semibold">
                  🟢 L'IA est ACTIVES et répond instantanément à tous les prospects 24h/24 selon vos paramètres et produits.
                </span>
              ) : (
                <span className="text-amber-300 font-semibold">
                  ⚪ L'IA est en PAUSE. Vos conversations restent accessibles dans l'Inbox pour réponse manuelle.
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              type="button"
              onClick={handleToggleMasterAI}
              disabled={togglingMaster}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md flex items-center space-x-2 ${
                isAiMasterActive 
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-emerald-500/20' 
                  : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
              }`}
            >
              {togglingMaster ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>{isAiMasterActive ? 'IA Activée (Clic pour couper)' : 'Activer l\'IA maintenant'}</span>
            </button>
          </div>
        </div>

        {/* Onboarding completion highlight */}
        {isAiMasterActive && (
          <div className="mt-5 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-2 text-xs text-emerald-300 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Étape 4 validée : Votre onboarding est 100% complet !</span>
            </div>
            <div className="flex items-center gap-2">
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('dashboard')}
                  className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center space-x-1"
                >
                  <span>Mon Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('conversations')}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg transition-colors flex items-center space-x-1 border border-slate-700"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Inbox Chat</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Automations List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider px-1">
          Scénarios intelligents actifs
        </h3>

        {automations.map((auto, idx) => (
          <div key={auto.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-start justify-between gap-4 hover:border-emerald-500/40 transition-all">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs">
                  Auto {idx + 1}
                </span>
                <h3 className="font-extrabold text-sm text-slate-900">{auto.name}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  auto.isEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                }`}>
                  {auto.isEnabled ? 'Actif' : 'En pause'}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {auto.description || "Gère la réactivité et les actions automatiques de votre commercial IA WhatsApp."}
              </p>
            </div>

            <button
              type="button"
              onClick={() => toggleAutomation(auto.id)}
              className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                auto.isEnabled ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            >
              <span className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                auto.isEnabled ? 'left-6' : 'left-0.5'
              }`} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
