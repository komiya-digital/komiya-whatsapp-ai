import React, { useState } from 'react';
import { Zap, Clock, UserCheck, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function Automations({ state, onUpdateState }) {
  const [automations, setAutomations] = useState([...state.automations]);

  const toggleAutomation = (id) => {
    const updated = automations.map(a => a.id === id ? { ...a, isEnabled: !a.isEnabled } : a);
    setAutomations(updated);
    onUpdateState({ automations: updated });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <Zap className="w-5 h-5 text-emerald-500" />
            <span>Automatisations & Scénarios WhatsApp</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gérez la réactivité de votre commercial IA, les relances automatiques et les alertes d'intervention humaine.
          </p>
        </div>
      </div>

      {/* Automations List */}
      <div className="space-y-4">
        {/* Auto 1 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs">Auto 1</span>
              <h3 className="font-extrabold text-sm text-slate-900">Réponse instantanée IA</h3>
            </div>
            <p className="text-xs text-slate-600">
              <strong>Quand :</strong> Nouveau message WhatsApp entrant <br />
              <strong>Alors :</strong> L'assistant IA Awa répond immédiatement en moins de 10 secondes.
            </p>
          </div>

          <button
            onClick={() => toggleAutomation('auto_1')}
            className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
              automations.find(a => a.id === 'auto_1')?.isEnabled ? 'bg-emerald-500' : 'bg-slate-300'
            }`}
          >
            <span className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
              automations.find(a => a.id === 'auto_1')?.isEnabled ? 'left-6' : 'left-0.5'
            }`} />
          </button>
        </div>

        {/* Auto 2 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-blue-100 text-blue-800 font-bold text-xs">Auto 2</span>
              <h3 className="font-extrabold text-sm text-slate-900">Qualification automatique des leads</h3>
            </div>
            <p className="text-xs text-slate-600">
              <strong>Quand :</strong> Le prospect répond aux questions <br />
              <strong>Alors :</strong> L'IA extrait le besoin, le budget et le produit d'intérêt, puis met à jour le score (0-100).
            </p>
          </div>

          <button
            onClick={() => toggleAutomation('auto_2')}
            className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
              automations.find(a => a.id === 'auto_2')?.isEnabled ? 'bg-emerald-500' : 'bg-slate-300'
            }`}
          >
            <span className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
              automations.find(a => a.id === 'auto_2')?.isEnabled ? 'left-6' : 'left-0.5'
            }`} />
          </button>
        </div>

        {/* Auto 3 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800 font-bold text-xs">Auto 3</span>
                <h3 className="font-extrabold text-sm text-slate-900">Relance automatique des prospects inactifs</h3>
              </div>
              <p className="text-xs text-slate-600">
                <strong>Si :</strong> Le prospect ne répond pas pendant <strong>6 heures</strong> <br />
                <strong>Alors :</strong> Envoyer un message de relance personnalisé par l'IA.
              </p>
            </div>

            <button
              onClick={() => toggleAutomation('auto_3')}
              className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                automations.find(a => a.id === 'auto_3')?.isEnabled ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            >
              <span className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                automations.find(a => a.id === 'auto_3')?.isEnabled ? 'left-6' : 'left-0.5'
              }`} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Délai avant relance</label>
              <select className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                <option>6 heures</option>
                <option>12 heures</option>
                <option>24 heures</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Nombre max de relances</label>
              <select className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                <option>1 relance</option>
                <option>2 relances</option>
                <option>3 relances</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">Type de message</label>
              <select className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                <option>Généré par IA</option>
                <option>Modèle personnalisé</option>
              </select>
            </div>
          </div>
        </div>

        {/* Auto 4 */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-rose-100 text-rose-800 font-bold text-xs">Auto 4</span>
              <h3 className="font-extrabold text-sm text-slate-900">Passage de main humain (Alerte)</h3>
            </div>
            <p className="text-xs text-slate-600">
              <strong>Si :</strong> Le prospect demande un humain OU pose une question inconnue <br />
              <strong>Alors :</strong> Désactiver l'IA temporairement pour ce chat et notifier l'utilisateur.
            </p>
          </div>

          <button
            onClick={() => toggleAutomation('auto_4')}
            className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
              automations.find(a => a.id === 'auto_4')?.isEnabled ? 'bg-emerald-500' : 'bg-slate-300'
            }`}
          >
            <span className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
              automations.find(a => a.id === 'auto_4')?.isEnabled ? 'left-6' : 'left-0.5'
            }`} />
          </button>
        </div>
      </div>
    </div>
  );
}
