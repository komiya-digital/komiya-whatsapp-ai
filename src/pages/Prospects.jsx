import React, { useState, useEffect, useCallback } from 'react';
import { Users, Search, Filter, UserCheck, Phone, MapPin, DollarSign, Award, ArrowUpRight, Sparkles, RefreshCw, UserPlus, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { getContacts, createContact } from '../lib/supabaseClient';

export default function Prospects({ onNavigate }) {
  const { business } = useAuth();

  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Modal creation state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalFeedback, setModalFeedback] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone_number: '',
    need: '',
    budget: '',
    status: 'Nouveau',
    score: 70
  });

  const loadData = useCallback(async () => {
    if (!business?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getContacts(business.id);
      setContacts(data);
    } catch (err) {
      console.error('Error fetching contacts:', err);
    } finally {
      setLoading(false);
    }
  }, [business?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Check if opened with action=new
  useEffect(() => {
    const checkAction = () => {
      if (window.location.search.includes('action=new') || window.location.href.includes('action=new')) {
        setIsModalOpen(true);
      }
    };
    checkAction();
    window.addEventListener('popstate', checkAction);
    return () => window.removeEventListener('popstate', checkAction);
  }, []);

  const closeModal = () => {
    setIsModalOpen(false);
    setModalFeedback(null);
    if (window.location.search.includes('action=new') || window.location.href.includes('action=new')) {
      window.history.replaceState(null, '', '/prospects');
    }
  };

  const handleCreateContact = async (e) => {
    e.preventDefault();
    if (!business?.id) {
      setModalFeedback({ type: 'error', message: 'Veuillez d\'abord configurer votre entreprise.' });
      return;
    }
    if (!formData.phone_number.trim()) {
      setModalFeedback({ type: 'error', message: 'Le numéro WhatsApp est obligatoire.' });
      return;
    }

    try {
      setSubmitting(true);
      setModalFeedback(null);
      await createContact(business.id, formData);
      setModalFeedback({ type: 'success', message: 'Contact créé avec succès !' });
      await loadData();
      setTimeout(() => {
        closeModal();
        setFormData({
          name: '',
          phone_number: '',
          need: '',
          budget: '',
          status: 'Nouveau',
          score: 70
        });
      }, 900);
    } catch (err) {
      console.error('Erreur création contact:', err);
      setModalFeedback({ type: 'error', message: err.message || 'Impossible d\'ajouter ce prospect.' });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredContacts = contacts.filter(c => {
    const nameMatch = (c.name || '').toLowerCase().includes(search.toLowerCase());
    const phoneMatch = (c.whatsappNumber || '').includes(search);
    const needMatch = (c.need || '').toLowerCase().includes(search.toLowerCase());
    const matchesSearch = nameMatch || phoneMatch || needMatch;
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

  const qualifiedCount = contacts.filter(c => c.status === 'Qualifié').length;

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
            Chaque prospect échangeant avec l'IA sur WhatsApp est automatiquement enregistré et qualifié pour votre entreprise.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center space-x-2">
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-emerald-800">
              {qualifiedCount} Prospect{qualifiedCount > 1 ? 's' : ''} Qualifié{qualifiedCount > 1 ? 's' : ''}
            </span>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition-all flex items-center space-x-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Ajouter un contact</span>
          </button>
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

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-500 mx-auto mb-2" />
          <p className="text-xs text-slate-500">Chargement des prospects...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && contacts.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto mb-4 font-bold text-xl">
            👥
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">Aucun prospect enregistré</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
            Dès qu'un client vous écrira sur votre numéro WhatsApp connecté, son contact sera automatiquement créé ici, et l'IA qualifiera son besoin et son budget.
          </p>
          <button
            onClick={() => onNavigate('whatsapp')}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 inline-flex items-center space-x-2"
          >
            <span>Connecter mon WhatsApp</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filtered empty state */}
      {!loading && contacts.length > 0 && filteredContacts.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-500">
          Aucun prospect ne correspond aux critères de recherche.
        </div>
      )}

      {/* Contacts List / Cards */}
      {!loading && filteredContacts.length > 0 && (
        <div className="space-y-4">
          {filteredContacts.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 hover:border-emerald-500/40 transition-all">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left Column: Contact info */}
                <div className="flex items-start space-x-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-slate-950 flex items-center justify-center font-extrabold text-sm shadow-md shadow-emerald-500/10 shrink-0">
                    {c.name ? c.name.charAt(0).toUpperCase() : 'P'}
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
                        style={{ width: `${Math.min(100, Math.max(0, c.score))}%` }}
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
                  <span className="text-[11px] text-slate-400 shrink-0 ml-2">Dernière interaction</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal Ajouter un contact */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Nouveau Contact WhatsApp</h3>
                  <p className="text-xs text-slate-500">Ajouter manuellement un prospect à votre CRM</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateContact} className="p-6 space-y-4">
              {modalFeedback && (
                <div className={`p-3 rounded-xl border flex items-center space-x-2 text-xs font-semibold ${
                  modalFeedback.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  {modalFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{modalFeedback.message}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nom du prospect
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Kouamé Jean"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Numéro WhatsApp <span className="text-emerald-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="Ex: +225 07 00 00 00 00"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Besoin / Produit recherché
                  </label>
                  <input
                    type="text"
                    value={formData.need}
                    onChange={(e) => setFormData({ ...formData, need: e.target.value })}
                    placeholder="Ex: Sac en cuir marron"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Budget estimé
                  </label>
                  <input
                    type="text"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    placeholder="Ex: 25 000 FCFA"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Statut initial
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                >
                  <option value="Nouveau">✨ Nouveau</option>
                  <option value="En conversation">🔵 En conversation</option>
                  <option value="Qualifié">🟢 Qualifié</option>
                  <option value="Client">👑 Client</option>
                  <option value="À relancer">🟠 À relancer</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center space-x-2"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{submitting ? 'Enregistrement...' : 'Enregistrer le contact'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
