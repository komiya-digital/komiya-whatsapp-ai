import React, { useState, useEffect } from 'react';
import { Sparkles, Mail, Lock, User, Building, ArrowRight, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

export default function Auth({ initialMode = 'login', onNavigate }) {
  const { signIn, signUp, forgotPassword, resetPassword } = useAuth();

  const [mode, setMode] = useState(initialMode); // 'login', 'register', 'forgot', 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    setErrorMessage('');
    setSuccessMessage('');
  }, [initialMode]);

  const switchMode = (newMode) => {
    setMode(newMode);
    setErrorMessage('');
    setSuccessMessage('');
    if (onNavigate) {
      if (newMode === 'login') onNavigate('login');
      else if (newMode === 'register') onNavigate('register');
      else if (newMode === 'forgot') onNavigate('forgot-password');
      else if (newMode === 'reset') onNavigate('reset-password');
    }
  };

  const validate = () => {
    setErrorMessage('');

    if (mode === 'login') {
      if (!email.trim() || !password) {
        setErrorMessage('Veuillez renseigner votre email et mot de passe.');
        return false;
      }
    }

    if (mode === 'register') {
      if (!fullName.trim()) {
        setErrorMessage('Veuillez indiquer votre prénom ou nom complet.');
        return false;
      }
      if (!email.trim()) {
        setErrorMessage('Veuillez indiquer une adresse email valide.');
        return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setErrorMessage('Format d\'adresse email invalide.');
        return false;
      }
      if (!password || password.length < 6) {
        setErrorMessage('Le mot de passe doit comporter au moins 6 caractères.');
        return false;
      }
      if (password !== confirmPassword) {
        setErrorMessage('La confirmation du mot de passe ne correspond pas.');
        return false;
      }
    }

    if (mode === 'forgot') {
      if (!email.trim()) {
        setErrorMessage('Veuillez indiquer votre adresse email.');
        return false;
      }
    }

    if (mode === 'reset') {
      if (!password || password.length < 6) {
        setErrorMessage('Le mot de passe doit comporter au moins 6 caractères.');
        return false;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Les deux mots de passe ne correspondent pas.');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (mode === 'login') {
        await signIn(email.trim(), password);
        if (onNavigate) onNavigate('dashboard');
      } else if (mode === 'register') {
        await signUp(email.trim(), password, fullName.trim(), companyName.trim() || `${fullName.trim()}'s Business`);
        if (onNavigate) onNavigate('dashboard');
      } else if (mode === 'forgot') {
        await forgotPassword(email.trim());
        setSuccessMessage(`Un lien de réinitialisation a été envoyé à ${email}. Vérifiez votre boîte de réception.`);
      } else if (mode === 'reset') {
        await resetPassword(password);
        setSuccessMessage('Votre mot de passe a été mis à jour avec succès. Vous pouvez maintenant vous connecter.');
        setTimeout(() => switchMode('login'), 2000);
      }
    } catch (err) {
      console.error('Auth error:', err);
      let userFriendlyMsg = err.message || 'Une erreur est survenue lors de l\'authentification.';
      if (userFriendlyMsg.includes('Invalid login credentials')) {
        userFriendlyMsg = 'Identifiants incorrects. Vérifiez votre email et mot de passe.';
      } else if (userFriendlyMsg.includes('User already registered')) {
        userFriendlyMsg = 'Un compte existe déjà avec cette adresse email.';
      } else if (userFriendlyMsg.includes('Password should be at least')) {
        userFriendlyMsg = 'Le mot de passe doit comporter au moins 6 caractères.';
      }
      setErrorMessage(userFriendlyMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background ambient halos */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Card */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-emerald-400 shadow-xl shadow-emerald-500/20 mb-4">
            <Sparkles className="w-7 h-7 text-slate-950 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center justify-center space-x-2">
            <span>Komiya WhatsApp AI</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1.5 font-medium">
            Plateforme SaaS de commercialisation WhatsApp 24h/24
          </p>
        </div>

        {/* Tab switcher for Login / Register */}
        {(mode === 'login' || mode === 'register') && (
          <div className="flex bg-slate-800/60 p-1 rounded-xl mb-6 border border-slate-700/50">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'login' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Connexion
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                mode === 'register' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              Créer un compte
            </button>
          </div>
        )}

        {/* Error notification */}
        {errorMessage && (
          <div className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start space-x-2 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Success notification */}
        {successMessage && (
          <div className="mb-4 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start space-x-2 text-emerald-300 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
            <span className="leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* Forms */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Prénom & Nom complet <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Ex: Jean-Marc Kouassi"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Nom de votre entreprise <span className="text-slate-500">(optionnel)</span>
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Ex: Mon Entreprise"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </>
          )}

          {mode !== 'reset' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Adresse email professionnelle <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@entreprise.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {mode !== 'forgot' && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  {mode === 'reset' ? 'Nouveau mot de passe' : 'Mot de passe'} <span className="text-rose-400">*</span>
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="text-[11px] text-emerald-400 hover:underline font-medium"
                  >
                    Mot de passe oublié ?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Au moins 6 caractères"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {(mode === 'register' || mode === 'reset') && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Confirmer le mot de passe <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Répétez le mot de passe identique"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>
                  {mode === 'login' && 'Se connecter'}
                  {mode === 'register' && 'Créer mon compte SaaS'}
                  {mode === 'forgot' && 'Envoyer le lien de réinitialisation'}
                  {mode === 'reset' && 'Changer mon mot de passe'}
                </span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>

          {(mode === 'forgot' || mode === 'reset') && (
            <button
              type="button"
              onClick={() => switchMode('login')}
              className="w-full text-center text-xs text-slate-400 hover:text-white pt-2 font-medium"
            >
              ← Retour à la connexion
            </button>
          )}
        </form>

        <div className="mt-8 pt-4 border-t border-slate-800 text-center">
          <p className="text-[11px] text-slate-500 font-medium">
            Komiya WhatsApp AI Platform • Authentification Sécurisée Supabase
          </p>
        </div>
      </div>
    </div>
  );
}
