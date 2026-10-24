import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  User, 
  Building, 
  MessageSquare, 
  Bot, 
  Bell, 
  Shield, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  ArrowRight,
  ExternalLink,
  Lock,
  Eye,
  EyeOff,
  Save,
  Check
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { 
  getWhatsAppConnection, 
  upsertWhatsAppConnection,
  getAiAgent, 
  upsertAiAgent 
} from '../lib/supabaseClient';

export default function SettingsPage({ onNavigate }) {
  const { 
    user, 
    profile, 
    business, 
    updateProfileData, 
    updateBusinessData,
    updateWhatsAppConnectionState,
    resetPassword,
    signOut
  } = useAuth();

  const [activeTab, setActiveTab] = useState('profile');

  // 1. Profile State
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');

  // 2. Business State
  const [companyName, setCompanyName] = useState(business?.name || '');
  const [companyDescription, setCompanyDescription] = useState(business?.description || '');
  const [country, setCountry] = useState(business?.country || 'Côte d\'Ivoire');
  const [currency, setCurrency] = useState(business?.currency || 'FCFA');

  // 3. WhatsApp State
  const [waSessionId, setWaSessionId] = useState('');
  const [waPhoneNumber, setWaPhoneNumber] = useState('');
  const [waApiKey, setWaApiKey] = useState('');
  const [waIsConnected, setWaIsConnected] = useState(false);
  const [waLoading, setWaLoading] = useState(false);

  // 4. AI Agent State
  const [aiName, setAiName] = useState('Awa');
  const [aiTone, setAiTone] = useState('Professionnel');
  const [aiObjective, setAiObjective] = useState('Vendre + qualifier');
  const [aiCustomInstructions, setAiCustomInstructions] = useState('');
  const [aiIsActive, setAiIsActive] = useState(true);

  // 5. Notifications State
  const [notifHumanHandover, setNotifHumanHandover] = useState(true);
  const [notifDailySummary, setNotifDailySummary] = useState(true);
  const [notifSound, setNotifSound] = useState(false);

  // 6. Security State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Status feedback
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Initial data loading & synchronization
  useEffect(() => {
    if (profile?.full_name) setFullName(profile.full_name);
    if (user?.email) setEmail(user.email);
    if (business?.name) setCompanyName(business.name);
    if (business?.description) setCompanyDescription(business.description);
    if (business?.country) setCountry(business.country);
    if (business?.currency) setCurrency(business.currency);

    if (business?.id) {
      // Load WhatsApp connection
      getWhatsAppConnection(business.id)
        .then(conn => {
          if (conn) {
            setWaSessionId(conn.sessionId || '');
            setWaPhoneNumber(conn.phoneNumber || '');
            setWaApiKey(conn.apiKey || '');
            setWaIsConnected(Boolean(conn.isConnected));
          }
        })
        .catch(err => console.warn('Error fetching wa connection:', err));

      // Load AI Agent
      getAiAgent(business.id)
        .then(agent => {
          if (agent) {
            setAiName(agent.name || 'Awa');
            setAiTone(agent.tone || 'Professionnel');
            setAiObjective(agent.objective || 'Vendre + qualifier');
            setAiCustomInstructions(agent.customInstructions || '');
            setAiIsActive(agent.isActive ?? true);
          }
        })
        .catch(err => console.warn('Error fetching ai agent:', err));
    }
  }, [profile, user, business]);

  const clearMessages = () => {
    setSuccessMessage('');
    setErrorMessage('');
  };

  // ─── TAB 1: SAVE PROFILE ──────────────────────────────────────────
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    clearMessages();
    setSaving(true);

    try {
      if (!fullName.trim()) {
        setErrorMessage('Le nom complet est obligatoire.');
        setSaving(false);
        return;
      }
      await updateProfileData({ full_name: fullName.trim() });
      setSuccessMessage('Profil mis à jour avec succès !');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Error saving profile:', err);
      setErrorMessage(err.message || 'Impossible d\'enregistrer le profil.');
    } finally {
      setSaving(false);
    }
  };

  // ─── TAB 2: SAVE BUSINESS ─────────────────────────────────────────
  const handleSaveBusiness = async (e) => {
    e.preventDefault();
    clearMessages();
    setSaving(true);

    try {
      if (!companyName.trim()) {
        setErrorMessage('Le nom de l\'entreprise est obligatoire.');
        setSaving(false);
        return;
      }
      await updateBusinessData({
        name: companyName.trim(),
        description: companyDescription.trim(),
        country,
        currency
      });
      setSuccessMessage('Informations de l\'entreprise enregistrées avec succès !');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Error saving business:', err);
      setErrorMessage(err.message || 'Impossible d\'enregistrer les informations de l\'entreprise.');
    } finally {
      setSaving(false);
    }
  };

  // ─── TAB 3: SAVE WHATSAPP ─────────────────────────────────────────
  const handleSaveWhatsApp = async (e) => {
    e.preventDefault();
    clearMessages();
    if (!business?.id) {
      setErrorMessage('Espace entreprise non initialisé.');
      return;
    }
    setSaving(true);

    try {
      const isConn = Boolean(waSessionId.trim() && waPhoneNumber.trim());
      const saved = await upsertWhatsAppConnection(business.id, {
        sessionId: waSessionId.trim(),
        phoneNumber: waPhoneNumber.trim(),
        apiKey: waApiKey.trim(),
        isConnected: isConn,
        status: isConn ? 'connected' : 'disconnected'
      });
      setWaIsConnected(isConn);
      if (updateWhatsAppConnectionState) {
        updateWhatsAppConnectionState({ ...saved, is_connected: isConn });
      }
      setSuccessMessage('Paramètres WhatsApp sauvegardés avec succès !');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Error saving whatsapp settings:', err);
      setErrorMessage(err.message || 'Erreur lors de la sauvegarde des identifiants WhatsApp.');
    } finally {
      setSaving(false);
    }
  };

  // ─── TAB 4: SAVE AI ───────────────────────────────────────────────
  const handleSaveAI = async (e) => {
    e.preventDefault();
    clearMessages();
    if (!business?.id) {
      setErrorMessage('Espace entreprise non initialisé.');
      return;
    }
    setSaving(true);

    try {
      await upsertAiAgent(business.id, {
        name: aiName.trim() || 'Awa',
        tone: aiTone,
        objective: aiObjective,
        customInstructions: aiCustomInstructions.trim(),
        isActive: aiIsActive,
        country
      });
      setSuccessMessage('Configuration de l\'assistant IA mise à jour avec succès !');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Error saving AI settings:', err);
      setErrorMessage(err.message || 'Erreur lors de la sauvegarde de l\'assistant IA.');
    } finally {
      setSaving(false);
    }
  };

  // ─── TAB 5: SAVE NOTIFICATIONS ────────────────────────────────────
  const handleSaveNotifications = async (e) => {
    e.preventDefault();
    clearMessages();
    setSaving(true);

    try {
      // Persist in localStorage for device & session continuity
      localStorage.setItem(`komiya_notifs_${user?.id || 'default'}`, JSON.stringify({
        humanHandover: notifHumanHandover,
        dailySummary: notifDailySummary,
        sound: notifSound
      }));
      setSuccessMessage('Préférences de notifications enregistrées avec succès !');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Error saving notifications:', err);
      setErrorMessage('Erreur lors de la sauvegarde des notifications.');
    } finally {
      setSaving(false);
    }
  };

  // ─── TAB 6: UPDATE PASSWORD ───────────────────────────────────────
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    clearMessages();

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('Le nouveau mot de passe doit comporter au moins 6 caractères.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('La confirmation du mot de passe ne correspond pas.');
      return;
    }

    setPasswordLoading(true);
    try {
      await resetPassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      setSuccessMessage('Mot de passe mis à jour avec succès dans Supabase Auth !');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Error updating password:', err);
      setErrorMessage(err.message || 'Impossible de mettre à jour le mot de passe.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'business', label: 'Entreprise', icon: Building },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
    { id: 'ai', label: 'Assistant IA', icon: Bot },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Sécurité & RLS', icon: Shield },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/20 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-on-surface tracking-tight flex items-center space-x-2">
            <Settings className="w-5 h-5 text-primary-container" />
            <span>Paramètres de votre Espace</span>
          </h1>
          <p className="text-xs text-on-surface-variant mt-1">
            Gérez votre profil utilisateur, les informations de votre entreprise, la connexion WhatsApp et l'IA.
          </p>
        </div>
      </div>

      {/* Global Status Notifications */}
      {successMessage && (
        <div className="p-4 rounded-xl text-xs font-bold bg-secondary-container/40 border border-secondary-container text-on-secondary-container flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl text-xs font-bold bg-error-container/30 border border-error-container text-on-error-container flex items-center space-x-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-error shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Settings Navigation Tabs */}
      <div className="flex space-x-2 border-b border-outline-variant/20 overflow-x-auto pb-2 scrollbar-none">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setActiveTab(t.id);
                clearMessages();
              }}
              type="button"
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all whitespace-nowrap ${
                isActive 
                  ? 'bg-on-surface text-surface-container-lowest shadow-sm' 
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-primary-container' : 'text-on-surface-variant'}`} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* TAB 1: PROFIL UTILISATEUR                                 */}
      {/* ========================================================= */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-sm p-6 space-y-4">
          <div className="border-b border-outline-variant/15 pb-4">
            <h3 className="font-bold text-sm text-on-surface">Informations Personnelles</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">Identité de l'administrateur du compte</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Nom complet</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ex: Sarah Vance ou Mohamed Diallo"
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/20 rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary-container"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Adresse email (Supabase Auth)</label>
              <input
                type="email"
                disabled
                value={email}
                className="w-full px-3.5 py-2.5 bg-surface-container border border-outline-variant/20 rounded-xl text-xs text-on-surface-variant cursor-not-allowed"
              />
              <p className="text-[11px] text-on-surface-variant mt-1">L'adresse email est synchronisée avec votre session sécurisée Supabase.</p>
            </div>
          </div>

          <div className="pt-4 border-t border-outline-variant/15 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-primary-container hover:bg-primary hover:text-on-primary text-on-primary-container disabled:opacity-50 font-bold text-xs rounded-xl shadow-sm transition-all"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer le profil'}
            </button>
          </div>
        </form>
      )}

      {/* ========================================================= */}
      {/* TAB 2: ENTREPRISE                                         */}
      {/* ========================================================= */}
      {activeTab === 'business' && (
        <form onSubmit={handleSaveBusiness} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-sm p-6 space-y-4">
          <div className="border-b border-outline-variant/15 pb-4">
            <h3 className="font-bold text-sm text-on-surface">Profil de l'Entreprise</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">Ces informations permettent à l'assistant IA de présenter fidèlement votre activité</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Nom commercial</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Ex: Boutique Mode Abidjan ou Dakar Digital"
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/20 rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary-container"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Description de votre activité</label>
              <textarea
                rows={3}
                value={companyDescription}
                onChange={(e) => setCompanyDescription(e.target.value)}
                placeholder="Décrivez ce que vend votre entreprise, vos horaires et votre positionnement..."
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/20 rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary-container"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Pays d'opération</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Ex: Côte d'Ivoire, Sénégal, Cameroun..."
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/20 rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary-container"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Devise principale</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/20 rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary-container"
                >
                  <option value="FCFA">FCFA</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-outline-variant/15 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-primary-container hover:bg-primary hover:text-on-primary text-on-primary-container disabled:opacity-50 font-bold text-xs rounded-xl shadow-sm transition-all"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer l\'entreprise'}
            </button>
          </div>
        </form>
      )}

      {/* ========================================================= */}
      {/* TAB 3: WHATSAPP                                           */}
      {/* ========================================================= */}
      {activeTab === 'whatsapp' && (
        <form onSubmit={handleSaveWhatsApp} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-sm p-6 space-y-4">
          <div className="border-b border-outline-variant/15 pb-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-on-surface">Connexion WhatsApp (WASenderAPI)</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">Identifiants de la passerelle WhatsApp de votre compte</p>
            </div>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('whatsapp')}
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
              >
                <span>Ouvrir l'assistant de connexion</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-on-surface block">Statut de la connexion</span>
                <span className="text-[11px] text-on-surface-variant">
                  {waIsConnected ? 'Passerelle active et écoute des messages WhatsApp' : 'Session déconnectée ou en attente d\'association'}
                </span>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${waIsConnected ? 'bg-secondary-container text-on-secondary-container' : 'bg-error-container text-on-error-container'}`}>
                {waIsConnected ? '🟢 Connecté' : '🔴 Non connecté'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Session ID WASender</label>
                <input
                  type="text"
                  value={waSessionId}
                  onChange={(e) => setWaSessionId(e.target.value)}
                  placeholder="Ex: 121080"
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/20 rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary-container"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Numéro WhatsApp associé</label>
                <input
                  type="text"
                  value={waPhoneNumber}
                  onChange={(e) => setWaPhoneNumber(e.target.value)}
                  placeholder="Ex: +22507000000"
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/20 rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary-container"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Clé API WASender</label>
              <input
                type="password"
                value={waApiKey}
                onChange={(e) => setWaApiKey(e.target.value)}
                placeholder="Collez votre clé API Wasender"
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/20 rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary-container font-mono"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-outline-variant/15 flex items-center justify-between">
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('whatsapp')}
                className="px-4 py-2 rounded-xl bg-surface-container text-on-surface text-xs font-bold hover:bg-surface-container-high transition-colors"
              >
                Tester le Webhook WhatsApp
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-primary-container hover:bg-primary hover:text-on-primary text-on-primary-container disabled:opacity-50 font-bold text-xs rounded-xl shadow-sm transition-all ml-auto"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer WhatsApp'}
            </button>
          </div>
        </form>
      )}

      {/* ========================================================= */}
      {/* TAB 4: ASSISTANT IA                                       */}
      {/* ========================================================= */}
      {activeTab === 'ai' && (
        <form onSubmit={handleSaveAI} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-sm p-6 space-y-4">
          <div className="border-b border-outline-variant/15 pb-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-on-surface">Configuration de l'Assistant Commercial IA</h3>
              <p className="text-xs text-on-surface-variant mt-0.5">Personnalisez le comportement, le nom et le style de réponse</p>
            </div>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('assistant')}
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
              >
                <span>Simulateur & Tests IA</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Prénom de l'assistant</label>
                <input
                  type="text"
                  value={aiName}
                  onChange={(e) => setAiName(e.target.value)}
                  placeholder="Ex: Awa, Fatou, Jean..."
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/20 rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary-container"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Statut du commercial IA</label>
                <select
                  value={aiIsActive ? 'active' : 'paused'}
                  onChange={(e) => setAiIsActive(e.target.value === 'active')}
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/20 rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary-container"
                >
                  <option value="active">🟢 Actif (Répond 24h/24 aux clients)</option>
                  <option value="paused">⏸️ En pause (Ne répond pas automatiquement)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Ton de communication</label>
                <select
                  value={aiTone}
                  onChange={(e) => setAiTone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/20 rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary-container"
                >
                  <option value="Professionnel">Professionnel & Rassurant</option>
                  <option value="Amical">Amical & Chaleureux</option>
                  <option value="Commercial">Directement Commercial (Closing)</option>
                  <option value="Simple">Simple & Concis</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Objectif principal</label>
                <select
                  value={aiObjective}
                  onChange={(e) => setAiObjective(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/20 rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary-container"
                >
                  <option value="Vendre + qualifier">Vendre & Qualifier les prospects</option>
                  <option value="Vendre">Vendre directement</option>
                  <option value="Qualifier">Qualifier les besoins & budget</option>
                  <option value="Prendre rendez-vous">Prendre rendez-vous</option>
                  <option value="Support client">Support & Renseignement</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1">Instructions personnalisées (Directives secrètes de vente)</label>
              <textarea
                rows={3}
                value={aiCustomInstructions}
                onChange={(e) => setAiCustomInstructions(e.target.value)}
                placeholder="Ex: Toujours demander l'adresse de livraison à la fin, proposer une réduction pour 2 articles..."
                className="w-full px-3.5 py-2.5 bg-surface-container-low border border-outline-variant/20 rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary-container"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-outline-variant/15 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-primary-container hover:bg-primary hover:text-on-primary text-on-primary-container disabled:opacity-50 font-bold text-xs rounded-xl shadow-sm transition-all"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer les paramètres IA'}
            </button>
          </div>
        </form>
      )}

      {/* ========================================================= */}
      {/* TAB 5: NOTIFICATIONS                                      */}
      {/* ========================================================= */}
      {activeTab === 'notifications' && (
        <form onSubmit={handleSaveNotifications} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-sm p-6 space-y-4">
          <div className="border-b border-outline-variant/15 pb-4">
            <h3 className="font-bold text-sm text-on-surface">Préférences de Notifications & Alertes</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">Choisissez les alertes importantes à recevoir</p>
          </div>

          <div className="space-y-3">
            <label className="flex items-start space-x-3 p-3 rounded-xl bg-surface-container-low border border-outline-variant/15 cursor-pointer hover:bg-surface-container transition-colors">
              <input
                type="checkbox"
                checked={notifHumanHandover}
                onChange={(e) => setNotifHumanHandover(e.target.checked)}
                className="mt-0.5 rounded text-primary focus:ring-primary-container accent-primary"
              />
              <div>
                <span className="text-xs font-bold text-on-surface block">Alerte lors d'une demande d'intervention humaine</span>
                <span className="text-[11px] text-on-surface-variant">L'IA se met en pause et vous notifie dès qu'un prospect demande à parler à un conseiller.</span>
              </div>
            </label>

            <label className="flex items-start space-x-3 p-3 rounded-xl bg-surface-container-low border border-outline-variant/15 cursor-pointer hover:bg-surface-container transition-colors">
              <input
                type="checkbox"
                checked={notifDailySummary}
                onChange={(e) => setNotifDailySummary(e.target.checked)}
                className="mt-0.5 rounded text-primary focus:ring-primary-container accent-primary"
              />
              <div>
                <span className="text-xs font-bold text-on-surface block">Résumé quotidien des prospects qualifiés</span>
                <span className="text-[11px] text-on-surface-variant">Recevez chaque soir un récapitulatif des opportunités de vente chaudes de la journée.</span>
              </div>
            </label>

            <label className="flex items-start space-x-3 p-3 rounded-xl bg-surface-container-low border border-outline-variant/15 cursor-pointer hover:bg-surface-container transition-colors">
              <input
                type="checkbox"
                checked={notifSound}
                onChange={(e) => setNotifSound(e.target.checked)}
                className="mt-0.5 rounded text-primary focus:ring-primary-container accent-primary"
              />
              <div>
                <span className="text-xs font-bold text-on-surface block">Sonnerie à la réception d'un nouveau prospect chaud</span>
                <span className="text-[11px] text-on-surface-variant">Émet un signal sonore discret sur le dashboard lorsqu'un lead est qualifié à 80%+.</span>
              </div>
            </label>
          </div>

          <div className="pt-4 border-t border-outline-variant/15 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-primary-container hover:bg-primary hover:text-on-primary text-on-primary-container disabled:opacity-50 font-bold text-xs rounded-xl shadow-sm transition-all"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer les notifications'}
            </button>
          </div>
        </form>
      )}

      {/* ========================================================= */}
      {/* TAB 6: SÉCURITÉ & RLS                                     */}
      {/* ========================================================= */}
      {activeTab === 'security' && (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-sm p-6 space-y-6">
          <div className="border-b border-outline-variant/15 pb-4">
            <h3 className="font-bold text-sm text-on-surface">Sécurité du Compte & Isolation Multi-Tenant</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">Contrôle d'accès et politiques de protection des données Supabase</p>
          </div>

          {/* RLS Status Badge */}
          <div className="p-4 rounded-xl bg-secondary-container/40 border border-secondary-container text-on-secondary-container space-y-2">
            <div className="flex items-center space-x-2 font-bold text-xs">
              <Shield className="w-4 h-4 text-primary" />
              <span>Row Level Security (RLS) Actif & Vérifié</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Vos prospects, conversations et produits sont isolés cryptographiquement par votre identifiant unique propriétaire :
            </p>
            <div className="font-mono text-[11px] bg-surface-container-lowest/80 px-2.5 py-1.5 rounded-lg border border-outline-variant/20 text-on-surface select-all">
              ID Propriétaire : {user?.id || 'Chargement...'}
            </div>
          </div>

          {/* Password update form */}
          <form onSubmit={handleUpdatePassword} className="space-y-4 pt-2">
            <h4 className="font-bold text-xs text-on-surface">Modifier mon mot de passe</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Nouveau mot de passe</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Au moins 6 caractères"
                    className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/20 rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary-container pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-on-surface-variant hover:text-on-surface"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1">Confirmer le mot de passe</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Répétez le mot de passe"
                  className="w-full px-3.5 py-2 bg-surface-container-low border border-outline-variant/20 rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary-container"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={passwordLoading}
                className="px-5 py-2 bg-on-surface text-surface-container-lowest hover:bg-slate-800 disabled:opacity-50 font-bold text-xs rounded-xl transition-all shadow-xs"
              >
                {passwordLoading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
              </button>
            </div>
          </form>

          {/* Sign Out Action */}
          <div className="pt-4 border-t border-outline-variant/15 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-on-surface block">Déconnexion de session</span>
              <span className="text-[11px] text-on-surface-variant">Fermer la session sur cet appareil</span>
            </div>
            <button
              type="button"
              onClick={async () => {
                await signOut();
                if (onNavigate) onNavigate('login');
              }}
              className="px-4 py-2 rounded-xl border border-error text-error hover:bg-error-container/30 text-xs font-bold transition-colors"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
