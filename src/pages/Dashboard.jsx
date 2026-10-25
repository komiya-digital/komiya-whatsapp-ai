import React, { useState, useEffect, useCallback } from 'react';
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
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import OnboardingChecklist from '../components/OnboardingChecklist';
import { useAuth } from '../lib/AuthContext';
import { 
  getDashboardStats, 
  getWhatsAppConnection, 
  getAiAgent, 
  getProducts 
} from '../lib/supabaseClient';

export default function Dashboard({ onNavigate }) {
  const { user, profile, business } = useAuth();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    conversationsCount: 0,
    todayConversationsCount: 0,
    qualifiedContactsCount: 0,
    followUpContactsCount: 0,
    clientsCount: 0,
    totalMessagesCount: 0,
    totalProductsCount: 0,
    qualificationRate: '0%',
    recentActivity: []
  });

  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [isAgentConfigured, setIsAgentConfigured] = useState(false);
  const [hasProducts, setHasProducts] = useState(false);
  const [isAiActive, setIsAiActive] = useState(false);

  const loadData = useCallback(async () => {
    if (!business?.id) {
      setLoading(false);
      return;
    }

    try {
      const [statsData, waConn, agentData, productsList] = await Promise.all([
        getDashboardStats(business.id).catch(() => null),
        getWhatsAppConnection(business.id).catch(() => null),
        getAiAgent(business.id).catch(() => null),
        getProducts(business.id).catch(() => [])
      ]);

      if (statsData) setStats(statsData);
      setWhatsappConnected(Boolean(waConn?.isConnected));
      setIsAgentConfigured(Boolean(agentData?.companyDescription || agentData?.name));
      setIsAiActive(Boolean(agentData?.isActive && Boolean(agentData?.companyDescription || agentData?.customInstructions)));
      setHasProducts(Array.isArray(productsList) && productsList.length > 0);
    } catch (e) {
      console.warn('Dashboard load error:', e);
    } finally {
      setLoading(false);
    }
  }, [business?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const displayName = profile?.full_name || user?.user_metadata?.full_name || business?.name || 'sur votre espace';

  const kpis = [
    { 
      label: 'Conversations aujourd\'hui', 
      value: stats.todayConversationsCount.toString(), 
      badge: stats.todayConversationsCount > 0 ? 'En direct' : '0 actif', 
      icon: MessageSquare, 
      color: 'text-emerald-500', 
      bg: 'bg-emerald-500/10' 
    },
    { 
      label: 'Prospects qualifiés', 
      value: stats.qualifiedContactsCount.toString(), 
      badge: stats.qualifiedContactsCount > 0 ? 'Qualifiés IA' : '0 qualifié', 
      icon: UserCheck, 
      color: 'text-blue-500', 
      bg: 'bg-blue-500/10' 
    },
    { 
      label: 'Prospects à relancer', 
      value: stats.followUpContactsCount.toString(), 
      badge: stats.followUpContactsCount > 0 ? 'À traiter' : 'À jour', 
      icon: Clock, 
      color: 'text-amber-500', 
      bg: 'bg-amber-500/10' 
    },
    { 
      label: 'Clients convertis', 
      value: stats.clientsCount.toString(), 
      badge: stats.clientsCount > 0 ? 'Clients' : '0 client', 
      icon: TrendingUp, 
      color: 'text-emerald-400', 
      bg: 'bg-emerald-400/10' 
    },
    { 
      label: 'Total conversations', 
      value: stats.conversationsCount.toString(), 
      badge: 'Historique', 
      icon: Send, 
      color: 'text-indigo-500', 
      bg: 'bg-indigo-500/10' 
    },
    { 
      label: 'Taux de qualification', 
      value: stats.qualificationRate, 
      badge: 'Précision', 
      icon: Award, 
      color: 'text-purple-500', 
      bg: 'bg-purple-500/10' 
    },
  ];

  const isEmptyAccount = stats.conversationsCount === 0 && stats.qualifiedContactsCount === 0 && !hasProducts;

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Bonjour, {displayName} 👋
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {business?.name ? `Espace : ${business.name} • ` : ''}
            {isEmptyAccount 
              ? 'Bienvenue sur votre espace commercial IA. Connectez votre WhatsApp pour commencer.' 
              : 'Voici les performances en temps réel de votre commercial IA WhatsApp.'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-600">WhatsApp:</span>
            {whatsappConnected ? (
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
        isConnected={whatsappConnected}
        isAgentConfigured={isAgentConfigured}
        hasProducts={hasProducts}
        isAiActive={isAiActive}
        onNavigate={onNavigate}
      />

      {/* 6 Key Performance Indicators (Real Data from Supabase) */}
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
                  {kpi.badge}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity Section (Real Supabase Records) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>Activité récente</span>
            </h2>
            <p className="text-xs text-slate-500">Dernières conversations et qualifications enregistrées pour votre entreprise.</p>
          </div>
          <button 
            onClick={() => onNavigate('conversations')}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center space-x-1"
          >
            <span>Voir tout</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {stats.recentActivity && stats.recentActivity.length > 0 ? (
          <div className="space-y-3">
            {stats.recentActivity.map((act, index) => (
              <div key={index} className="flex items-start space-x-3.5 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200/60">
                <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 shrink-0 mt-0.5">
                  <UserCheck className={`w-4 h-4 ${act.color || 'text-emerald-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900">{act.title}</h4>
                    <span className="text-[11px] text-slate-400 font-medium">{act.time}</span>
                  </div>
                  <p className="text-xs text-slate-600 truncate mt-0.5">{act.detail}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center mx-auto mb-2 font-bold text-sm">
              💬
            </div>
            <p className="text-xs font-semibold text-slate-700">Aucune activité récente</p>
            <p className="text-[11px] text-slate-400 mt-0.5 max-w-sm mx-auto">
              Dès que vous recevrez vos premiers messages WhatsApp, vos conversations et prospects qualifiés s'afficheront ici en direct.
            </p>
            {!whatsappConnected && (
              <button
                onClick={() => onNavigate('whatsapp')}
                className="mt-3 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-lg transition-colors"
              >
                Connecter mon WhatsApp
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
