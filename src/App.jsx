import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './lib/AuthContext';
import Sidebar from './components/layout/Sidebar';
import Auth from './pages/Auth';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import WhatsAppSetup from './pages/WhatsAppSetup';
import AIAssistant from './pages/AIAssistant';
import Products from './pages/Products';
import Prospects from './pages/Prospects';
import Conversations from './pages/Conversations';
import Automations from './pages/Automations';
import Analytics from './pages/Analytics';
import SettingsPage from './pages/Settings';
import OnboardingModal from './components/OnboardingModal';
import { Menu, Sparkles, RefreshCw } from 'lucide-react';

function normalizePath(pathname) {
  const clean = (pathname || '').replace(/\/+$/, '').toLowerCase();
  if (!clean || clean === '') return '/';
  return clean;
}

function MainApp() {
  const { user, business, loading, isAuthenticated } = useAuth();

  const [currentPath, setCurrentPath] = useState(() => normalizePath(window.location.pathname));
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Sync navigation with browser URL history
  const navigate = useCallback((target) => {
    let targetPath = target;
    if (!targetPath.startsWith('/')) {
      targetPath = `/${target}`;
    }
    targetPath = normalizePath(targetPath);

    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
    setCurrentPath(targetPath);
  }, []);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(normalizePath(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Check onboarding status when business loads
  useEffect(() => {
    if (isAuthenticated && business) {
      if (business.onboarding_completed === false) {
        setShowOnboarding(true);
      }
    }
  }, [isAuthenticated, business]);

  // Route protection & redirection
  useEffect(() => {
    if (loading) return;

    const authOnlyPaths = ['/login', '/register', '/forgot-password', '/reset-password'];
    const isAuthOnly = authOnlyPaths.includes(currentPath);

    if (!isAuthenticated) {
      // '/' is the public landing page, and authOnlyPaths are the public auth pages
      const isPublic = currentPath === '/' || isAuthOnly;
      if (!isPublic) {
        // Redirect unauthenticated user trying to access /dashboard or any protected route
        window.history.replaceState(null, '', '/login');
        setCurrentPath('/login');
      }
    } else if (isAuthenticated && isAuthOnly) {
      // Redirect logged-in user away from /login and /register to /dashboard
      window.history.replaceState(null, '', '/dashboard');
      setCurrentPath('/dashboard');
    }
  }, [loading, isAuthenticated, currentPath]);

  // 1. Loading screen while verifying session (Prevents any flash of Dashboard)
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-emerald-400 flex items-center justify-center shadow-xl shadow-emerald-500/20">
            <Sparkles className="w-7 h-7 text-slate-950 stroke-[2.5]" />
          </div>
          <div className="flex items-center space-x-2 text-slate-300 text-sm font-semibold">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
            <span>Chargement de votre session sécurisée...</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Public Landing Page at root '/'
  if (currentPath === '/') {
    return (
      <LandingPage 
        onNavigate={navigate} 
        isAuthenticated={isAuthenticated} 
      />
    );
  }

  // 3. Unauthenticated Routes
  if (!isAuthenticated) {
    let mode = 'login';
    if (currentPath === '/register') mode = 'register';
    else if (currentPath === '/forgot-password') mode = 'forgot';
    else if (currentPath === '/reset-password') mode = 'reset';

    return <Auth initialMode={mode} onNavigate={navigate} />;
  }

  // 3. Authenticated SaaS App
  const activeTab = currentPath.replace(/^\//, '') || 'dashboard';

  return (
    <div className="min-h-screen bg-background text-on-surface flex font-sans">
      {/* Onboarding Wizard for new user */}
      <OnboardingModal 
        isOpen={showOnboarding} 
        onClose={() => setShowOnboarding(false)} 
      />

      {/* Responsive Sidebar - 72 (18rem) */}
      <Sidebar
        currentTab={activeTab}
        onNavigate={navigate}
        isConnected={Boolean(business?.whatsapp_connections?.[0]?.is_connected)}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0 min-h-screen">
        {/* Top Header Bar - Exact Stitch Style */}
        <header className="sticky lg:fixed top-0 left-0 lg:left-72 right-0 h-16 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-outline-variant/20 z-40 flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[22px]">menu</span>
            </button>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-low text-on-surface-variant w-72 md:w-80 border border-outline-variant/10">
              <span className="material-symbols-outlined text-[18px]">search</span>
              <input 
                className="bg-transparent border-none outline-none text-xs text-on-surface placeholder:text-on-surface-variant w-full"
                placeholder="Rechercher prospects, flux, messages..." 
                type="text"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container">
              <span className="material-symbols-outlined text-[16px] text-primary">bolt</span>
              <span className="text-xs font-semibold">AIService: Actif (99.8%)</span>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigate('assistant')}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high text-xs font-semibold transition-colors" 
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">science</span>
                <span className="hidden sm:inline">Tester IA</span>
              </button>
              <button 
                onClick={() => navigate('prospects')}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary text-xs font-bold transition-all shadow-[0_1px_2px_rgba(0,200,150,0.2)]" 
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">person_add</span>
                <span>+ Nouveau contact</span>
              </button>
            </div>

            <div className="h-6 w-px bg-outline-variant/30 hidden sm:block"></div>

            <div 
              onClick={() => navigate('settings')}
              className="w-8 h-8 rounded-full bg-surface-container-high text-primary flex items-center justify-center font-bold text-xs cursor-pointer hover:ring-2 hover:ring-primary transition-all shadow-xs"
              title="Mon Profil"
            >
              {user?.email ? user.email.charAt(0).toUpperCase() : 'S'}
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 pt-4 lg:pt-20 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <Dashboard onNavigate={navigate} />
          )}

          {activeTab === 'whatsapp' && (
            <WhatsAppSetup onNavigate={navigate} />
          )}

          {activeTab === 'assistant' && (
            <AIAssistant onNavigate={navigate} />
          )}

          {activeTab === 'prospects' && (
            <Prospects onNavigate={navigate} />
          )}

          {activeTab === 'conversations' && (
            <Conversations onNavigate={navigate} />
          )}

          {activeTab === 'products' && (
            <Products onNavigate={navigate} />
          )}

          {activeTab === 'automations' && (
            <Automations onNavigate={navigate} />
          )}

          {activeTab === 'analytics' && (
            <Analytics onNavigate={navigate} />
          )}

          {activeTab === 'settings' && (
            <SettingsPage onNavigate={navigate} />
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
