import React, { useState, useEffect, useCallback } from 'react';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  UserCheck, 
  PauseCircle, 
  PlayCircle, 
  Tag, 
  StickyNote, 
  Phone, 
  MapPin, 
  DollarSign, 
  CheckCircle2, 
  Sparkles,
  Search,
  Check,
  RefreshCw,
  ArrowUpRight
} from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { 
  getConversations, 
  getMessages, 
  createMessage, 
  toggleConversationAI,
  updateContactStatus,
  getConversationNotes,
  addConversationNote,
  getTags,
  createTag
} from '../lib/supabaseClient';

export default function Conversations({ onNavigate }) {
  const { business, user } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [selectedConvId, setSelectedConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [notes, setNotes] = useState([]);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Fetch conversations for this business
  const loadConversations = useCallback(async () => {
    if (!business?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getConversations(business.id);
      setConversations(data);
      if (data.length > 0 && !selectedConvId) {
        setSelectedConvId(data[0].id);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  }, [business?.id, selectedConvId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // 2. Fetch messages & notes for selected conversation
  useEffect(() => {
    if (!selectedConvId) {
      setMessages([]);
      setNotes([]);
      return;
    }

    let isCurrent = true;
    setMessagesLoading(true);

    Promise.all([
      getMessages(selectedConvId).catch(() => []),
      getConversationNotes(selectedConvId).catch(() => []),
      business?.id ? getTags(business.id).catch(() => []) : []
    ]).then(([msgs, nts, tgs]) => {
      if (isCurrent) {
        setMessages(msgs);
        setNotes(nts);
        setTags(tgs.map(t => t.name));
        setMessagesLoading(false);
      }
    });

    return () => { isCurrent = false; };
  }, [selectedConvId, business?.id]);

  const selectedConv = conversations.find(c => c.id === selectedConvId) || conversations[0] || null;
  const selectedContact = selectedConv?.contact || null;

  const handleToggleAI = async () => {
    if (!selectedConv) return;
    const nextState = !selectedConv.isAiActive;
    try {
      await toggleConversationAI(selectedConv.id, nextState);
      setConversations(prev => prev.map(c => c.id === selectedConv.id ? { ...c, isAiActive: nextState } : c));
    } catch (err) {
      console.error('Error toggling AI:', err);
    }
  };

  const handleMarkQualified = async () => {
    if (!selectedContact?.id) return;
    try {
      await updateContactStatus(selectedContact.id, 'Qualifié', 90);
      setConversations(prev => prev.map(c => {
        if (c.id === selectedConvId && c.contact) {
          return { ...c, contact: { ...c.contact, status: 'Qualifié', score: 90 } };
        }
        return c;
      }));
    } catch (err) {
      console.error('Error marking qualified:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !selectedConv) return;

    const textToSend = inputMessage.trim();
    setInputMessage('');

    try {
      // 1. Save to Supabase
      const savedMsg = await createMessage(selectedConv.id, {
        content: textToSend,
        direction: 'outbound',
        senderType: 'human'
      });
      setMessages(prev => [...prev, savedMsg]);

      // 2. Dispatch via WASender server endpoint
      if (selectedConv.whatsappNumber) {
        fetch('/api/wasender/send-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: selectedConv.whatsappNumber,
            text: textToSend
          })
        }).catch(err => console.warn('WASender outbound delivery error:', err));
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteInput.trim() || !selectedConv || !user?.id) return;
    const noteText = noteInput.trim();
    setNoteInput('');
    try {
      await addConversationNote(selectedConv.id, user.id, noteText);
      setNotes(prev => [...prev, noteText]);
    } catch (err) {
      console.error('Error saving note:', err);
    }
  };

  const handleAddTag = async (e) => {
    e.preventDefault();
    if (!tagInput.trim() || !business?.id) return;
    const tagText = tagInput.trim();
    setTagInput('');
    try {
      await createTag(business.id, tagText);
      setTags(prev => [...prev, tagText]);
    } catch (err) {
      console.error('Error adding tag:', err);
    }
  };

  const filteredConversations = conversations.filter(c => {
    const name = (c.contactName || '').toLowerCase();
    const phone = (c.whatsappNumber || '');
    return name.includes(searchTerm.toLowerCase()) || phone.includes(searchTerm);
  });

  if (loading) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-700">Chargement de votre messagerie WhatsApp...</p>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center shadow-sm max-w-2xl mx-auto my-8">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 font-bold text-2xl">
          💬
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">Aucune conversation active</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
          Votre boîte de réception est prête. Dès qu'un prospect enverra un message sur votre WhatsApp connecté, la conversation s'ouvrira automatiquement ici et votre commercial IA prendra le relais.
        </p>
        <button
          onClick={() => onNavigate('whatsapp')}
          className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 inline-flex items-center space-x-2"
        >
          <span>Vérifier ma connexion WhatsApp</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-6rem)] bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col lg:flex-row">
      
      {/* 1. LEFT PANE: Conversations List */}
      <div className="w-full lg:w-80 border-r border-slate-200 flex flex-col h-1/3 lg:h-full bg-slate-50">
        <div className="p-4 border-b border-slate-200 bg-white">
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
            <MessageCircle className="w-4 h-4 text-emerald-500" />
            <span>Discussion Inbox ({conversations.length})</span>
          </h2>
          <div className="relative mt-2">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher conversation..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filteredConversations.map((conv) => {
            const isSelected = conv.id === selectedConvId;
            return (
              <div
                key={conv.id}
                onClick={() => setSelectedConvId(conv.id)}
                className={`p-3.5 cursor-pointer transition-colors ${
                  isSelected ? 'bg-emerald-50/70 border-l-4 border-l-emerald-500' : 'hover:bg-slate-100/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-xs text-slate-900 truncate">{conv.contactName}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-slate-400 font-mono">{conv.whatsappNumber}</span>
                  {conv.isAiActive ? (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100/80 px-1.5 py-0.5 rounded">🤖 IA Active</span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-100/80 px-1.5 py-0.5 rounded">👤 Humain</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. CENTER PANE: Chat Stream */}
      <div className="flex-1 flex flex-col h-1/2 lg:h-full bg-slate-100/50 border-r border-slate-200">
        {/* Chat Header */}
        <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">{selectedConv?.contactName}</h3>
            <p className="text-xs text-slate-500 font-mono">{selectedConv?.whatsappNumber}</p>
          </div>

          {/* AI Toggle Button */}
          <button
            onClick={handleToggleAI}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm ${
              selectedConv?.isAiActive 
                ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300' 
                : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-emerald-500/20'
            }`}
          >
            {selectedConv?.isAiActive ? (
              <>
                <PauseCircle className="w-4 h-4" />
                <span>Prendre le contrôle (Pause IA)</span>
              </>
            ) : (
              <>
                <PlayCircle className="w-4 h-4" />
                <span>Reprendre par l'IA</span>
              </>
            )}
          </button>
        </div>

        {/* Message History */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {messagesLoading && (
            <div className="text-center py-6 text-xs text-slate-400">
              Chargement des messages...
            </div>
          )}

          {!messagesLoading && messages.length === 0 && (
            <div className="text-center py-10 text-xs text-slate-400">
              Aucun message dans cette conversation.
            </div>
          )}

          {!messagesLoading && messages.map((msg) => {
            const isUser = msg.direction === 'inbound';
            const isAI = msg.senderType === 'ai';
            return (
              <div key={msg.id} className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[75%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                  isUser 
                    ? 'bg-white text-slate-900 rounded-bl-none border border-slate-200' 
                    : isAI 
                      ? 'bg-emerald-500 text-slate-950 rounded-br-none font-medium border-r-4 border-r-emerald-700'
                      : 'bg-slate-900 text-white rounded-br-none'
                }`}>
                  <div className="flex items-center justify-between space-x-2 mb-1 opacity-80 text-[10px]">
                    <span className="font-bold">
                      {isUser ? selectedConv.contactName : isAI ? '🤖 Commercial IA' : '👤 Vous (Humain)'}
                    </span>
                    <span>{msg.timestamp}</span>
                  </div>
                  <p>{msg.content}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Send Input Bar */}
        <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Écrivez votre message WhatsApp..."
            className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            className="p-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl transition-colors"
          >
            <Send className="w-4 h-4 stroke-[2.5]" />
          </button>
        </form>
      </div>

      {/* 3. RIGHT PANE: Prospect Info & Controls */}
      <div className="w-full lg:w-80 bg-white p-4 space-y-4 overflow-y-auto">
        <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">
          Fiche Prospect CRM
        </h3>

        <div>
          <h4 className="font-extrabold text-sm text-slate-900">{selectedContact?.name || selectedConv?.contactName}</h4>
          <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedContact?.whatsappNumber || selectedConv?.whatsappNumber}</p>
        </div>

        {/* Quick Actions */}
        <div className="space-y-2">
          <button
            onClick={handleMarkQualified}
            className="w-full py-2 px-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl transition-colors flex items-center justify-center space-x-1.5"
          >
            <UserCheck className="w-4 h-4" />
            <span>Marquer comme qualifié</span>
          </button>
        </div>

        {/* Qualification Score */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-700">Score de qualification</span>
            <span className="font-extrabold text-emerald-600">{selectedContact?.score ?? 0} / 100</span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${selectedContact?.score ?? 0}%` }} />
          </div>
        </div>

        {/* Details */}
        <div className="space-y-2 text-xs text-slate-600">
          <p><strong className="text-slate-900">Statut:</strong> {selectedContact?.status || 'Nouveau'}</p>
          <p><strong className="text-slate-900">Besoin:</strong> {selectedContact?.need || 'En cours d\'identification'}</p>
          <p><strong className="text-slate-900">Budget:</strong> {selectedContact?.budget || 'Non spécifié'}</p>
          <p><strong className="text-slate-900">Localisation:</strong> {selectedContact?.location || 'Côte d\'Ivoire'}</p>
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-700 flex items-center space-x-1">
            <Tag className="w-3.5 h-3.5 text-emerald-500" />
            <span>Tags</span>
          </span>
          <div className="flex flex-wrap gap-1">
            {tags.map((t, idx) => (
              <span key={idx} className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-semibold border border-emerald-200">
                {t}
              </span>
            ))}
          </div>
          <form onSubmit={handleAddTag} className="flex gap-1">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Nouveau tag..."
              className="flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
            <button type="submit" className="px-2 py-1 bg-slate-900 text-white text-xs font-bold rounded-lg">+</button>
          </form>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-700 flex items-center space-x-1">
            <StickyNote className="w-3.5 h-3.5 text-amber-500" />
            <span>Notes internes</span>
          </span>
          <div className="space-y-1.5">
            {notes.map((n, idx) => (
              <div key={idx} className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 leading-relaxed">
                {n}
              </div>
            ))}
          </div>
          <form onSubmit={handleAddNote} className="space-y-1">
            <input
              type="text"
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="Ajouter une note..."
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
            <button type="submit" className="w-full py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg">
              Ajouter la note
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}
