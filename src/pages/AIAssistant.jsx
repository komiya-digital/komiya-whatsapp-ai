import React, { useState } from 'react';
import { Bot, Sparkles, Send, RefreshCw, CheckCircle2, X } from 'lucide-react';

export default function AIAssistant({ state, onUpdateState }) {
  const [formData, setFormData] = useState({ ...state.aiAgent });
  const [isSaved, setIsSaved] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);

  // Live Test simulator state
  const [testMessages, setTestMessages] = useState([
    { role: 'model', text: `Bonjour ! Je suis ${formData.name || 'Awa'}, l'assistant commercial IA de ${state.business?.name || 'notre entreprise'}. Comment puis-je vous aider aujourd'hui ?` }
  ]);
  const [inputTest, setInputTest] = useState('');
  const [testLoading, setTestLoading] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    onUpdateState({
      aiAgent: { ...formData }
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleSendTest = async (e) => {
    e.preventDefault();
    if (!inputTest.trim()) return;

    const userText = inputTest;
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
          products: state.products
        })
      });

      const data = await res.json();
      setTestMessages(prev => [...prev, { role: 'model', text: data.replyText || "Je vais vérifier cela pour vous." }]);
    } catch (err) {
      setTestMessages(prev => [...prev, { role: 'model', text: "Bonjour ! Merci pour votre message. Comment puis-je vous aider aujourd'hui ?" }]);
    } finally {
      setTestLoading(false);
    }
  };

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
            Personnalisez le comportement, le ton et les objectifs de votre commercial WhatsApp IA ("Awa").
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

      {isSaved && (
        <div className="p-4 rounded-xl text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Configuration de l'Assistant IA enregistrée avec succès !</span>
        </div>
      )}

      {/* Main Configuration Form */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nom de l'assistant</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Awa"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Zone géographique</label>
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
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Description de l'entreprise</label>
          <textarea
            rows={2}
            value={formData.companyDescription || ''}
            onChange={(e) => setFormData({ ...formData, companyDescription: e.target.value })}
            placeholder="Présentez brièvement votre entreprise et vos activités..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Ton de conversation</label>
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
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Objectif principal</label>
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
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Instructions supplémentaires (Prompt Guardrails)</label>
          <textarea
            rows={4}
            value={formData.customInstructions || ''}
            onChange={(e) => setFormData({ ...formData, customInstructions: e.target.value })}
            placeholder="Ex: Pose une question à la fois. Réponds simplement en français. Lorsque le prospect est intéressé, récupère son nom, téléphone et budget..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 transition-all"
          >
            Enregistrer la configuration IA
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
                <span className="font-bold text-sm">Simulateur - Tester {formData.name || 'Awa'}</span>
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
                    <span>Awa réfléchit...</span>
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
