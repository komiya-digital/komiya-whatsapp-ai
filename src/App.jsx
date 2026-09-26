import React, { useState, useEffect } from 'react';
import { getLocalStore, saveLocalStore } from './lib/supabaseClient';
import Sidebar from './components/layout/Sidebar';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import WhatsAppSetup from './pages/WhatsAppSetup';
import AIAssistant from './pages/AIAssistant';
import Products from './pages/Products';
import Prospects from './pages/Prospects';
import Conversations from './pages/Conversations';
import Automations from './pages/Automations';
import Analytics from './pages/Analytics';
import SettingsPage from './pages/Settings';
import { Menu, Sparkles } from 'lucide-react';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [appState, setAppState] = useState(() => getLocalStore());

  useEffect(() => {
    saveLocalStore(appState);
  }, [appState]);

  const handleUpdateState = (newState) => {
    setAppState(prev => {
      const updated = { ...prev, ...newState };
      saveLocalStore(updated);
      return updated;
    });
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Auth onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Responsive Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isConnected={appState.whatsapp.isConnected}
        onLogout={handleLogout}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 min-h-screen">
        {/* Mobile Header Bar */}
        <header className="lg:hidden bg-slate-900 text-white p-4 border-b border-slate-800 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-200"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="font-extrabold text-sm tracking-tight">Komiya WhatsApp AI</span>
            </div>
          </div>

          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
            appState.whatsapp.isConnected ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400'
          }`}>
            {appState.whatsapp.isConnected ? '🟢 Connecté' : '🔴 Non connecté'}
          </span>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <Dashboard state={appState} onNavigate={setCurrentTab} />
          )}

          {currentTab === 'whatsapp' && (
            <WhatsAppSetup state={appState} onUpdateState={handleUpdateState} />
          )}

          {currentTab === 'assistant' && (
            <AIAssistant state={appState} onUpdateState={handleUpdateState} />
          )}

          {currentTab === 'prospects' && (
            <Prospects state={appState} onNavigate={setCurrentTab} />
          )}

          {currentTab === 'conversations' && (
            <Conversations state={appState} onUpdateState={handleUpdateState} />
          )}

          {currentTab === 'products' && (
            <Products state={appState} onUpdateState={handleUpdateState} />
          )}

          {currentTab === 'automations' && (
            <Automations state={appState} onUpdateState={handleUpdateState} />
          )}

          {currentTab === 'analytics' && (
            <Analytics />
          )}

          {currentTab === 'settings' && (
            <SettingsPage state={appState} onUpdateState={handleUpdateState} />
          )}
        </main>
      </div>
    </div>
  );
}
