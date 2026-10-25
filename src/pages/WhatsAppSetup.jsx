import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Key, Phone, RefreshCw, CheckCircle2, XCircle, Copy, Link, AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { getWhatsAppConnection, upsertWhatsAppConnection } from '../lib/supabaseClient';

export default function WhatsAppSetup({ onNavigate }) {
  const { business, updateWhatsAppConnectionState, refreshUserData } = useAuth();

  const [apiKey, setApiKey] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const webhookUrl = `${window.location.origin}/api/webhooks/wasender`;

  const loadData = useCallback(async () => {
    if (!business?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const conn = await getWhatsAppConnection(business.id);
      if (conn) {
        setApiKey(conn.apiKey || '');
        setPhoneNumber(conn.phoneNumber || '');
        setSessionId(conn.sessionId || '');
        setIsConnected(Boolean(conn.isConnected));
      }
    } catch (err) {
      console.error('Error loading WhatsApp connection:', err);
    } finally {
      setLoading(false);
    }
  }, [business?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleConnect = async () => {
    if (!business?.id) {
      setStatusMessage("⚠️ Données d'entreprise non trouvées. Veuillez recharger la page.");
      return;
    }

    if (!phoneNumber.trim() && !sessionId.trim() && !apiKey.trim()) {
      setStatusMessage("⚠️ Veuillez saisir au moins votre numéro WhatsApp et vos identifiants WASenderAPI.");
      return;
    }

    setActionLoading(true);
    setStatusMessage('');

    try {
      const isNowConnected = Boolean(phoneNumber.trim() && sessionId.trim() && apiKey.trim());
      const savedConn = await upsertWhatsAppConnection(business.id, {
        apiKey: apiKey.trim(),
        phoneNumber: phoneNumber.trim(),
        sessionId: sessionId.trim(),
        isConnected: isNowConnected,
        status: isNowConnected ? 'connected' : 'disconnected'
      });

      setIsConnected(Boolean(savedConn.isConnected));
      if (updateWhatsAppConnectionState) {
        updateWhatsAppConnectionState({
          ...savedConn,
          is_connected: Boolean(savedConn.isConnected)
        });
      }

      if (refreshUserData) {
        try { await refreshUserData(); } catch (e) {}
      }

      if (isNowConnected) {
        setStatusMessage('🟢 WhatsApp connecté avec succès ! Paramètres synchronisés pour votre entreprise.');
      } else {
        setStatusMessage('ℹ️ Paramètres enregistrés. Renseignez la clé API, la session et le numéro pour finaliser la connexion.');
      }
    } catch (err) {
      console.error('Error saving WhatsApp connection:', err);
      setStatusMessage('⚠️ Erreur lors de la sauvegarde : ' + (err.message || 'vérifiez vos accès Supabase'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!business?.id) return;
    setActionLoading(true);
    setStatusMessage('');

    try {
      const savedConn = await upsertWhatsAppConnection(business.id, {
        apiKey,
        phoneNumber,
        sessionId,
        isConnected: false,
        status: 'disconnected'
      });
      setIsConnected(false);
      if (updateWhatsAppConnectionState) {
        updateWhatsAppConnectionState({
          ...savedConn,
          is_connected: false
        });
      }
      if (refreshUserData) {
        try { await refreshUserData(); } catch (e) {}
      }
      setStatusMessage('🔴 WhatsApp déconnecté.');
    } catch (err) {
      console.error('Error disconnecting WhatsApp:', err);
      setStatusMessage('⚠️ Erreur lors de la déconnexion.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-700">Chargement de votre connexion WhatsApp...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-emerald-500" />
            <span>Connexion WhatsApp (WASenderAPI)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Associez le numéro WhatsApp de votre entreprise via WASenderAPI pour permettre à votre commercial IA de répondre à vos prospects.
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <span className="px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>🟢 Connecté {phoneNumber ? `(${phoneNumber})` : ''}</span>
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

      {/* Onboarding Guidance Banner */}
      {isConnected && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs shrink-0">
              ✓ 1
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-900">Étape 1 validée : Session WhatsApp connectée !</p>
              <p className="text-[11px] text-emerald-700">Vos identifiants WASenderAPI sont actifs. Passez à la configuration de l'IA.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('assistant')}
                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-sm flex items-center space-x-1"
              >
                <span>Étape 2 : Assistant IA</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('dashboard')}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all"
              >
                Dashboard
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Connection Form */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
        <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Paramètres de session WASenderAPI pour {business?.name || 'votre entreprise'}</span>
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
            <p className="text-[11px] text-slate-400 mt-1">Généré depuis votre compte WASenderAPI</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Numéro WhatsApp professionnel
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+22500000000"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Format international avec indicatif pays</p>
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
            placeholder="Ex: 121080"
            className="w-full max-w-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3">
          <button
            onClick={handleConnect}
            disabled={actionLoading}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center space-x-2"
          >
            {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            <span>Enregistrer & Connecter</span>
          </button>

          {isConnected && (
            <button
              onClick={handleDisconnect}
              disabled={actionLoading}
              className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition-all border border-rose-200"
            >
              Déconnecter
            </button>
          )}
        </div>
      </div>

      {/* Webhook Configuration Section */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
          <Link className="w-5 h-5 text-emerald-400" />
          <h2 className="text-sm font-bold">Route Webhook WASenderAPI</h2>
        </div>

        <p className="text-xs text-slate-300">
          Pour recevoir les messages de vos prospects en direct, copiez cette URL Webhook et collez-la dans la configuration de votre session WASenderAPI :
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
            Événements à cocher dans votre interface WASenderAPI : <strong>messages.received</strong>, <strong>messages.upsert</strong>, <strong>session.status</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
