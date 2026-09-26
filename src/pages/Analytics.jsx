import React, { useState } from 'react';
import { BarChart3, TrendingUp, Users, MessageSquare, Clock, Award, DollarSign } from 'lucide-react';

export default function Analytics() {
  const [period, setPeriod] = useState('7d'); // 'today', '7d', '30d'

  const metrics = [
    { label: 'Nombre de conversations', value: period === 'today' ? '18' : period === '7d' ? '142' : '580', icon: MessageSquare, color: 'text-blue-500' },
    { label: 'Messages envoyés', value: period === 'today' ? '142' : period === '7d' ? '1,120' : '4,850', icon: TrendingUp, color: 'text-emerald-500' },
    { label: 'Prospects générés', value: period === 'today' ? '12' : period === '7d' ? '95' : '390', icon: Users, color: 'text-indigo-500' },
    { label: 'Prospects qualifiés', value: period === 'today' ? '8' : period === '7d' ? '74' : '305', icon: Award, color: 'text-purple-500' },
    { label: 'Clients / Conversions', value: period === 'today' ? '3' : period === '7d' ? '28' : '112', icon: DollarSign, color: 'text-emerald-400' },
    { label: 'Taux de qualification', value: '78%', icon: Award, color: 'text-amber-500' },
    { label: 'Taux de conversion', value: '29.5%', icon: TrendingUp, color: 'text-emerald-600' },
    { label: 'Temps moyen de réponse IA', value: '4.2 secondes', icon: Clock, color: 'text-indigo-400' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-emerald-500" />
            <span>Analytics & Performance IA</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Statistiques de vente, taux de conversion et réactivité de votre commercial IA WhatsApp.
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

      {/* Metrics Grid */}
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

      {/* Chart Visual Simulation */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <h3 className="font-extrabold text-sm text-slate-900">Évolution des conversations & qualifications</h3>
        
        <div className="h-48 flex items-end justify-between gap-2 pt-6 border-b border-slate-100 pb-2">
          {[40, 65, 80, 55, 90, 75, 95].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full max-w-[36px] bg-emerald-500/20 rounded-t-lg relative group overflow-hidden" style={{ height: `${h}%` }}>
                <div className="w-full bg-emerald-500 rounded-t-lg absolute bottom-0 transition-all duration-500" style={{ height: `${h * 0.7}%` }} />
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Jour {i + 1}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center space-x-6 text-xs text-slate-600 pt-2">
          <span className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-sm bg-emerald-500/20 border border-emerald-500" />
            <span>Conversations totales</span>
          </span>
          <span className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-sm bg-emerald-500" />
            <span>Prospects qualifiés</span>
          </span>
        </div>
      </div>
    </div>
  );
}
