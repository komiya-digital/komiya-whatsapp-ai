import React from 'react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Bot, 
  Users, 
  MessageCircle, 
  Package, 
  Zap, 
  BarChart3, 
  Settings, 
  LogOut, 
  Sparkles,
  CheckCircle2,
  XCircle,
  Menu,
  X
} from 'lucide-react';

export default function Sidebar({ currentTab, setCurrentTab, isConnected, onLogout, isMobileOpen, setIsMobileOpen }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
    { id: 'assistant', label: 'Assistant IA', icon: Bot },
    { id: 'prospects', label: 'Prospects', icon: Users },
    { id: 'conversations', label: 'Conversations', icon: MessageCircle, badge: 1 },
    { id: 'products', label: 'Produits', icon: Package },
    { id: 'automations', label: 'Automatisations', icon: Zap },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Paramètres', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-100 flex flex-col justify-between border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div>
          <div className="flex items-center justify-between p-5 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Sparkles className="w-5 h-5 text-slate-900 stroke-[2.5]" />
              </div>
              <div>
                <h1 className="font-bold text-base tracking-tight text-white flex items-center space-x-1.5">
                  <span>Komiya</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">AI</span>
                </h1>
                <p className="text-xs text-slate-400 font-medium">WhatsApp Commercial IA</p>
              </div>
            </div>
            <button 
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Connection Status Indicator */}
          <div className="mx-4 my-4 p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              {isConnected ? (
                <div className="relative flex items-center justify-center">
                  <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </div>
              ) : (
                <span className="inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              )}
              <span className="text-xs font-semibold tracking-wide text-slate-200">
                WhatsApp API
              </span>
            </div>
            {isConnected ? (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                🟢 Connecté
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                🔴 Non connecté
              </span>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentTab(item.id);
                    setIsMobileOpen(false);
                  }}
                  className={`
                    w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                    ${isActive 
                      ? 'bg-emerald-500 text-slate-950 font-semibold shadow-md shadow-emerald-500/15' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80'}
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950 stroke-[2.5]' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`px-2 py-0.5 text-xs rounded-full font-bold ${isActive ? 'bg-slate-950 text-white' : 'bg-emerald-500/20 text-emerald-400'}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer User Info & Logout */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-200">
                KD
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-white leading-tight">Komiya Digital</p>
                <p className="text-[11px] text-slate-400">contact@komiyadigital.ci</p>
              </div>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  );
}
