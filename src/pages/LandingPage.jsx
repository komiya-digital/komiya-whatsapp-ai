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
  Lock
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
    <div className="min-h-screen bg-white text-[#17211F] font-sans antialiased selection:bg-[#00C896]/20 selection:text-[#006C4F]">
      
      {/* ========================================================= */}
      {/* 2. NAVIGATION                                             */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-[#E2EBE7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Logo Brand */}
          <div 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#00C896] to-[#009E75] flex items-center justify-center text-white shadow-sm shadow-[#00C896]/30 transition-transform group-hover:scale-105">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12c0 1.95.56 3.77 1.53 5.33L2.5 21.5l4.31-1.01A9.94 9.94 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 17.5c-1.57 0-3.04-.47-4.28-1.28l-.31-.2-2.55.6.61-2.48-.2-.33A7.44 7.44 0 0 1 4.5 12c0-4.14 3.36-7.5 7.5-7.5s7.5 3.36 7.5 7.5-3.36 7.5-7.5 7.5z"/>
                <circle cx="9.5" cy="11.5" r="1.2"/>
                <circle cx="14.5" cy="11.5" r="1.2"/>
                <path d="M9.5 14.5c1 .8 4 .8 5 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold tracking-tight text-[#17211F] leading-none">
                Komiya
              </span>
              <span className="text-[11px] font-semibold text-[#00C896] tracking-wider uppercase mt-0.5">
                WhatsApp AI
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <button 
              onClick={() => scrollToSection('features')}
              className="text-sm font-medium text-[#66736F] hover:text-[#17211F] transition-colors"
            >
              Fonctionnalités
            </button>
            <button 
              onClick={() => scrollToSection('how-it-works')}
              className="text-sm font-medium text-[#66736F] hover:text-[#17211F] transition-colors"
            >
              Comment ça marche
            </button>
            <button 
              onClick={() => scrollToSection('faq')}
              className="text-sm font-medium text-[#66736F] hover:text-[#17211F] transition-colors"
            >
              FAQ
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <button
                onClick={() => onNavigate && onNavigate('dashboard')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00C896] text-[#17211F] font-bold text-sm hover:bg-[#00B285] transition-all shadow-sm hover:shadow"
              >
                <span>Mon Espace Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={handleLoginClick}
                  className="text-sm font-semibold text-[#17211F] hover:text-[#00C896] px-3 py-2 transition-colors"
                >
                  Connexion
                </button>
                <button
                  onClick={handleRegisterClick}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00C896] text-[#17211F] font-bold text-sm hover:bg-[#00B285] transition-all shadow-sm hover:shadow hover:scale-[1.02]"
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
              className="p-2 rounded-lg text-[#17211F] hover:bg-[#F7FAF9] transition-colors"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-[#E2EBE7] bg-white px-4 pt-2 pb-6 space-y-3 shadow-lg animate-in slide-in-from-top-2">
            <button
              onClick={() => scrollToSection('features')}
              className="block w-full text-left py-2.5 text-base font-medium text-[#17211F] hover:text-[#00C896]"
            >
              Fonctionnalités
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="block w-full text-left py-2.5 text-base font-medium text-[#17211F] hover:text-[#00C896]"
            >
              Comment ça marche
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="block w-full text-left py-2.5 text-base font-medium text-[#17211F] hover:text-[#00C896]"
            >
              FAQ
            </button>
            
            <div className="pt-4 border-t border-[#E2EBE7] flex flex-col gap-3">
              {isAuthenticated ? (
                <button
                  onClick={() => onNavigate && onNavigate('dashboard')}
                  className="w-full text-center py-3 rounded-xl bg-[#00C896] text-[#17211F] font-bold text-sm"
                >
                  Accéder au Dashboard →
                </button>
              ) : (
                <>
                  <button
                    onClick={handleLoginClick}
                    className="w-full text-center py-2.5 rounded-xl border border-[#E2EBE7] text-[#17211F] font-semibold text-sm hover:bg-[#F7FAF9]"
                  >
                    Connexion
                  </button>
                  <button
                    onClick={handleRegisterClick}
                    className="w-full text-center py-3 rounded-xl bg-[#00C896] text-[#17211F] font-bold text-sm hover:bg-[#00B285]"
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
      {/* 3. HERO SECTION                                           */}
      {/* ========================================================= */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        {/* Soft background ambient gradient */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-[#A7E7A0]/15 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-[#00C896]/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Column: Text & CTAs */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E6F9F3] border border-[#A7E7A0]/40 text-[#006C4F] text-xs font-semibold mb-6">
                <span className="w-2 h-2 rounded-full bg-[#00C896] animate-pulse" />
                <span>Votre commercial IA sur WhatsApp</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#17211F] tracking-tight leading-[1.12] mb-6">
                Vendez sur WhatsApp.<br />
                <span className="text-[#00C896]">Même quand vous dormez.</span>
              </h1>

              {/* Description */}
              <p className="text-lg sm:text-xl text-[#66736F] leading-relaxed mb-8 max-w-2xl font-normal">
                Automatisez vos réponses, qualifiez vos prospects et ne laissez plus vos clients sans réponse. Votre assistant IA travaille pour votre business, 24h/24.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto mb-8">
                <button
                  onClick={handleRegisterClick}
                  className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-[#00C896] text-[#17211F] font-extrabold text-base hover:bg-[#00B285] transition-all shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Commencer gratuitement →</span>
                </button>
                <button
                  onClick={() => scrollToSection('how-it-works')}
                  className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-white border border-[#E2EBE7] text-[#17211F] font-semibold text-base hover:bg-[#F7FAF9] transition-all"
                >
                  <span>Découvrir comment ça marche</span>
                </button>
              </div>

              {/* Reassurance text */}
              <div className="flex items-center gap-2 text-xs sm:text-sm text-[#66736F] font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#00C896] shrink-0" />
                <span>Simple à configurer · Disponible 24h/24 · Pensé pour les entrepreneurs africains</span>
              </div>
            </div>

            {/* Right Column: Realistic Product UI Mockup */}
            <div className="lg:col-span-5 relative">
              
              {/* Product preview card simulating WhatsApp chat */}
              <div className="relative mx-auto max-w-md w-full bg-white rounded-3xl border border-[#E2EBE7] shadow-xl shadow-slate-200/50 overflow-hidden">
                
                {/* Chat Header */}
                <div className="bg-[#075E54] px-4 py-3.5 flex items-center justify-between text-white">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-[#00C896] flex items-center justify-center text-slate-900 font-bold text-sm shadow-inner">
                        <Bot className="w-5 h-5 text-[#17211F]" />
                      </div>
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#A7E7A0] border-2 border-[#075E54]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold leading-tight">Assistant IA Komiya</h4>
                      <p className="text-[11px] text-[#A7E7A0] flex items-center gap-1 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#A7E7A0]" />
                        En ligne 24h/24
                      </p>
                    </div>
                  </div>
                  <div className="px-2 py-1 rounded bg-white/10 text-[10px] font-semibold uppercase tracking-wider text-emerald-100">
                    SaaS Actif
                  </div>
                </div>

                {/* Chat Messages Body */}
                <div className="p-4 bg-[#EFEAE2] space-y-3.5 text-xs font-normal min-h-[340px] flex flex-col justify-end">
                  
                  {/* Date badge */}
                  <div className="text-center my-1">
                    <span className="bg-white/80 backdrop-blur-xs text-[10px] font-medium text-slate-500 px-2.5 py-0.5 rounded-md shadow-xs">
                      Aujourd'hui
                    </span>
                  </div>

                  {/* Customer Message */}
                  <div className="flex flex-col items-start max-w-[85%] self-start">
                    <div className="bg-white text-[#17211F] rounded-2xl rounded-tl-xs p-3 shadow-sm border border-slate-200/40">
                      <p className="leading-relaxed">
                        Bonjour ! Je suis intéressée par le Sérum Éclat 50ml. Quel est le prix svp et est-ce disponible à Abidjan ?
                      </p>
                      <span className="block text-[10px] text-slate-400 text-right mt-1">
                        14:02
                      </span>
                    </div>
                  </div>

                  {/* AI Assistant Message */}
                  <div className="flex flex-col items-end max-w-[88%] self-end">
                    <div className="bg-[#DCF8C6] text-[#17211F] rounded-2xl rounded-tr-xs p-3 shadow-sm border border-[#C5E8AF]">
                      <div className="flex items-center gap-1 text-[10px] text-[#006C4F] font-bold mb-1">
                        <Sparkles className="w-3 h-3 text-[#00C896]" />
                        <span>Réponse automatique IA</span>
                      </div>
                      <p className="leading-relaxed">
                        Bonjour Aminata ! 😊 Oui, le Sérum Éclat 50ml est bien disponible en stock au prix de <strong>15 000 FCFA</strong>. Nous livrons partout à Abidjan sous 24h (1 500 FCFA).
                      </p>
                      <p className="mt-1.5 leading-relaxed font-medium text-slate-800">
                        Souhaitez-vous que je valide votre commande pour une livraison aujourd'hui ?
                      </p>
                      <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-500">
                        <span>14:02</span>
                        <Check className="w-3.5 h-3.5 text-[#34B7F1]" />
                      </div>
                    </div>
                  </div>

                  {/* Customer follow-up */}
                  <div className="flex flex-col items-start max-w-[80%] self-start">
                    <div className="bg-white text-[#17211F] rounded-2xl rounded-tl-xs p-2.5 shadow-sm border border-slate-200/40">
                      <p className="leading-relaxed">
                        Oui super, je prends un flacon ! Livraison à Cocody Angré.
                      </p>
                      <span className="block text-[10px] text-slate-400 text-right mt-0.5">
                        14:03
                      </span>
                    </div>
                  </div>

                </div>

                {/* Input simulation bar */}
                <div className="p-2.5 bg-[#F0F2F5] border-t border-slate-200 flex items-center gap-2">
                  <div className="flex-1 bg-white rounded-full px-3.5 py-1.5 text-[11px] text-slate-400 border border-slate-200">
                    L'IA gère la conversation...
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#00C896] flex items-center justify-center text-slate-900 shadow-sm">
                    <Bot className="w-4 h-4 text-[#17211F]" />
                  </div>
                </div>

              </div>

              {/* Floating Badge 1: Prospect Qualifié */}
              <div className="absolute -top-4 -right-2 sm:-right-4 bg-white rounded-2xl p-3 shadow-lg border border-[#E2EBE7] flex items-center gap-3 animate-in fade-in zoom-in-95">
                <div className="w-9 h-9 rounded-xl bg-[#E6F9F3] text-[#00C896] flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5 text-[#00C896]" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#17211F]">Prospect qualifié</span>
                    <span className="px-1.5 py-0.2 bg-[#E6F9F3] text-[#006C4F] rounded text-[10px] font-bold">Chaud</span>
                  </div>
                  <p className="text-[11px] text-[#66736F]">Intérêt Sérum Éclat · 15 000 FCFA</p>
                </div>
              </div>

              {/* Floating Badge 2: Stats IA */}
              <div className="absolute -bottom-4 -left-2 sm:-left-4 bg-white rounded-2xl p-3 shadow-lg border border-[#E2EBE7] flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#F7FAF9] border border-[#E2EBE7] text-[#00C896] flex items-center justify-center">
                  <Clock className="w-5 h-5 text-[#00C896]" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#17211F]">Temps de réponse &lt; 3s</div>
                  <p className="text-[11px] text-[#66736F]">Disponibilité : 24h/24 · 7j/7</p>
                </div>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. SECTION PROBLÈME                                       */}
      {/* ========================================================= */}
      <section className="py-20 bg-[#F7FAF9] border-y border-[#E2EBE7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#17211F] tracking-tight leading-tight">
              Combien de clients perdez-vous lorsque vous êtes indisponible ?
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[#66736F]">
              Sur WhatsApp, la rapidité est le facteur décisif pour conclure une vente. Chaque minute de silence réduit considérablement l'intérêt de votre acheteur.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            
            {/* Card 1 */}
            <div className="bg-white rounded-2xl p-8 border border-[#E2EBE7] shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center mb-6">
                <Clock className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h3 className="text-xl font-bold text-[#17211F] mb-3">
                Des messages sans réponse
              </h3>
              <p className="text-sm sm:text-base text-[#66736F] leading-relaxed">
                Vos clients attendent. Certains finissent par acheter ailleurs.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-2xl p-8 border border-[#E2EBE7] shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center mb-6">
                <Inbox className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h3 className="text-xl font-bold text-[#17211F] mb-3">
                Des prospects difficiles à suivre
              </h3>
              <p className="text-sm sm:text-base text-[#66736F] leading-relaxed">
                Les conversations s'accumulent et les opportunités se perdent.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-2xl p-8 border border-[#E2EBE7] shadow-xs hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#00C896] flex items-center justify-center mb-6">
                <HelpCircle className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h3 className="text-xl font-bold text-[#17211F] mb-3">
                Du temps consacré aux mêmes questions
              </h3>
              <p className="text-sm sm:text-base text-[#66736F] leading-relaxed">
                Prix, produits, disponibilité : vous répétez souvent les mêmes réponses.
              </p>
            </div>

          </div>

          {/* Conclusion Statement */}
          <div className="max-w-2xl mx-auto text-center p-6 rounded-2xl bg-white border border-[#E2EBE7] shadow-xs">
            <p className="text-base sm:text-lg font-semibold text-[#17211F]">
              « Komiya automatise les échanges répétitifs pour vous permettre de vous concentrer sur votre activité. »
            </p>
          </div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. SECTION FONCTIONNALITÉS                                */}
      {/* ========================================================= */}
      <section id="features" className="py-24 bg-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-[#00C896] uppercase tracking-wider mb-2 block">
              Fonctionnalités Clés
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#17211F] tracking-tight">
              Votre assistant commercial, toujours disponible.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[#66736F]">
              Des outils intelligents conçus pour convertir vos conversations WhatsApp en ventes réelles, sans friction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Feature 1 */}
            <div className="p-8 rounded-3xl bg-[#F7FAF9] border border-[#E2EBE7] hover:border-[#00C896]/40 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-white border border-[#E2EBE7] text-[#00C896] flex items-center justify-center mb-6 shadow-xs group-hover:scale-105 transition-transform">
                <Bot className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h3 className="text-xl font-bold text-[#17211F] mb-3">
                Réponses automatiques par IA
              </h3>
              <p className="text-base text-[#66736F] leading-relaxed">
                Répondez rapidement aux questions de vos clients, même en dehors de vos horaires.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-3xl bg-[#F7FAF9] border border-[#E2EBE7] hover:border-[#00C896]/40 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-white border border-[#E2EBE7] text-[#00C896] flex items-center justify-center mb-6 shadow-xs group-hover:scale-105 transition-transform">
                <Users className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h3 className="text-xl font-bold text-[#17211F] mb-3">
                Qualification des prospects
              </h3>
              <p className="text-base text-[#66736F] leading-relaxed">
                Identifiez les besoins, les produits recherchés et les prospects les plus intéressés.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-3xl bg-[#F7FAF9] border border-[#E2EBE7] hover:border-[#00C896]/40 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-white border border-[#E2EBE7] text-[#00C896] flex items-center justify-center mb-6 shadow-xs group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h3 className="text-xl font-bold text-[#17211F] mb-3">
                Présentation de vos produits
              </h3>
              <p className="text-base text-[#66736F] leading-relaxed">
                Donnez à votre assistant les informations sur votre catalogue, vos prix et vos offres.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-8 rounded-3xl bg-[#F7FAF9] border border-[#E2EBE7] hover:border-[#00C896]/40 transition-all group">
              <div className="w-12 h-12 rounded-2xl bg-white border border-[#E2EBE7] text-[#00C896] flex items-center justify-center mb-6 shadow-xs group-hover:scale-105 transition-transform">
                <Sliders className="w-6 h-6 stroke-[2.2]" />
              </div>
              <h3 className="text-xl font-bold text-[#17211F] mb-3">
                Suivi des conversations
              </h3>
              <p className="text-base text-[#66736F] leading-relaxed">
                Retrouvez vos échanges, consultez vos prospects et reprenez la main à tout moment.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. SECTION COMMENT ÇA MARCHE                              */}
      {/* ========================================================= */}
      <section id="how-it-works" className="py-24 bg-[#F7FAF9] border-y border-[#E2EBE7] scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-[#00C896] uppercase tracking-wider mb-2 block">
              Mise en route
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#17211F] tracking-tight">
              Prêt en quelques étapes.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[#66736F]">
              Une configuration simple et directe, pensée pour être prête en quelques minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            
            {/* Step 1 */}
            <div className="relative bg-white rounded-3xl p-8 border border-[#E2EBE7] shadow-xs">
              <div className="text-4xl font-black text-[#A7E7A0] mb-4">
                01
              </div>
              <h3 className="text-xl font-bold text-[#17211F] mb-3">
                Connectez votre WhatsApp
              </h3>
              <p className="text-base text-[#66736F] leading-relaxed">
                Configurez votre connexion WhatsApp depuis votre espace.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative bg-white rounded-3xl p-8 border border-[#E2EBE7] shadow-xs">
              <div className="text-4xl font-black text-[#A7E7A0] mb-4">
                02
              </div>
              <h3 className="text-xl font-bold text-[#17211F] mb-3">
                Configurez votre assistant IA
              </h3>
              <p className="text-base text-[#66736F] leading-relaxed">
                Présentez votre activité, vos produits et votre manière de répondre aux clients.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative bg-white rounded-3xl p-8 border border-[#E2EBE7] shadow-xs">
              <div className="text-4xl font-black text-[#00C896] mb-4">
                03
              </div>
              <h3 className="text-xl font-bold text-[#17211F] mb-3">
                Laissez l'IA vous assister
              </h3>
              <p className="text-base text-[#66736F] leading-relaxed">
                Votre assistant répond aux questions et qualifie les prospects selon vos paramètres.
              </p>
            </div>

          </div>

          {/* Action Button */}
          <div className="text-center">
            <button
              onClick={handleRegisterClick}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#00C896] text-[#17211F] font-extrabold text-base hover:bg-[#00B285] transition-all shadow-sm hover:shadow hover:scale-[1.02]"
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
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold text-[#00C896] uppercase tracking-wider mb-2 block">
              Pour qui ?
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#17211F] tracking-tight">
              Conçu pour les entrepreneurs qui vendent sur WhatsApp.
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[#66736F]">
              Komiya s'intègre parfaitement aux besoins quotidiens de ceux qui font du commerce via messagerie.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
            
            <div className="p-6 rounded-2xl bg-[#F7FAF9] border border-[#E2EBE7] text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-white border border-[#E2EBE7] text-[#00C896] flex items-center justify-center mb-4 shadow-xs">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-[#17211F] text-base mb-1">Boutiques en ligne</h4>
              <p className="text-xs text-[#66736F]">Mode, beauté, accessoires, tech et produits physiques.</p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F7FAF9] border border-[#E2EBE7] text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-white border border-[#E2EBE7] text-[#00C896] flex items-center justify-center mb-4 shadow-xs">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-[#17211F] text-base mb-1">Produits digitaux & formations</h4>
              <p className="text-xs text-[#66736F]">Ebooks, programmes, cours, coaching et webinaires.</p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F7FAF9] border border-[#E2EBE7] text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-white border border-[#E2EBE7] text-[#00C896] flex items-center justify-center mb-4 shadow-xs">
                <Store className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-[#17211F] text-base mb-1">Commerçants</h4>
              <p className="text-xs text-[#66736F]">Points de vente, grossistes, distributeurs et détaillants.</p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F7FAF9] border border-[#E2EBE7] text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-white border border-[#E2EBE7] text-[#00C896] flex items-center justify-center mb-4 shadow-xs">
                <Briefcase className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-[#17211F] text-base mb-1">Prestataires de services</h4>
              <p className="text-xs text-[#66736F]">Agences, freelances, consultants, salons et instituts.</p>
            </div>

            <div className="p-6 rounded-2xl bg-[#F7FAF9] border border-[#E2EBE7] text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-white border border-[#E2EBE7] text-[#00C896] flex items-center justify-center mb-4 shadow-xs">
                <Layers className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-[#17211F] text-base mb-1">Petites entreprises</h4>
              <p className="text-xs text-[#66736F]">PME, artisans et producteurs locaux en développement.</p>
            </div>

          </div>

          <div className="text-center">
            <p className="text-base sm:text-lg font-semibold text-[#17211F]">
              « Quel que soit votre secteur, votre assistant s'adapte aux informations de votre entreprise. »
            </p>
          </div>

        </div>
      </section>

      {/* ========================================================= */}
      {/* 8. SECTION FAQ                                            */}
      {/* ========================================================= */}
      <section id="faq" className="py-24 bg-[#F7FAF9] border-t border-[#E2EBE7] scroll-mt-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-16">
            <span className="text-xs font-bold text-[#00C896] uppercase tracking-wider mb-2 block">
              FAQ
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#17211F] tracking-tight">
              Questions fréquentes
            </h2>
            <p className="mt-4 text-base text-[#66736F]">
              Tout ce que vous devez savoir pour démarrer en toute sérénité.
            </p>
          </div>

          <div className="space-y-4">
            {faqItems.map((item, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div 
                  key={index}
                  className="bg-white rounded-2xl border border-[#E2EBE7] overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 font-bold text-[#17211F] text-base sm:text-lg hover:text-[#00C896] transition-colors"
                  >
                    <span>{item.q}</span>
                    <ChevronDown className={`w-5 h-5 text-[#66736F] shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#00C896]' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 pt-1 text-[#66736F] text-base leading-relaxed border-t border-slate-50">
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
      {/* 9. CTA FINAL                                              */}
      {/* ========================================================= */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="rounded-3xl bg-[#E6F9F3] border border-[#A7E7A0]/50 p-10 sm:p-14 text-center relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#00C896]/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#A7E7A0]/20 rounded-full blur-2xl pointer-events-none" />

            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#17211F] tracking-tight mb-4 relative z-10">
              Et si votre prochain client recevait une réponse immédiatement ?
            </h2>
            <p className="text-base sm:text-lg text-[#66736F] max-w-2xl mx-auto mb-8 relative z-10">
              Passez moins de temps à répondre aux mêmes questions et concentrez-vous sur le développement de votre business.
            </p>
            <div className="relative z-10">
              <button
                onClick={handleRegisterClick}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#00C896] text-[#17211F] font-extrabold text-base hover:bg-[#00B285] transition-all shadow-sm hover:shadow hover:scale-[1.02]"
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
      <footer className="bg-white border-t border-[#E2EBE7] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 pb-8 border-b border-[#E2EBE7]">
            
            {/* Logo */}
            <div 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#00C896] to-[#009E75] flex items-center justify-center text-white shadow-xs">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12c0 1.95.56 3.77 1.53 5.33L2.5 21.5l4.31-1.01A9.94 9.94 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 17.5c-1.57 0-3.04-.47-4.28-1.28l-.31-.2-2.55.6.61-2.48-.2-.33A7.44 7.44 0 0 1 4.5 12c0-4.14 3.36-7.5 7.5-7.5s7.5 3.36 7.5 7.5-3.36 7.5-7.5 7.5z"/>
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-extrabold tracking-tight text-[#17211F]">
                  Komiya WhatsApp AI
                </span>
                <span className="text-[11px] text-[#66736F]">
                  Commercial IA 24h/24 pour entrepreneurs africains
                </span>
              </div>
            </div>

            {/* Links */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-medium text-[#66736F]">
              <button 
                onClick={() => scrollToSection('features')}
                className="hover:text-[#17211F] transition-colors"
              >
                Fonctionnalités
              </button>
              <button 
                onClick={handleLoginClick}
                className="hover:text-[#17211F] transition-colors"
              >
                Connexion
              </button>
              <button 
                onClick={handleRegisterClick}
                className="hover:text-[#17211F] transition-colors"
              >
                Inscription
              </button>
              <button 
                onClick={() => setLegalModal('privacy')}
                className="hover:text-[#17211F] transition-colors"
              >
                Politique de confidentialité
              </button>
              <button 
                onClick={() => setLegalModal('terms')}
                className="hover:text-[#17211F] transition-colors"
              >
                Conditions d'utilisation
              </button>
            </div>

          </div>

          <div className="pt-8 text-center md:text-left flex flex-col md:flex-row items-center justify-between text-xs text-[#66736F] gap-4">
            <p>
              © {new Date().getFullYear()} Komiya WhatsApp AI. Tous droits réservés.
            </p>
            <p className="text-slate-400">
              Conçu avec rigueur et simplicité pour le commerce conversationnel en Afrique.
            </p>
          </div>

        </div>
      </footer>

      {/* ========================================================= */}
      {/* LEGAL MODALS (Zero 404s, Real Legal Content)               */}
      {/* ========================================================= */}
      {legalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-[#E2EBE7]">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2EBE7] mb-6">
              <h3 className="text-xl font-bold text-[#17211F]">
                {legalModal === 'privacy' ? 'Politique de confidentialité' : 'Conditions d\'utilisation'}
              </h3>
              <button
                onClick={() => setLegalModal(null)}
                className="p-1.5 rounded-lg text-[#66736F] hover:text-[#17211F] hover:bg-[#F7FAF9] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-sm text-[#66736F] leading-relaxed space-y-4">
              {legalModal === 'privacy' ? (
                <>
                  <p>
                    Chez <strong>Komiya WhatsApp AI</strong>, la protection de vos données et de celles de vos clients est une priorité absolue.
                  </p>
                  <h4 className="text-base font-bold text-[#17211F] pt-2">1. Données collectées</h4>
                  <p>
                    Nous collectons uniquement les informations indispensables au bon fonctionnement de votre assistant : nom de votre entreprise, catalogue de produits et coordonnées de contact.
                  </p>
                  <h4 className="text-base font-bold text-[#17211F] pt-2">2. Confidentialité des conversations</h4>
                  <p>
                    Les conversations traitées par votre assistant IA restent strictement isolées au sein de votre compte utilisateur. Vos données ne sont ni revendues, ni partagées à des tiers à des fins publicitaires.
                  </p>
                  <h4 className="text-base font-bold text-[#17211F] pt-2">3. Sécurité</h4>
                  <p>
                    Toutes les connexions et échanges avec nos serveurs et la base de données Supabase sont sécurisés et chiffrés selon les normes industrielles en vigueur (TLS/SSL).
                  </p>
                </>
              ) : (
                <>
                  <p>
                    En utilisant le service <strong>Komiya WhatsApp AI</strong>, vous acceptez les conditions générales suivantes régissant l'utilisation de la plateforme.
                  </p>
                  <h4 className="text-base font-bold text-[#17211F] pt-2">1. Objet du service</h4>
                  <p>
                    Komiya WhatsApp AI fournit une solution logicielle SaaS permettant d'automatiser les réponses commerciales sur WhatsApp grâce à des agents d'intelligence artificielle configurables.
                  </p>
                  <h4 className="text-base font-bold text-[#17211F] pt-2">2. Responsabilité de l'utilisateur</h4>
                  <p>
                    L'utilisateur s'engage à respecter les politiques d'utilisation de WhatsApp et à ne pas utiliser le service pour l'envoi de messages non sollicités (spam), de contenus frauduleux ou illégaux.
                  </p>
                  <h4 className="text-base font-bold text-[#17211F] pt-2">3. Disponibilité</h4>
                  <p>
                    Nous mettons en œuvre tous les moyens raisonnables pour garantir la disponibilité maximale du service. La continuité des flux dépend également du bon état de fonctionnement des réseaux partenaires.
                  </p>
                </>
              )}
            </div>

            <div className="pt-6 mt-6 border-t border-[#E2EBE7] text-right">
              <button
                onClick={() => setLegalModal(null)}
                className="px-6 py-2.5 rounded-xl bg-[#00C896] text-[#17211F] font-bold text-sm hover:bg-[#00B285] transition-colors"
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
