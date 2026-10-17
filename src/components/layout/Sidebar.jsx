import React from 'react';
import { useAuth } from '../../lib/AuthContext';

export default function Sidebar({ currentTab, onNavigate, isConnected, isMobileOpen, setIsMobileOpen }) {
  const { user, profile, business, signOut } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'grid_view' },
    { id: 'whatsapp', label: 'WhatsApp', icon: 'chat' },
    { id: 'assistant', label: 'Assistant IA', icon: 'smart_toy' },
    { id: 'prospects', label: 'Prospects', icon: 'contacts' },
    { id: 'conversations', label: 'Conversations', icon: 'forum', badge: null },
    { id: 'products', label: 'Produits', icon: 'inventory_2' },
    { id: 'automations', label: 'Automatisations', icon: 'account_tree' },
    { id: 'analytics', label: 'Analytics', icon: 'analytics' },
    { id: 'settings', label: 'Paramètres', icon: 'settings' },
  ];

  const handleLogout = async () => {
    await signOut();
    if (onNavigate) {
      onNavigate('login');
    }
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || business?.name || 'Administrateur';
  const displayEmail = user?.email || 'admin@synapsewa.com';
  const initials = displayName
    .split(' ')
    .map(p => p[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'SW';

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container - Exact Stitch Style */}
      <aside className={`
        fixed top-0 bottom-0 left-0 z-50 w-72 bg-surface-container-lowest text-on-surface flex flex-col justify-between border-r border-outline-variant/30 shadow-[0_1px_8px_rgba(0,0,0,0.04)] transition-transform duration-300 ease-in-out lg:translate-x-0
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Top Header & Navigation */}
        <div className="p-space-md flex flex-col gap-space-sm">
          {/* SynapseWA Brand Logo & Header */}
          <div className="flex items-center justify-between px-space-xs py-space-xs">
            <div className="flex items-center gap-space-sm cursor-pointer" onClick={() => onNavigate && onNavigate('dashboard')}>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-primary-container flex items-center justify-center shadow-md shadow-primary-container/20 text-white font-extrabold text-sm tracking-tight">
                S
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-base text-on-surface leading-tight tracking-tight">SynapseWA</span>
                <span className="text-xs text-on-surface-variant font-medium">Commercial IA</span>
              </div>
            </div>
            <button 
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* WhatsApp Connection Status Box */}
          <div className="mt-space-xs p-space-sm rounded-lg bg-surface-container-low flex items-center justify-between shadow-[0_1px_2px_rgba(15,23,42,0.05)] border border-outline-variant/20">
            <div className="flex items-center gap-space-sm min-w-0">
              <span className="relative flex h-2 w-2 flex-shrink-0">
                {isConnected ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-container opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-error"></span>
                )}
              </span>
              <div className="flex flex-col truncate">
                <span className="text-xs font-semibold text-on-surface truncate">
                  {isConnected ? 'Connecté' : 'Non connecté'}
                </span>
                <span className="text-[11px] text-on-surface-variant truncate font-mono">
                  {isConnected ? 'WasenderAPI actif' : 'WhatsApp Hors Ligne'}
                </span>
              </div>
            </div>
            <button 
              onClick={() => onNavigate && onNavigate('whatsapp')}
              className="p-1 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors" 
              title="Configurer WhatsApp"
              type="button"
            >
              <span className="material-symbols-outlined text-[16px]">sync</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="mt-space-sm flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (onNavigate) onNavigate(item.id);
                    setIsMobileOpen(false);
                  }}
                  className={`
                    w-full flex items-center justify-between px-space-sm py-2 rounded-lg text-sm transition-colors text-left
                    ${isActive 
                      ? 'bg-surface-container-high text-primary font-semibold shadow-xs' 
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface font-medium'}
                  `}
                >
                  <div className="flex items-center gap-space-sm truncate">
                    <span className={`material-symbols-outlined text-[20px] ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}>
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded-full bg-primary text-on-primary text-[11px] font-bold leading-none">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer User Info & Logout */}
        <div className="p-space-md bg-surface-container-lowest border-t border-outline-variant/20">
          <div className="p-space-sm rounded-lg bg-surface-container-low flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-space-sm min-w-0">
              <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                {initials}
              </div>
              <div className="flex flex-col truncate">
                <span className="text-xs font-semibold text-on-surface truncate">{displayName}</span>
                <span className="text-[11px] text-on-surface-variant truncate">{displayEmail}</span>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-colors shrink-0" 
              title="Se déconnecter"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
