import React, { useState } from 'react';
import { Settings, User, Building, MessageSquare, Bot, Bell, Shield, CheckCircle2 } from 'lucide-react';

export default function SettingsPage({ state, onUpdateState }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [fullName, setFullName] = useState(state.user.fullName || 'Komiya Digital');
  const [email, setEmail] = useState(state.user.email || 'contact@komiyadigital.ci');
  const [companyName, setCompanyName] = useState(state.business.name || 'Komiya Commerce');
  const [country, setCountry] = useState(state.business.country || 'Côte d\'Ivoire');
  const [currency, setCurrency] = useState(state.business.currency || 'FCFA');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    onUpdateState({
      user: { ...state.user, fullName, email },
      business: { ...state.business, name: companyName, country, currency }
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User },
    { id: 'business', label: 'Entreprise', icon: Building },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
    { id: 'ai', label: 'IA', icon: Bot },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Sécurité', icon: Shield },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
          <Settings className="w-5 h-5 text-emerald-500" />
          <span>Paramètres de la Plateforme</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Gérez votre profil utilisateur, les informations d'entreprise et les clés de sécurité.
        </p>
      </div>

      {isSaved && (
        <div className="p-4 rounded-xl text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Paramètres sauvegardés avec succès !</span>
        </div>
      )}

      {/* Settings Navigation Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 overflow-x-auto pb-2">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all whitespace-nowrap ${
                isActive ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Form */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Informations Personnelles</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nom complet</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Adresse email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>
        )}

        {activeTab === 'business' && (
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Profil de l'Entreprise</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nom de l'entreprise</label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pays d'opération</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Devise principale</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <option value="FCFA">FCFA</option>
                  <option value="EUR">EUR</option>
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'whatsapp' && (
          <div className="space-y-3 text-xs text-slate-600">
            <h3 className="font-bold text-sm text-slate-900">Paramètres WASenderAPI</h3>
            <p>Session ID : <strong>121080</strong></p>
            <p>Statut : <span className="text-emerald-600 font-bold">🟢 Connecté (Komiya Digital)</span></p>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-3 text-xs text-slate-600">
            <h3 className="font-bold text-sm text-slate-900">Paramètres Moteur IA</h3>
            <p>Modèle LLM : <strong>Gemini 2.5 Flash</strong></p>
            <p>Nom de l'Agent : <strong>{state.aiAgent.name}</strong></p>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-3 text-xs">
            <h3 className="font-bold text-sm text-slate-900">Notifications & Alertes</h3>
            <label className="flex items-center space-x-2">
              <input type="checkbox" defaultChecked className="rounded text-emerald-500" />
              <span>Recevoir une alerte lors d'une demande d'intervention humaine</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" defaultChecked className="rounded text-emerald-500" />
              <span>Recevoir un résumé quotidien des prospects qualifiés</span>
            </label>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-3 text-xs">
            <h3 className="font-bold text-sm text-slate-900">Sécurité et RLS Supabase</h3>
            <p className="text-slate-600">Toutes les données sont isolées par entreprise avec Row Level Security (RLS).</p>
          </div>
        )}

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20"
          >
            Sauvegarder les modifications
          </button>
        </div>
      </form>
    </div>
  );
}
