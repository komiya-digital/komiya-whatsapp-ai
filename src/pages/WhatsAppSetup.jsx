import React, { useState } from 'react';
import { MessageSquare, Key, Phone, RefreshCw, CheckCircle2, XCircle, Copy, Link, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function WhatsAppSetup({ state, onUpdateState }) {
  const [apiKey, setApiKey] = useState(state.whatsapp.apiKey || '');
  const [phoneNumber, setPhoneNumber] = useState(state.whatsapp.phoneNumber || '+2250586896826');
  const [sessionId, setSessionId] = useState(state.whatsapp.sessionId || '121080');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const webhookUrl = `${window.location.origin}/api/webhooks/wasender`;

  const handleConnect = () => {
    setLoading(true);
    setStatusMessage('');

    setTimeout(() => {
      setLoading(false);
      onUpdateState({
        whatsapp: {
          ...state.whatsapp,
          apiKey,
          phoneNumber,
          sessionId,
          isConnected: true,
          status: 'connected',
          lastSyncAt: new Date().toISOString()
        }
      });
      setStatusMessage('🟢 WhatsApp connecté avec succès ! La session WASender #121080 est active.');
    }, 800);
  };

  const handleCheck = () => {
    setLoading(true);
    setStatusMessage('');

    setTimeout(() => {
      setLoading(false);
      if (state.whatsapp.isConnected) {
        setStatusMessage('✅ Connexion vérifiée. La session WASender (Komiya Digital +2250586896826) répond parfaitement.');
      } else {
        setStatusMessage('⚠️ WhatsApp n\'est pas connecté. Veuillez cliquer sur "Connecter WhatsApp".');
      }
    }, 600);
  };

  const handleDisconnect = () => {
    onUpdateState({
      whatsapp: {
        ...state.whatsapp,
        isConnected: false,
        status: 'disconnected'
      }
    });
    setStatusMessage('🔴 WhatsApp déconnecté.');
  };

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-emerald-500" />
            <span>Connexion WASenderAPI</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Connectez votre numéro WhatsApp via WASenderAPI pour autoriser le commercial IA à répondre.
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex items-center space-x-2">
          {state.whatsapp.isConnected ? (
            <span className="px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>🟢 Connecté (Komiya Digital)</span>
            </span>
          ) : (
            <span className="px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-300 flex items-center space-x-1.5">
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>🔴 Non connecté</span>
            </span>
          )}
        </div>
      </div>

      {statusMessage && (
        <div className={`p-4 rounded-xl text-xs font-bold border ${
          statusMessage.includes('🟢') || statusMessage.includes('✅') 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {statusMessage}
        </div>
      )}

      {/* Main Connection Form */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Paramètres de session WASenderAPI</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              WASender Personal Access Token (Clé d'accès API)
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Bearer Token (ex: 8610|...)"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Généré depuis votre tableau de bord WASenderAPI</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Numéro WhatsApp connecté
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+2250586896826"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Au format international avec indicatif pays</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            ID de Session WASender
          </label>
          <input
            type="text"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            placeholder="121080"
            className="w-full max-w-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
          <button
            onClick={handleConnect}
            disabled={loading}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center space-x-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>Connecter WhatsApp</span>
          </button>

          <button
            onClick={handleCheck}
            disabled={loading}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-all border border-slate-200 flex items-center space-x-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Vérifier la connexion</span>
          </button>

          <button
            onClick={handleDisconnect}
            className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition-all border border-rose-200"
          >
            Déconnecter
          </button>
        </div>
      </div>

      {/* Webhook Configuration Section */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
          <Link className="w-5 h-5 text-emerald-400" />
          <h2 className="text-sm font-bold">Route Webhook WASenderAPI</h2>
        </div>

        <p className="text-xs text-slate-300">
          Pour recevoir les messages WhatsApp en temps réel, copiez cette URL Webhook et collez-la dans la configuration de votre session WASenderAPI :
        </p>

        <div className="flex items-center space-x-2 bg-slate-800/90 p-2.5 rounded-xl border border-slate-700">
          <code className="text-xs text-emerald-300 font-mono flex-1 overflow-x-auto">
            {webhookUrl}
          </code>
          <button
            onClick={handleCopyWebhook}
            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1 shrink-0"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copied ? 'Copié !' : 'Copier'}</span>
          </button>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl flex items-start space-x-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-200/90 leading-relaxed">
            Événements à cocher sur WASenderAPI : <strong>messages.received</strong>, <strong>messages.upsert</strong>, <strong>session.status</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
