import React, { useState, useEffect, useCallback } from 'react';
import { Zap, Clock, UserCheck, AlertTriangle, ShieldCheck, CheckCircle2, RefreshCw } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { getAutomations, updateAutomation } from '../lib/supabaseClient';

export default function Automations() {
  const { business } = useAuth();

  const [automations, setAutomations] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!business?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getAutomations(business.id);
      setAutomations(data);
    } catch (err) {
      console.error('Error fetching automations:', err);
    } finally {
      setLoading(false);
    }
  }, [business?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleAutomation = async (id) => {
    const auto = automations.find(a => a.id === id);
    if (!auto) return;

    const nextState = !auto.isEnabled;
    setAutomations(prev => prev.map(a => a.id === id ? { ...a, isEnabled: nextState } : a));

    try {
      await updateAutomation(id, nextState);
    } catch (err) {
      console.error('Error updating automation:', err);
      // rollback
      setAutomations(prev => prev.map(a => a.id === id ? { ...a, isEnabled: !nextState } : a));
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
      </div>

      {/* Automations List */}
      <div className="space-y-4">
        {automations.map((auto, idx) => (
          <div key={auto.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-start justify-between gap-4 hover:border-emerald-500/40 transition-all">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs">
                  Auto {idx + 1}
                </span>
                <h3 className="font-extrabold text-sm text-slate-900">{auto.name}</h3>
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
