import React, { useState } from 'react';
import { Users, Search, Filter, UserCheck, Phone, MapPin, DollarSign, Award, ArrowUpRight, Sparkles } from 'lucide-react';

export default function Prospects({ state, onNavigate }) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const contacts = state.contacts.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                          c.whatsappNumber.includes(search) ||
                          (c.need || '').toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Qualifié':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">🟢 Qualifié</span>;
      case 'En conversation':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">🔵 En conversation</span>;
      case 'À relancer':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">🟠 À relancer</span>;
      case 'Client':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">👑 Client</span>;
      case 'Non qualifié':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-300">⚪ Non qualifié</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">✨ Nouveau</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <Users className="w-5 h-5 text-emerald-500" />
            <span>Gestion des Prospects (CRM IA)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Chaque prospect échangeant avec l'IA est automatiquement qualifié et scoré (0 à 100).
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center space-x-2">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-800">
              {state.contacts.filter(c => c.status === 'Qualifié').length} Prospects Qualifiés
            </span>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher nom, numéro, besoin..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          {['all', 'Nouveau', 'En conversation', 'Qualifié', 'À relancer', 'Client'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                filterStatus === st 
                  ? 'bg-slate-900 text-white' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'all' ? 'Tous' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Contacts List / Cards */}
      <div className="space-y-4">
        {contacts.map((c) => (
          <div key={c.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 hover:border-emerald-500/40 transition-all">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Left Column: Contact info */}
              <div className="flex items-start space-x-3.5">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-slate-950 flex items-center justify-center font-extrabold text-sm shadow-md shadow-emerald-500/10 shrink-0">
                  {c.name ? c.name.charAt(0) : 'P'}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-extrabold text-slate-900">{c.name || 'Prospect WhatsApp'}</h3>
                    {getStatusBadge(c.status)}
                  </div>
                  <p className="text-xs text-slate-500 font-mono flex items-center space-x-1 mt-0.5">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{c.whatsappNumber}</span>
                  </p>

                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-600">
                    {c.location && (
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{c.location}</span>
                      </span>
                    )}
                    {c.budget && (
                      <span className="flex items-center space-x-1 font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <DollarSign className="w-3 h-3" />
                        <span>Budget: {c.budget}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Center/Right: AI Score & Action */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                {/* Visual Score Bar */}
                <div className="w-48 space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-700 flex items-center space-x-1">
                      <Sparkles className="w-3 h-3 text-emerald-500" />
                      <span>Score IA</span>
                    </span>
                    <span className="font-extrabold text-emerald-600">{c.score} / 100</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        c.score >= 80 ? 'bg-emerald-500' : c.score >= 50 ? 'bg-blue-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${c.score}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('conversations')}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center space-x-1 whitespace-nowrap"
                >
                  <span>Ouvrir la discussion</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Last message preview */}
            {c.lastMessage && (
              <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
                <span className="truncate italic">"{c.lastMessage}"</span>
                <span className="text-[11px] text-slate-400 shrink-0 ml-2">Dernière interaction en direct</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
