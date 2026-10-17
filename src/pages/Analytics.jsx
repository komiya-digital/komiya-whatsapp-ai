import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, TrendingUp, Users, MessageSquare, Clock, Award, DollarSign, RefreshCw } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { getAnalyticsStats } from '../lib/supabaseClient';

export default function Analytics() {
  const { business } = useAuth();

  const [period, setPeriod] = useState('7d'); // 'today', '7d', '30d'
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    conversations: 0,
    contacts: 0,
    messages: 0,
    qualified: 0,
    clients: 0,
    qualificationRate: '0%',
    conversionRate: '0%'
  });

  const loadData = useCallback(async () => {
    if (!business?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getAnalyticsStats(business.id, period);
      setStats(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [business?.id, period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const metrics = [
    { label: 'Conversations reçues', value: stats.conversations.toString(), icon: MessageSquare, color: 'text-blue-500' },
    { label: 'Messages échangés', value: stats.messages.toString(), icon: TrendingUp, color: 'text-emerald-500' },
    { label: 'Total prospects', value: stats.contacts.toString(), icon: Users, color: 'text-indigo-500' },
    { label: 'Prospects qualifiés IA', value: stats.qualified.toString(), icon: Award, color: 'text-purple-500' },
    { label: 'Clients / Conversions', value: stats.clients.toString(), icon: DollarSign, color: 'text-emerald-400' },
    { label: 'Taux de qualification', value: stats.qualificationRate, icon: Award, color: 'text-amber-500' },
    { label: 'Taux de conversion', value: stats.conversionRate, icon: TrendingUp, color: 'text-emerald-600' },
    { label: 'Temps de réponse IA', value: '< 10 secondes', icon: Clock, color: 'text-indigo-400' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-emerald-500" />
            <span>Analytics & Performance Réelle IA</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Indicateurs mesurés à partir des conversations et prospects réels de {business?.name || 'votre compte'}.
          </p>
        </div>

        {/* Time Period Filter */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setPeriod('today')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              period === 'today' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Aujourd'hui
          </button>
          <button
            onClick={() => setPeriod('7d')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              period === '7d' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            7 jours
          </button>
          <button
            onClick={() => setPeriod('30d')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              period === '30d' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            30 jours
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-500 mx-auto mb-2" />
          <p className="text-xs text-slate-500">Calcul des indicateurs réels...</p>
        </div>
      )}

      {/* Metrics Grid */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((m, idx) => {
            const Icon = m.icon;
            return (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-emerald-500/40 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-slate-500">{m.label}</span>
                  <Icon className={`w-4 h-4 ${m.color}`} />
                </div>
                <span className="text-xl font-extrabold text-slate-900 tracking-tight">{m.value}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Real summary card */}
      {!loading && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900">Synthèse de performance</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            {stats.conversations === 0 ? (
              "Aucune donnée d'interaction enregistrée sur cette période. Dès que votre numéro WhatsApp sera connecté, les métriques d'acquisition et de conversion se mettront à jour automatiquement."
            ) : (
              `Sur cette période, votre commercial IA a géré ${stats.conversations} conversation(s) et qualifié ${stats.qualified} prospect(s) avec un taux de réussite de ${stats.qualificationRate}.`
            )}
          </p>
        </div>
      )}
    </div>
  );
}
