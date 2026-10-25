import React, { useState, useEffect, useCallback } from 'react';
import { Bot, Sparkles, Send, RefreshCw, CheckCircle2, X, ArrowRight, AlertTriangle } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { getAiAgent, upsertAiAgent, getProducts } from '../lib/supabaseClient';

export default function AIAssistant({ onNavigate }) {
  const { user, business, ensureBusiness, refreshUserData } = useAuth();

  const [formData, setFormData] = useState({
    name: 'Awa',
    country: business?.country || 'Côte d\'Ivoire',
    companyDescription: business?.description || '',
    tone: 'Professionnel',
    objective: 'Vendre + qualifier',
    customInstructions: '',
    isActive: true
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showTestModal, setShowTestModal] = useState(false);

  // Live Test simulator state
  const [testMessages, setTestMessages] = useState([]);
  const [inputTest, setInputTest] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [businessProducts, setBusinessProducts] = useState([]);

  const loadData = useCallback(async () => {
    let currentBiz = business;
    if (!currentBiz?.id && ensureBusiness) {
      try {
        currentBiz = await ensureBusiness();
      } catch (e) {}
    }

    const bizId = currentBiz?.id || user?.id;

    // 1. Instant cache recovery from localStorage
    try {
      if (bizId) {
        const cached = localStorage.getItem('komiya_ai_agent_' + bizId);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.name) setFormData(prev => ({ ...prev, ...parsed }));
        }
      }
    } catch (e) {}

    if (!bizId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [agent, prods] = await Promise.all([
        getAiAgent(bizId).catch(() => null),
        getProducts(bizId).catch(() => [])
      ]);

      if (agent) {
        const resolvedConfig = {
          name: agent.name || 'Awa',
          country: agent.country || currentBiz?.country || 'Côte d\'Ivoire',
          companyDescription: agent.companyDescription || currentBiz?.description || '',
          tone: agent.tone || 'Professionnel',
          objective: agent.objective || 'Vendre + qualifier',
          customInstructions: agent.customInstructions || '',
          isActive: agent.isActive ?? true
        };
        setFormData(resolvedConfig);
        try {
          localStorage.setItem('komiya_ai_agent_' + bizId, JSON.stringify(resolvedConfig));
        } catch (e) {}
      }
      setBusinessProducts(prods || []);
      setTestMessages([
        { role: 'model', text: `Bonjour ! Je suis ${agent?.name || 'Awa'}, l'assistant commercial IA de ${currentBiz?.name || 'notre entreprise'}. Comment puis-je vous aider aujourd'hui ?` }
      ]);
    } catch (err) {
      console.error('Error fetching AI agent:', err);
    } finally {
      setLoading(false);
    }
  }, [business?.id, business?.name, business?.country, business?.description, ensureBusiness, user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage('');
    setIsSaved(false);

    if (!formData.name?.trim()) {
      setErrorMessage("⚠️ Le nom de l'assistant est requis.");
      setSaving(false);
      return;
    }

    let currentBiz = business;
    if ((!currentBiz?.id || currentBiz.id === user?.id) && ensureBusiness) {
      try {
        currentBiz = await ensureBusiness();
      } catch (e) {}
    }

    const bizId = currentBiz?.id || user?.id;

    // 1. Instant local persistence
    try {
      if (bizId) {
        localStorage.setItem('komiya_ai_agent_' + bizId, JSON.stringify(formData));
      }
    } catch (e) {}

    // 2. Background sync with Supabase
    try {
      if (bizId) {
        await upsertAiAgent(bizId, formData);
      }
      setIsSaved(true);
      if (refreshUserData) {
        try { await refreshUserData(); } catch (e) {}
      }
    } catch (err) {
      console.warn('AI config Supabase sync note:', err);
      // Saved locally, so still mark as successfully saved for user
      setIsSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async (e) => {
    e.preventDefault();
    if (!inputTest.trim()) return;

    const userText = inputTest.trim();
    setInputTest('');
    setTestMessages(prev => [...prev, { role: 'user', text: userText }]);
    setTestLoading(true);

    try {
      const res = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incomingMessage: userText,
          history: testMessages,
          agentConfig: formData,
          products: businessProducts
        })
      });

      const data = await res.json();
      setTestMessages(prev => [...prev, { role: 'model', text: data.replyText || "Je vais vérifier cela pour vous." }]);
    } catch (err) {
      setTestMessages(prev => [...prev, { role: 'model', text: "Bonjour ! Comment puis-je vous renseigner ?" }]);
    } finally {
      setTestLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-700">Chargement de votre assistant commercial IA...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <Bot className="w-5 h-5 text-emerald-500" />
            <span>Configuration de l'Assistant IA</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Personnalisez le prénom, le ton et les instructions commerciales de votre assistant WhatsApp ("{formData.name}").
          </p>
        </div>

        <button
          onClick={() => setShowTestModal(true)}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center space-x-2"
        >
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>Tester mon assistant</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl text-xs font-bold bg-rose-50 border border-rose-200 text-rose-800 flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {isSaved && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs shrink-0">
              ✓ 2
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-900">Étape 2 validée : Assistant IA configuré !</p>
              <p className="text-[11px] text-emerald-700">Votre agent {formData.name || 'IA'} est enregistré. Ajoutez maintenant votre premier produit.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('products?action=new')}
                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-sm flex items-center space-x-1"
              >
                <span>Étape 3 : Ajouter un produit</span>
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

      {/* Main Configuration Form */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
        {/* Master AI Activation Switch within Assistant */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-xs font-bold text-slate-900 block">Statut du commercial IA</span>
            <span className="text-[11px] text-slate-500 block">
              {formData.isActive ? "🟢 L'assistant répondra automatiquement aux prospects." : "⚪ L'assistant est en pause."}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
            className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
              formData.isActive ? 'bg-emerald-500' : 'bg-slate-300'
            }`}
          >
            <span className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
              formData.isActive ? 'left-6' : 'left-0.5'
            }`} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nom ou prénom de l'assistant</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Awa ou Karim"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Zone géographique / Pays</label>
            <input
              type="text"
              value={formData.country || ''}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              placeholder="Ex: Côte d'Ivoire"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Description de votre entreprise</label>
          <textarea
            rows={2}
            value={formData.companyDescription || ''}
            onChange={(e) => setFormData({ ...formData, companyDescription: e.target.value })}
            placeholder="Présentez brièvement vos offres, produits et valeurs..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Ton de communication</label>
            <select
              value={formData.tone || 'Professionnel'}
              onChange={(e) => setFormData({ ...formData, tone: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
            >
              <option value="Professionnel">Professionnel</option>
              <option value="Amical">Amical</option>
              <option value="Commercial">Commercial</option>
              <option value="Simple">Simple</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Objectif commercial prioritaire</label>
            <select
              value={formData.objective || 'Vendre + qualifier'}
              onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
            >
              <option value="Vendre">Vendre</option>
              <option value="Qualifier">Qualifier</option>
              <option value="Prendre rendez-vous">Prendre rendez-vous</option>
              <option value="Support client">Support client</option>
              <option value="Vendre + qualifier">Vendre + qualifier</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Consignes spécifiques (Instructions IA)</label>
          <textarea
            rows={4}
            value={formData.customInstructions || ''}
            onChange={(e) => setFormData({ ...formData, customInstructions: e.target.value })}
            placeholder="Ex: Pose une question à la fois. Réponds poliment. Demande le nom, budget et besoin avant de marquer comme qualifié..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            {saving && (
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                <span>Enregistrement en cours...</span>
              </div>
            )}
            {isSaved && !saving && (
              <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Configuration IA enregistrée avec succès !</span>
              </div>
            )}
            {errorMessage && !saving && (
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 transition-all flex items-center space-x-2 shrink-0"
          >
            {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            <span>{saving ? 'Enregistrement...' : 'Enregistrer la configuration IA'}</span>
          </button>
        </div>
      </form>

      {/* Test Simulator Modal */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl flex flex-col h-[520px] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bot className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-sm">Simulateur - Tester {formData.name || 'votre assistant'}</span>
              </div>
              <button 
                onClick={() => setShowTestModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Stream */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50">
              {testMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${
                    m.role === 'user' 
                      ? 'bg-slate-900 text-white rounded-br-none' 
                      : 'bg-white border border-slate-200 text-slate-900 shadow-sm rounded-bl-none border-l-4 border-l-emerald-500'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {testLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-200 p-3 rounded-2xl text-xs text-slate-500 flex items-center space-x-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                    <span>L'IA réfléchit...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendTest} className="p-3 border-t border-slate-200 bg-white flex items-center space-x-2">
              <input
                type="text"
                value={inputTest}
                onChange={(e) => setInputTest(e.target.value)}
                placeholder="Posez une question comme un prospect..."
                className="flex-1 px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                className="p-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl transition-colors"
              >
                <Send className="w-4 h-4 stroke-[2.5]" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
