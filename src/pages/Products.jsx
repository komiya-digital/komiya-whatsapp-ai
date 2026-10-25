import React, { useState, useEffect, useCallback } from 'react';
import { Package, Plus, Trash2, Edit, CheckCircle2, HelpCircle, Sparkles, X, RefreshCw, ArrowRight, AlertTriangle } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../lib/supabaseClient';

export default function Products({ onNavigate }) {
  const { user, business, ensureBusiness, refreshUserData } = useAuth();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [justAdded, setJustAdded] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    currency: business?.currency || 'FCFA',
    category: 'Général',
    isAvailable: true,
    salesArguments: '',
    imageUrl: '',
    faqQuestion: '',
    faqAnswer: ''
  });

  const loadData = useCallback(async () => {
    let currentBiz = business;
    if (!currentBiz?.id && ensureBusiness) {
      try {
        currentBiz = await ensureBusiness();
      } catch (e) {}
    }
    const bizId = currentBiz?.id || user?.id;
    if (!bizId) {
      setLoading(false);
      return;
    }

    // 1. Instant local cache load
    try {
      const cached = localStorage.getItem('komiya_products_' + bizId);
      if (cached) {
        setProducts(JSON.parse(cached));
        setLoading(false);
      }
    } catch (e) {}

    // 2. Fetch fresh from Supabase
    try {
      if (!products.length) setLoading(true);
      const data = await getProducts(bizId);
      if (Array.isArray(data) && data.length > 0) {
        setProducts(data);
        try {
          localStorage.setItem('komiya_products_' + bizId, JSON.stringify(data));
        } catch (e) {}
      }
    } catch (err) {
      console.warn('Error fetching products from Supabase, using local cache:', err);
    } finally {
      setLoading(false);
    }
  }, [business?.id, ensureBusiness, user?.id]);

  useEffect(() => {
    loadData();
    // Auto-open modal if navigated from onboarding checklist
    if (window.location.search.includes('action=new') || window.location.href.includes('action=new')) {
      handleOpenAdd();
    }
  }, [loadData]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setModalError('');
    setForm({
      name: '',
      description: '',
      price: '',
      currency: business?.currency || 'FCFA',
      category: 'Général',
      isAvailable: true,
      salesArguments: '',
      imageUrl: '',
      faqQuestion: '',
      faqAnswer: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (p) => {
    setEditingId(p.id);
    setModalError('');
    setForm({
      name: p.name,
      description: p.description,
      price: p.price,
      currency: p.currency || business?.currency || 'FCFA',
      category: p.category || 'Général',
      isAvailable: p.isAvailable,
      salesArguments: (p.salesArguments || []).join('\n'),
      imageUrl: p.imageUrl || '',
      faqQuestion: p.faqs?.[0]?.question || '',
      faqAnswer: p.faqs?.[0]?.answer || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Voulez-vous vraiment supprimer ce produit ?')) return;
    const bizId = business?.id || user?.id;
    try {
      setProducts(prev => {
        const next = prev.filter(p => p.id !== id);
        if (bizId) {
          try { localStorage.setItem('komiya_products_' + bizId, JSON.stringify(next)); } catch (e) {}
        }
        return next;
      });
      await deleteProduct(id);
      if (refreshUserData) {
        try { await refreshUserData(); } catch (e) {}
      }
    } catch (err) {
      console.error('Error deleting product:', err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setModalError('');

    if (!form.name.trim()) {
      setModalError("⚠️ Le nom du produit est requis.");
      setSaving(false);
      return;
    }

    if (!form.price || Number(form.price) < 0) {
      setModalError("⚠️ Veuillez renseigner un prix valide.");
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
    if (!bizId) {
      setModalError("⚠️ Session expirée. Veuillez vous reconnecter.");
      setSaving(false);
      return;
    }

    const argsArray = form.salesArguments.split('\n').map(s => s.trim()).filter(Boolean);
    const faqsArray = form.faqQuestion ? [{ question: form.faqQuestion, answer: form.faqAnswer }] : [];

    const productPayload = {
      name: form.name.trim(),
      description: form.description,
      price: Number(form.price),
      currency: form.currency,
      category: form.category,
      isAvailable: form.isAvailable,
      salesArguments: argsArray,
      imageUrl: form.imageUrl,
      faqs: faqsArray
    };

    // Optimistic local update so user is never blocked
    const tempId = editingId || 'local_' + Date.now();
    setProducts(prev => {
      let next;
      if (editingId) {
        next = prev.map(p => p.id === editingId ? { ...p, ...productPayload } : p);
      } else {
        next = [{ id: tempId, business_id: bizId, ...productPayload }, ...prev];
      }
      try {
        localStorage.setItem('komiya_products_' + bizId, JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    try {
      if (editingId) {
        await updateProduct(editingId, productPayload);
      } else {
        const created = await createProduct(bizId, productPayload);
        if (created?.id) {
          setProducts(prev => prev.map(p => p.id === tempId ? created : p));
        }
      }
      setShowModal(false);
      setJustAdded(true);
      if (refreshUserData) {
        try { await refreshUserData(); } catch (e) {}
      }
    } catch (err) {
      console.warn('Supabase product sync warning:', err);
      // Product was saved locally, so close modal and allow progress
      setShowModal(false);
      setJustAdded(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
            <Package className="w-5 h-5 text-emerald-500" />
            <span>Catalogue Produits & Services</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gérez vos offres commerciales réelles. Votre commercial IA utilise ces données exactes pour répondre aux prospects.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Ajouter un produit</span>
        </button>
      </div>

      {/* Onboarding Guidance Banner */}
      {(products.length > 0 || justAdded) && (
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs shrink-0">
              ✓ 3
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-900">Étape 3 validée : Catalogue produit prêt !</p>
              <p className="text-[11px] text-emerald-700">Vous avez {products.length} produit{products.length > 1 ? 's' : ''} configuré{products.length > 1 ? 's' : ''}. Dernière étape : activer l'IA.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('automations')}
                className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-sm flex items-center space-x-1"
              >
                <span>Étape 4 : Activer l'IA</span>
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

      {/* Loading state */}
      {loading && (
        <div className="text-center py-12">
          <RefreshCw className="w-6 h-6 animate-spin text-emerald-500 mx-auto mb-2" />
          <p className="text-xs text-slate-500">Chargement de votre catalogue...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && products.length === 0 && (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 font-bold text-xl">
            📦
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">Aucun produit dans votre catalogue</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
            Ajoutez votre premier produit ou service. L'assistant IA présentera ce produit avec son prix et ses arguments aux prospects sur WhatsApp.
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 inline-flex items-center space-x-2"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Ajouter mon premier produit</span>
          </button>
        </div>
      )}

      {/* Products Grid */}
      {!loading && products.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden hover:border-emerald-500/40 transition-all flex flex-col justify-between">
              <div>
                {p.imageUrl && (
                  <div className="h-44 w-full bg-slate-100 overflow-hidden relative">
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                    <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      p.isAvailable ? 'bg-emerald-500 text-slate-950' : 'bg-slate-700 text-white'
                    }`}>
                      {p.isAvailable ? 'Disponible' : 'Indisponible'}
                    </span>
                  </div>
                )}

                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
                        {p.category}
                      </span>
                      <h3 className="text-base font-extrabold text-slate-900 mt-1.5">{p.name}</h3>
                    </div>
                    <span className="text-base font-extrabold text-emerald-600 whitespace-nowrap">
                      {p.price.toLocaleString()} {p.currency}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{p.description}</p>

                  {p.salesArguments?.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Arguments de vente:</span>
                      <ul className="space-y-1">
                        {p.salesArguments.map((arg, idx) => (
                          <li key={idx} className="text-xs text-slate-700 flex items-center space-x-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            <span>{arg}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {p.faqs?.length > 0 && (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 text-xs space-y-1">
                      <p className="font-bold text-slate-800 flex items-center space-x-1">
                        <HelpCircle className="w-3.5 h-3.5 text-emerald-500" />
                        <span>FAQ: {p.faqs[0].question}</span>
                      </p>
                      <p className="text-slate-600 pl-4">{p.faqs[0].answer}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  onClick={() => handleOpenEdit(p)}
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CRUD Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900">
                {editingId ? 'Modifier le produit' : 'Ajouter un nouveau produit'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              {modalError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nom du produit / service</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Formation Facebook Ads"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Prix</label>
                  <input
                    type="number"
                    required
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    placeholder="50000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Devise</label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="FCFA">FCFA</option>
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description complète</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Décrivez votre produit ou service..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Arguments de vente (1 par ligne)</label>
                <textarea
                  rows={2}
                  value={form.salesArguments}
                  onChange={(e) => setForm({ ...form, salesArguments: e.target.value })}
                  placeholder="Accessible aux débutants&#10;Accompagnement 30 jours"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">URL de l'image (optionnel)</label>
                <input
                  type="text"
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20"
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
