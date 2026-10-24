import React, { useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  MessageSquare, 
  Clock, 
  Users, 
  ShoppingBag, 
  Sliders, 
  CheckCircle2, 
  ArrowRight, 
  ChevronDown, 
  Menu, 
  X, 
  ShieldCheck, 
  Zap, 
  Check, 
  TrendingUp,
  Store,
  GraduationCap,
  Briefcase,
  Layers,
  Inbox,
  HelpCircle,
  PhoneCall,
  Lock,
  Search,
  Activity,
  Award,
  ChevronRight,
  Send,
  Download
} from 'lucide-react';

export default function LandingPage({ onNavigate, isAuthenticated }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [legalModal, setLegalModal] = useState(null); // 'privacy' | 'terms' | null

  const toggleFaq = (index) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleRegisterClick = () => {
    if (onNavigate) {
      if (isAuthenticated) {
        onNavigate('dashboard');
      } else {
        onNavigate('register');
      }
    }
  };

  const handleLoginClick = () => {
    if (onNavigate) {
      if (isAuthenticated) {
        onNavigate('dashboard');
      } else {
        onNavigate('login');
      }
    }
  };

  const faqItems = [
    {
      q: "Komiya WhatsApp AI fonctionne-t-il lorsque je suis hors ligne ?",
      a: "Oui, si votre compte est correctement configuré et que les services nécessaires sont opérationnels, l'assistant peut traiter automatiquement les messages selon vos règles."
    },
    {
      q: "Dois-je savoir programmer ?",
      a: "Non. La configuration doit être accessible depuis votre espace utilisateur."
    },
    {
      q: "Puis-je répondre moi-même aux clients ?",
      a: "Oui. Vous pouvez reprendre la main sur une conversation lorsque cela est nécessaire, si cette fonctionnalité est activée dans votre compte."
    },
    {
      q: "Puis-je utiliser mes propres produits et tarifs ?",
      a: "Oui. L'assistant utilise les informations que vous renseignez dans votre catalogue."
    },
    {
      q: "Comment commencer ?",
      a: "Créez un compte, configurez votre activité et suivez les étapes de connexion WhatsApp proposées dans votre espace."
    }
  ];

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans antialiased selection:bg-primary-container/30 selection:text-on-primary-container">
      
      {/* ========================================================= */}
      {/* 2. NAVIGATION (Stitch Header Style)                       */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-50 bg-surface-container-lowest/90 backdrop-blur-xl border-b border-outline-variant/20 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo Brand */}
          <div 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-primary-container flex items-center justify-center text-white shadow-md shadow-primary-container/20 transition-transform group-hover:scale-105">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12c0 1.95.56 3.77 1.53 5.33L2.5 21.5l4.31-1.01A9.94 9.94 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 17.5c-1.57 0-3.04-.47-4.28-1.28l-.31-.2-2.55.6.61-2.48-.2-.33A7.44 7.44 0 0 1 4.5 12c0-4.14 3.36-7.5 7.5-7.5s7.5 3.36 7.5 7.5-3.36 7.5-7.5 7.5z"/>
                <circle cx="9.5" cy="11.5" r="1.2"/>
                <circle cx="14.5" cy="11.5" r="1.2"/>
                <path d="M9.5 14.5c1 .8 4 .8 5 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-on-surface leading-none">
                Komiya
              </span>
              <span className="text-[11px] font-bold text-primary tracking-wider uppercase mt-0.5">
                WhatsApp AI
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => scrollToSection('features')}
              className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
            >
              Fonctionnalités
            </button>
            <button 
              onClick={() => scrollToSection('how-it-works')}
              className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
            >
              Comment ça marche
            </button>
            <button 
              onClick={() => scrollToSection('faq')}
              className="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors"
            >
              FAQ
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            {/* Live Service Pill from Stitch */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-xs font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-container opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span>IA 24/7 Active</span>
            </div>

            <div className="h-5 w-px bg-outline-variant/30 hidden lg:block" />

            {isAuthenticated ? (
              <button
                onClick={() => onNavigate && onNavigate('dashboard')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-container text-on-primary-container font-bold text-sm hover:bg-primary hover:text-on-primary transition-all shadow-[0_1px_2px_rgba(0,200,150,0.2)] active:scale-95"
              >
                <span>Mon Espace Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={handleLoginClick}
                  className="text-sm font-semibold text-on-surface hover:text-primary px-3.5 py-2 rounded-lg hover:bg-surface-container transition-colors"
                >
                  Connexion
                </button>
                <button
                  onClick={handleRegisterClick}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-container text-on-primary-container font-bold text-sm hover:bg-primary hover:text-on-primary transition-all shadow-[0_1px_2px_rgba(0,200,150,0.2)] hover:scale-[1.02] active:scale-95"
                >
                  <span>Commencer gratuitement</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-on-surface hover:bg-surface-container transition-colors"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-outline-variant/20 bg-surface-container-lowest px-4 pt-2 pb-6 space-y-3 shadow-lg animate-in slide-in-from-top-2">
            <button
              onClick={() => scrollToSection('features')}
              className="block w-full text-left py-2.5 text-base font-medium text-on-surface hover:text-primary"
            >
              Fonctionnalités
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="block w-full text-left py-2.5 text-base font-medium text-on-surface hover:text-primary"
            >
              Comment ça marche
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="block w-full text-left py-2.5 text-base font-medium text-on-surface hover:text-primary"
            >
              FAQ
            </button>
            
            <div className="pt-4 border-t border-outline-variant/20 flex flex-col gap-3">
              {isAuthenticated ? (
                <button
                  onClick={() => onNavigate && onNavigate('dashboard')}
                  className="w-full text-center py-3 rounded-xl bg-primary-container text-on-primary-container font-bold text-sm"
                >
                  Accéder au Dashboard →
                </button>
              ) : (
                <>
                  <button
                    onClick={handleLoginClick}
                    className="w-full text-center py-2.5 rounded-xl border border-outline-variant/30 text-on-surface font-semibold text-sm hover:bg-surface-container-low"
                  >
                    Connexion
                  </button>
                  <button
                    onClick={handleRegisterClick}
                    className="w-full text-center py-3 rounded-xl bg-primary-container text-on-primary-container font-bold text-sm hover:bg-primary hover:text-on-primary"
                  >
                    Commencer gratuitement →
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ========================================================= */}
      {/* 3. HERO SECTION (Stitch Atmosphere & Dashboard Canvas)    */}
      {/* ========================================================= */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        
        {/* Dynamic Gradient Ambient Backdrops from Stitch */}
        <div className="absolute -top-12 -left-12 w-96 h-96 bg-primary-fixed/25 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-48 right-0 w-96 h-96 bg-surface-container-high/60 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-1/3 left-1/3 w-80 h-80 bg-secondary-container/20 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Text & CTAs */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              
              {/* Badge with Live Pulse from Stitch */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-semibold mb-6 shadow-xs border border-outline-variant/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-container opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span>Votre commercial IA sur WhatsApp</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-on-surface tracking-tight leading-[1.12] mb-6">
                Vendez sur WhatsApp.<br />
                <span className="text-primary-container drop-shadow-xs">Même quand vous dormez.</span>
              </h1>

              {/* Description */}
              <p className="text-lg sm:text-xl text-on-surface-variant leading-relaxed mb-8 max-w-2xl font-normal">
                Automatisez vos réponses, qualifiez vos prospects et ne laissez plus vos clients sans réponse. Votre assistant IA travaille pour votre business, 24h/24.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto mb-8">
                <button
                  onClick={handleRegisterClick}
                  className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-primary-container text-on-primary-container font-extrabold text-base hover:bg-primary hover:text-on-primary transition-all shadow-[0_1px_2px_rgba(0,200,150,0.2)] hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Commencer gratuitement →</span>
                </button>
                <button
                  onClick={() => scrollToSection('how-it-works')}
                  className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-on-surface font-semibold text-base hover:bg-surface-container-low transition-all shadow-xs"
                >
                  <span>Découvrir comment ça marche</span>
                </button>
              </div>

              {/* Reassurance text */}
              <div className="flex items-center gap-2 text-xs sm:text-sm text-on-surface-variant font-medium">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>Simple à configurer · Disponible 24h/24 · Pensé pour les entrepreneurs africains</span>
              </div>
            </div>

            {/* Right Column: Realistic Stitch Product Showcase */}
            <div className="lg:col-span-5 relative">
              
              {/* Product preview card combining Stitch Dashboard Aesthetic & WhatsApp */}
              <div className="relative mx-auto max-w-md w-full bg-surface-container-lowest rounded-3xl border border-outline-variant/20 shadow-[0_8px_30px_rgba(11,28,48,0.08)] overflow-hidden">
                
                {/* Stitch Mini App Top Window Bar */}
                <div className="bg-surface-container-low px-4 py-3 border-b border-outline-variant/20 flex items-center justify-between text-xs text-on-surface-variant">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-400/80"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400/80"></span>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/80"></span>
                    </div>
                    <span className="font-mono text-[11px] text-on-surface font-semibold ml-1">Komiya OS</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                    <span>Wasender Direct Sync</span>
                  </div>
                </div>

                {/* WhatsApp Conversation Header */}
                <div className="bg-primary px-4 py-3 flex items-center justify-between text-white">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container font-bold shadow-inner">
                        <Bot className="w-5 h-5 text-on-primary-container" />
                      </div>
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-secondary-container border-2 border-primary" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold leading-tight">Assistant IA Komiya</h4>
                      <p className="text-[10px] text-secondary-container flex items-center gap-1 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary-container" />
                        En ligne 24h/24
                      </p>
                    </div>
                  </div>
                  <div className="px-2 py-0.5 rounded bg-white/15 text-[10px] font-semibold tracking-wider text-emerald-100">
                    SaaS Actif
                  </div>
                </div>

                {/* Chat Messages Body */}
                <div className="p-4 bg-[#F5F7FA] space-y-3 text-xs font-normal min-h-[320px] flex flex-col justify-end">
                  
                  {/* Date badge */}
                  <div className="text-center my-0.5">
                    <span className="bg-surface-container-lowest text-[10px] font-medium text-on-surface-variant px-2.5 py-0.5 rounded-md shadow-xs border border-outline-variant/10">
                      Aujourd'hui
                    </span>
                  </div>

                  {/* Customer Message */}
                  <div className="flex flex-col items-start max-w-[85%] self-start">
                    <div className="bg-white text-on-surface rounded-2xl rounded-tl-xs p-3 shadow-xs border border-outline-variant/10">
                      <p className="leading-relaxed">
                        Bonjour ! Je suis intéressée par le Sérum Éclat 50ml. Quel est le prix svp et est-ce disponible à Abidjan ?
                      </p>
                      <span className="block text-[10px] text-on-surface-variant/70 text-right mt-1">
                        14:02
                      </span>
                    </div>
                  </div>

                  {/* AI Assistant Message (WhatsApp green tone + Stitch Primary Badge) */}
                  <div className="flex flex-col items-end max-w-[88%] self-end">
                    <div className="bg-[#DCF8C6] text-on-surface rounded-2xl rounded-tr-xs p-3 shadow-xs border border-[#C5E8AF]">
                      <div className="flex items-center gap-1 text-[10px] text-primary font-bold mb-1">
                        <Sparkles className="w-3 h-3 text-primary-container" />
                        <span>Réponse automatique IA</span>
                      </div>
                      <p className="leading-relaxed">
                        Bonjour Aminata ! 😊 Oui, le Sérum Éclat 50ml est bien disponible en stock au prix de <strong>15 000 FCFA</strong>. Nous livrons partout à Abidjan sous 24h (1 500 FCFA).
                      </p>
                      <p className="mt-1.5 leading-relaxed font-medium text-on-surface">
                        Souhaitez-vous que je valide votre commande pour une livraison aujourd'hui ?
                      </p>
                      <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-on-surface-variant">
                        <span>14:02</span>
                        <Check className="w-3.5 h-3.5 text-[#34B7F1]" />
                      </div>
                    </div>
                  </div>

                  {/* Customer follow-up */}
                  <div className="flex flex-col items-start max-w-[80%] self-start">
                    <div className="bg-white text-on-surface rounded-2xl rounded-tl-xs p-2.5 shadow-xs border border-outline-variant/10">
                      <p className="leading-relaxed">
                        Oui super, je prends un flacon ! Livraison à Cocody Angré.
                      </p>
                      <span className="block text-[10px] text-on-surface-variant/70 text-right mt-0.5">
                        14:03
                      </span>
                    </div>
                  </div>

                </div>

                {/* Input simulation bar */}
                <div className="p-2.5 bg-surface-container-low border-t border-outline-variant/20 flex items-center gap-2">
                  <div className="flex-1 bg-surface-container-lowest rounded-full px-3.5 py-1.5 text-[11px] text-on-surface-variant border border-outline-variant/20">
                    L'IA gère la conversation...
                  </div>
                  <div className="w-7 h-7 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container shadow-xs">
                    <Bot className="w-4 h-4 text-on-primary-container" />
                  </div>
                </div>

              </div>

              {/* Floating Badge 1: Prospect Qualifié (Directly from Stitch CRM row) */}
              <div className="absolute -top-5 -right-2 sm:-right-5 bg-surface-container-lowest rounded-2xl p-3.5 shadow-[0_8px_20px_rgba(0,0,0,0.06)] border border-outline-variant/20 flex items-center gap-3 animate-in fade-in zoom-in-95 backdrop-blur-md">
                <div className="w-10 h-10 rounded-xl bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-on-surface">Prospect qualifié</span>
                    <span className="px-1.5 py-0.2 bg-secondary-container text-on-secondary-container rounded text-[10px] font-bold">Chaud 80%</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant font-medium">Sérum Éclat · 15 000 FCFA</p>
                </div>
              </div>

              {/* Floating Badge 2: Stitch KPI & Sparkline */}
              <div className="absolute -bottom-5 -left-2 sm:-left-5 bg-surface-container-lowest rounded-2xl p-3.5 shadow-[0_8px_20px_rgba(0,0,0,0.06)] border border-outline-variant/20 flex items-center gap-3 backdrop-blur-md">
                <div className="w-10 h-10 rounded-xl bg-surface-container text-primary flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-xs font-bold text-on-surface">Temps de réponse &lt; 1.4s</div>
                  <p className="text-[11px] text-on-surface-variant font-medium">Disponibilité : 24h/24 · 7j/7</p>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. SECTION PROBLÈME (Stitch Card Layout)                  */}
      {/* ========================================================= */}
      <section className="py-24 bg-surface-container-low/60 border-y border-outline-variant/20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-primary uppercase tracking-wider mb-2 block">
              Le constat sur le terrain
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight leading-tight">
              Combien de clients perdez-vous lorsque vous êtes indisponible ?
            </h2>
            <p className="mt-4 text-base sm:text-lg text-on-surface-variant">
              Sur WhatsApp, la rapidité est le facteur décisif pour conclure une vente. Chaque minute de silence réduit considérablement l'intérêt de votre acheteur.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            
            {/* Card 1 */}
            <div className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/20 shadow-[0_1px_8px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-error/30 transition-all">
              <div className="w-12 h-12 rounded-xl bg-error-container text-on-error-container flex items-center justify-center mb-6">
                <Clock className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-3">
                Des messages sans réponse
              </h3>
              <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
                Vos clients attendent. Certains finissent par acheter ailleurs.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/20 shadow-[0_1px_8px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-amber-400/30 transition-all">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-6">
                <Inbox className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-3">
                Des prospects difficiles à suivre
              </h3>
              <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
                Les conversations s'accumulent et les opportunités se perdent.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/20 shadow-[0_1px_8px_rgba(0,0,0,0.04)] hover:shadow-md hover:border-primary-container/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center mb-6">
                <HelpCircle className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-3">
                Du temps consacré aux mêmes questions
              </h3>
              <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed">
                Prix, produits, disponibilité : vous répétez souvent les mêmes réponses.
              </p>
            </div>

          </div>

          {/* Conclusion Statement */}
          <div className="max-w-2xl mx-auto text-center p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 shadow-sm">
            <p className="text-base sm:text-lg font-semibold text-on-surface">
              « Komiya automatise les échanges répétitifs pour vous permettre de vous concentrer sur votre activité. »
            </p>
          </div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. SECTION FONCTIONNALITÉS (Stitch Interactive Grid)      */}
      {/* ========================================================= */}
      <section id="features" className="py-24 bg-background scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-primary uppercase tracking-wider mb-2 block">
              Fonctionnalités Clés
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
              Votre assistant commercial, toujours disponible.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-on-surface-variant">
              Des outils intelligents conçus pour convertir vos conversations WhatsApp en ventes réelles, sans friction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Feature 1 */}
            <div className="p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant/20 hover:border-primary-container/40 shadow-[0_1px_8px_rgba(0,0,0,0.04)] hover:shadow-lg transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-surface-container text-primary flex items-center justify-center mb-6 shadow-xs group-hover:scale-105 transition-transform">
                <Bot className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-3">
                Réponses automatiques par IA
              </h3>
              <p className="text-base text-on-surface-variant leading-relaxed">
                Répondez rapidement aux questions de vos clients, même en dehors de vos horaires.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant/20 hover:border-primary-container/40 shadow-[0_1px_8px_rgba(0,0,0,0.04)] hover:shadow-lg transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-surface-container text-primary flex items-center justify-center mb-6 shadow-xs group-hover:scale-105 transition-transform">
                <Users className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-3">
                Qualification des prospects
              </h3>
              <p className="text-base text-on-surface-variant leading-relaxed">
                Identifiez les besoins, les produits recherchés et les prospects les plus intéressés.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant/20 hover:border-primary-container/40 shadow-[0_1px_8px_rgba(0,0,0,0.04)] hover:shadow-lg transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-surface-container text-primary flex items-center justify-center mb-6 shadow-xs group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-3">
                Présentation de vos produits
              </h3>
              <p className="text-base text-on-surface-variant leading-relaxed">
                Donnez à votre assistant les informations sur votre catalogue, vos prix et vos offres.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 rounded-3xl bg-surface-container-lowest border border-outline-variant/20 hover:border-primary-container/40 shadow-[0_1px_8px_rgba(0,0,0,0.04)] hover:shadow-lg transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-surface-container text-primary flex items-center justify-center mb-6 shadow-xs group-hover:scale-105 transition-transform">
                <Sliders className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-3">
                Suivi des conversations
              </h3>
              <p className="text-base text-on-surface-variant leading-relaxed">
                Retrouvez vos échanges, consultez vos prospects et reprenez la main à tout moment.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. SECTION COMMENT ÇA MARCHE (Stitch Step Progression)   */}
      {/* ========================================================= */}
      <section id="how-it-works" className="py-24 bg-surface-container-low/50 border-y border-outline-variant/20 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-primary uppercase tracking-wider mb-2 block">
              Mise en route
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
              Prêt en quelques étapes.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-on-surface-variant">
              Une configuration simple et directe, pensée pour être prête en quelques minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            
            {/* Step 1 */}
            <div className="relative bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/20 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-4xl font-black text-secondary-container mb-4">
                01
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-3">
                Connectez votre WhatsApp
              </h3>
              <p className="text-base text-on-surface-variant leading-relaxed">
                Configurez votre connexion WhatsApp depuis votre espace.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/20 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-4xl font-black text-secondary-container mb-4">
                02
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-3">
                Configurez votre assistant IA
              </h3>
              <p className="text-base text-on-surface-variant leading-relaxed">
                Présentez votre activité, vos produits et votre manière de répondre aux clients.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/20 shadow-sm hover:shadow-md transition-shadow">
              <div className="text-4xl font-black text-primary-container mb-4">
                03
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-3">
                Laissez l'IA vous assister
              </h3>
              <p className="text-base text-on-surface-variant leading-relaxed">
                Votre assistant répond aux questions et qualifie les prospects selon vos paramètres.
              </p>
            </div>

          </div>

          {/* Action Button */}
          <div className="text-center">
            <button
              onClick={handleRegisterClick}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-primary-container text-on-primary-container font-extrabold text-base hover:bg-primary hover:text-on-primary transition-all shadow-[0_1px_2px_rgba(0,200,150,0.2)] hover:shadow-lg hover:scale-[1.02] active:scale-95"
            >
              <span>Créer mon compte</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* 7. SECTION CIBLE                                          */}
      {/* ========================================================= */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-primary uppercase tracking-wider mb-2 block">
              Pour qui ?
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
              Conçu pour les entrepreneurs qui vendent sur WhatsApp.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-on-surface-variant">
              Komiya s'intègre parfaitement aux besoins quotidiens de ceux qui font du commerce via messagerie.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
            
            <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 shadow-xs text-center flex flex-col items-center hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-surface-container text-primary flex items-center justify-center mb-4 shadow-xs">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-on-surface text-base mb-1">Boutiques en ligne</h4>
              <p className="text-xs text-on-surface-variant">Mode, beauté, accessoires, tech et produits physiques.</p>
            </div>

            <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 shadow-xs text-center flex flex-col items-center hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-surface-container text-primary flex items-center justify-center mb-4 shadow-xs">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-on-surface text-base mb-1">Produits digitaux & formations</h4>
              <p className="text-xs text-on-surface-variant">Ebooks, programmes, cours, coaching et webinaires.</p>
            </div>

            <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 shadow-xs text-center flex flex-col items-center hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-surface-container text-primary flex items-center justify-center mb-4 shadow-xs">
                <Store className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-on-surface text-base mb-1">Commerçants</h4>
              <p className="text-xs text-on-surface-variant">Points de vente, grossistes, distributeurs et détaillants.</p>
            </div>

            <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 shadow-xs text-center flex flex-col items-center hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-surface-container text-primary flex items-center justify-center mb-4 shadow-xs">
                <Briefcase className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-on-surface text-base mb-1">Prestataires de services</h4>
              <p className="text-xs text-on-surface-variant">Agences, freelances, consultants, salons et instituts.</p>
            </div>

            <div className="p-6 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 shadow-xs text-center flex flex-col items-center hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-surface-container text-primary flex items-center justify-center mb-4 shadow-xs">
                <Layers className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-on-surface text-base mb-1">Petites entreprises</h4>
              <p className="text-xs text-on-surface-variant">PME, artisans et producteurs locaux en développement.</p>
            </div>

          </div>

          <div className="text-center">
            <p className="text-base sm:text-lg font-semibold text-on-surface">
              « Quel que soit votre secteur, votre assistant s'adapte aux informations de votre entreprise. »
            </p>
          </div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* 8. SECTION FAQ (Stitch Accordion Design)                  */}
      {/* ========================================================= */}
      <section id="faq" className="py-24 bg-surface-container-low/50 border-t border-outline-variant/20 scroll-mt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-primary uppercase tracking-wider mb-2 block">
              FAQ
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight">
              Questions fréquentes
            </h2>
            <p className="mt-4 text-base text-on-surface-variant">
              Tout ce que vous devez savoir pour démarrer en toute sérénité.
            </p>
          </div>

          <div className="space-y-4">
            {faqItems.map((item, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div 
                  key={index}
                  className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-xs overflow-hidden transition-all hover:border-primary-container/30"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 font-bold text-on-surface text-base sm:text-lg hover:text-primary transition-colors"
                  >
                    <span>{item.q}</span>
                    <ChevronDown className={`w-5 h-5 text-on-surface-variant shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 pt-1 text-on-surface-variant text-base leading-relaxed border-t border-outline-variant/10">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* 9. CTA FINAL (Stitch Vibrant Accent Container)            */}
      {/* ========================================================= */}
      <section className="py-20 bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="rounded-3xl bg-gradient-to-br from-secondary-container/40 via-surface-container-low to-primary-fixed/20 border border-outline-variant/30 p-10 sm:p-14 text-center relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-container/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary-container/20 rounded-full blur-2xl pointer-events-none" />

            <h2 className="text-3xl sm:text-4xl font-extrabold text-on-surface tracking-tight mb-4 relative z-10">
              Et si votre prochain client recevait une réponse immédiatement ?
            </h2>
            <p className="text-base sm:text-lg text-on-surface-variant max-w-2xl mx-auto mb-8 relative z-10">
              Passez moins de temps à répondre aux mêmes questions et concentrez-vous sur le développement de votre business.
            </p>
            <div className="relative z-10">
              <button
                onClick={handleRegisterClick}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-primary-container text-on-primary-container font-extrabold text-base hover:bg-primary hover:text-on-primary transition-all shadow-[0_1px_2px_rgba(0,200,150,0.2)] hover:shadow-lg hover:scale-[1.02] active:scale-95"
              >
                <span>Commencer maintenant →</span>
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* 10. FOOTER                                                */}
      {/* ========================================================= */}
      <footer className="bg-surface-container-lowest border-t border-outline-variant/20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 pb-8 border-b border-outline-variant/20">
            
            {/* Logo */}
            <div 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-primary-container flex items-center justify-center text-white shadow-xs">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12c0 1.95.56 3.77 1.53 5.33L2.5 21.5l4.31-1.01A9.94 9.94 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 17.5c-1.57 0-3.04-.47-4.28-1.28l-.31-.2-2.55.6.61-2.48-.2-.33A7.44 7.44 0 0 1 4.5 12c0-4.14 3.36-7.5 7.5-7.5s7.5 3.36 7.5 7.5-3.36 7.5-7.5 7.5z"/>
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-extrabold tracking-tight text-on-surface">
                  Komiya WhatsApp AI
                </span>
                <span className="text-[11px] text-on-surface-variant font-medium">
                  Commercial IA 24h/24 pour entrepreneurs africains
                </span>
              </div>
            </div>

            {/* Links */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-semibold text-on-surface-variant">
              <button 
                onClick={() => scrollToSection('features')}
                className="hover:text-primary transition-colors"
              >
                Fonctionnalités
              </button>
              <button 
                onClick={handleLoginClick}
                className="hover:text-primary transition-colors"
              >
                Connexion
              </button>
              <button 
                onClick={handleRegisterClick}
                className="hover:text-primary transition-colors"
              >
                Inscription
              </button>
              <button 
                onClick={() => setLegalModal('privacy')}
                className="hover:text-primary transition-colors"
              >
                Politique de confidentialité
              </button>
              <button 
                onClick={() => setLegalModal('terms')}
                className="hover:text-primary transition-colors"
              >
                Conditions d'utilisation
              </button>
            </div>

          </div>

          <div className="pt-8 text-center md:text-left flex flex-col md:flex-row items-center justify-between text-xs text-on-surface-variant gap-4">
            <p>
              © {new Date().getFullYear()} Komiya WhatsApp AI. Tous droits réservés.
            </p>
            <p className="text-on-surface-variant/70">
              Conçu avec rigueur et simplicité pour le commerce conversationnel en Afrique.
            </p>
          </div>

        </div>
      </footer>

      {/* ========================================================= */}
      {/* LEGAL MODALS (Zero 404s, Real Legal Content)               */}
      {/* ========================================================= */}
      {legalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-on-surface/40 backdrop-blur-xs">
          <div className="bg-surface-container-lowest rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-outline-variant/20">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant/20 mb-6">
              <h3 className="text-xl font-bold text-on-surface">
                {legalModal === 'privacy' ? 'Politique de confidentialité' : 'Conditions d\'utilisation'}
              </h3>
              <button
                onClick={() => setLegalModal(null)}
                className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-sm text-on-surface-variant leading-relaxed space-y-4">
              {legalModal === 'privacy' ? (
                <>
                  <p>
                    Chez <strong>Komiya WhatsApp AI</strong>, la protection de vos données et de celles de vos clients est une priorité absolue.
                  </p>
                  <h4 className="text-base font-bold text-on-surface pt-2">1. Données collectées</h4>
                  <p>
                    Nous collectons uniquement les informations indispensables au bon fonctionnement de votre assistant : nom de votre entreprise, catalogue de produits et coordonnées de contact.
                  </p>
                  <h4 className="text-base font-bold text-on-surface pt-2">2. Confidentialité des conversations</h4>
                  <p>
                    Les conversations traitées par votre assistant IA restent strictement isolées au sein de votre compte utilisateur. Vos données ne sont ni revendues, ni partagées à des tiers à des fins publicitaires.
                  </p>
                  <h4 className="text-base font-bold text-on-surface pt-2">3. Sécurité</h4>
                  <p>
                    Toutes les connexions et échanges avec nos serveurs et la base de données Supabase sont sécurisés et chiffrés selon les normes industrielles en vigueur (TLS/SSL).
                  </p>
                </>
              ) : (
                <>
                  <p>
                    En utilisant le service <strong>Komiya WhatsApp AI</strong>, vous acceptez les conditions générales suivantes régissant l'utilisation de la plateforme.
                  </p>
                  <h4 className="text-base font-bold text-on-surface pt-2">1. Objet du service</h4>
                  <p>
                    Komiya WhatsApp AI fournit une solution logicielle SaaS permettant d'automatiser les réponses commerciales sur WhatsApp grâce à des agents d'intelligence artificielle configurables.
                  </p>
                  <h4 className="text-base font-bold text-on-surface pt-2">2. Responsabilité de l'utilisateur</h4>
                  <p>
                    L'utilisateur s'engage à respecter les politiques d'utilisation de WhatsApp et à ne pas utiliser le service pour l'envoi de messages non sollicités (spam), de contenus frauduleux ou illégaux.
                  </p>
                  <h4 className="text-base font-bold text-on-surface pt-2">3. Disponibilité</h4>
                  <p>
                    Nous mettons en œuvre tous les moyens raisonnables pour garantir la disponibilité maximale du service. La continuité des flux dépend également du bon état de fonctionnement des réseaux partenaires.
                  </p>
                </>
              )}
            </div>

            <div className="pt-6 mt-6 border-t border-outline-variant/20 text-right">
              <button
                onClick={() => setLegalModal(null)}
                className="px-6 py-2.5 rounded-xl bg-primary-container text-on-primary-container font-bold text-sm hover:bg-primary hover:text-on-primary transition-colors shadow-xs"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
