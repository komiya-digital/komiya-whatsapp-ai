import React from 'react';
import { 
  MessageSquare, 
  UserCheck, 
  Clock, 
  TrendingUp, 
  Send, 
  Award,
  Sparkles,
  ArrowUpRight,
  Bot,
  Zap,
  CheckCircle2
} from 'lucide-react';
import OnboardingChecklist from '../components/OnboardingChecklist';

export default function Dashboard({ state, onNavigate }) {
  const isConnected = state.whatsapp.isConnected;
  const isAgentConfigured = Boolean(state.aiAgent.companyDescription);
  const hasProducts = state.products.length > 0;
  const isAiActive = state.aiAgent.isActive;

  const kpis = [
    { label: 'Conversations aujourd\'hui', value: '18', change: '+24%', icon: MessageSquare, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Prospects qualifiés', value: state.contacts.filter(c => c.status === 'Qualifié').length, change: '+18%', icon: UserCheck, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Prospects à relancer', value: state.contacts.filter(c => c.status === 'À relancer').length, change: 'Urgent', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Ventes / Conversions', value: '850 000 FCFA', change: '+32%', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Messages envoyés', value: '142', change: 'Temps réel', icon: Send, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { label: 'Taux de qualification', value: '78%', change: '+5%', icon: Award, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  const recentActivity = [
    { type: 'lead', title: 'Nouveau prospect qualifié', detail: 'Jean-Yves Kouassi (Score: 85/100 • Formation Facebook Ads)', time: 'Il y a 15 min', icon: UserCheck, color: 'text-emerald-400' },
    { type: 'ai', title: 'Réponse IA envoyée', detail: 'Awa a présenté la tenue Prêt-à-porter Élégance à Amina Diop', time: 'Il y a 45 min', icon: Bot, color: 'text-blue-400' },
    { type: 'whatsapp', title: 'Webhook WASender', detail: 'Session #121080 (Komiya Digital) synchronisée en direct', time: 'Il y a 1 heure', icon: Zap, color: 'text-indigo-400' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Bonjour, {state.user.fullName} 👋
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Voici la performance de votre commercial IA WhatsApp aujourd'hui.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-600">WhatsApp Status:</span>
            {isConnected ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 flex items-center space-x-1">
                <span>🟢 Connecté</span>
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 flex items-center space-x-1">
                <span>🔴 Non connecté</span>
              </span>
            )}
          </div>

          <button
            onClick={() => onNavigate('conversations')}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center space-x-1.5"
          >
            <span>Ouvrir l'Inbox Chat</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Onboarding Checklist Banner */}
      <OnboardingChecklist
        isConnected={isConnected}
        isAgentConfigured={isAgentConfigured}
        hasProducts={hasProducts}
        isAiActive={isAiActive}
        onNavigate={onNavigate}
      />

      {/* 6 Key Performance Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-emerald-500/40 transition-all group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-500">{kpi.label}</span>
                <div className={`p-2.5 rounded-xl ${kpi.bg}`}>
                  <Icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{kpi.value}</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                  {kpi.change}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>Activité récente</span>
            </h2>
            <p className="text-xs text-slate-500">Dernières conversations, qualifications et événements IA en direct.</p>
          </div>
          <button 
            onClick={() => onNavigate('conversations')}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center space-x-1"
          >
            <span>Voir tout</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-4">
          {recentActivity.map((act, index) => {
            const Icon = act.icon;
            return (
              <div key={index} className="flex items-start space-x-3.5 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200/60">
                <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 shrink-0 mt-0.5">
                  <Icon className={`w-4 h-4 ${act.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900">{act.title}</h4>
                    <span className="text-[11px] text-slate-400 font-medium">{act.time}</span>
                  </div>
                  <p className="text-xs text-slate-600 truncate mt-0.5">{act.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
