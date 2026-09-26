import React, { useState } from 'react';
import { Package, Plus, Trash2, Edit, CheckCircle2, HelpCircle, Sparkles, X } from 'lucide-react';

export default function Products({ state, onUpdateState }) {
  const [products, setProducts] = useState([...state.products]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    currency: 'FCFA',
    category: 'Général',
    isAvailable: true,
    salesArguments: '',
    imageUrl: '',
    faqQuestion: '',
    faqAnswer: ''
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({
      name: '',
      description: '',
      price: '',
      currency: 'FCFA',
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
    setForm({
      name: p.name,
      description: p.description,
      price: p.price,
      currency: p.currency || 'FCFA',
      category: p.category || 'Général',
      isAvailable: p.isAvailable,
      salesArguments: (p.salesArguments || []).join('\n'),
      imageUrl: p.imageUrl || '',
      faqQuestion: p.faqs?.[0]?.question || '',
      faqAnswer: p.faqs?.[0]?.answer || ''
    });
    setShowModal(true);
  };

  const handleDelete = (id) => {
    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    onUpdateState({ products: updated });
  };

  const handleSave = (e) => {
    e.preventDefault();
    const argsArray = form.salesArguments.split('\n').map(s => s.trim()).filter(Boolean);
    const faqsArray = form.faqQuestion ? [{ question: form.faqQuestion, answer: form.faqAnswer }] : [];

    let updated;
    if (editingId) {
      updated = products.map(p => p.id === editingId ? {
        ...p,
        name: form.name,
        description: form.description,
        price: Number(form.price),
        currency: form.currency,
        category: form.category,
        isAvailable: form.isAvailable,
        salesArguments: argsArray,
        imageUrl: form.imageUrl,
        faqs: faqsArray
      } : p);
    } else {
      const newProduct = {
        id: `prod_${Date.now()}`,
        name: form.name,
        description: form.description,
        price: Number(form.price),
        currency: form.currency,
        category: form.category,
        isAvailable: form.isAvailable,
        salesArguments: argsArray,
        imageUrl: form.imageUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500&auto=format&fit=crop&q=60',
        faqs: faqsArray
      };
      updated = [...products, newProduct];
    }

    setProducts(updated);
    onUpdateState({ products: updated });
    setShowModal(false);
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
            Gérez vos offres commerciales. L'assistant IA Awa utilise ces données exactes pour répondre aux prospects.
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

      {/* Products Grid */}
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
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
