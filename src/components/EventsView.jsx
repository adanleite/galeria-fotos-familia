import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import { Calendar, Plus, MapPin, Clock, Users, Camera, X, Image as ImageIcon, Sparkles } from 'lucide-react';

const EventsView = ({ onOpenPhoto, setToast }) => {
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [nuclei, setNuclei] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);

  // Event modal creation state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [nucleusId, setNucleusId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [saving, setSaving] = useState(false);

  // Selected event detail view
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventPhotos, setEventPhotos] = useState([]);

  const loadData = async () => {
    try {
      setLoading(true);
      let query = '/api/events';
      if (selectedCategory) query += `?category_id=${selectedCategory}`;

      const [eventsData, catData, nucData] = await Promise.all([
        fetchApi(query),
        fetchApi('/api/events/categories'),
        fetchApi('/api/nuclei')
      ]);

      if (eventsData.events) setEvents(eventsData.events);
      if (catData.categories) setCategories(catData.categories);
      if (nucData.nuclei) setNuclei(nucData.nuclei);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const openEventDetail = async (evt) => {
    setSelectedEvent(evt);
    try {
      const data = await fetchApi(`/api/events/${evt.id}`);
      setEventPhotos(data.photos || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!name) {
      setToast({ type: 'error', message: 'O nome do evento é obrigatório.' });
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      if (categoryId) formData.append('category_id', categoryId);
      if (nucleusId) formData.append('nucleus_id', nucleusId);
      if (date) formData.append('date', date);
      if (location) formData.append('location', location);
      if (description) formData.append('description', description);
      if (coverFile) formData.append('cover', coverFile);

      const res = await fetchApi('/api/events', {
        method: 'POST',
        body: formData
      });

      setToast({ type: 'success', message: res.message || 'Evento criado com sucesso!' });
      setShowCreateModal(false);
      resetForm();
      loadData();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Erro ao criar evento.' });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setName('');
    setCategoryId('');
    setNucleusId('');
    setDate(new Date().toISOString().split('T')[0]);
    setLocation('');
    setDescription('');
    setCoverFile(null);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-sky-600" />
            Organização por Eventos
          </h2>
          <p className="text-xs text-slate-500">
            Aniversários, casamentos, viagens e celebrações em família
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Evento
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            selectedCategory === ''
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Todas as Categorias
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              selectedCategory === cat.id
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Events Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4].map(n => <div key={n} className="bg-slate-200 animate-pulse h-48 rounded-2xl"></div>)}
        </div>
      ) : events.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((evt) => (
            <div
              key={evt.id}
              onClick={() => openEventDetail(evt)}
              className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between"
            >
              {/* Event Cover */}
              <div className="aspect-[16/9] w-full bg-slate-100 relative overflow-hidden">
                {evt.cover_url ? (
                  <img src={evt.cover_url} alt={evt.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-sky-50 text-sky-400">
                    <Calendar className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute top-3 left-3 bg-slate-950/70 backdrop-blur-md px-3 py-1 rounded-full text-white text-[11px] font-bold">
                  {evt.category_name || 'Evento'}
                </div>
                <div className="absolute bottom-3 right-3 bg-amber-500 text-slate-950 px-2.5 py-1 rounded-full text-[11px] font-extrabold shadow-md flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5" />
                  {evt.photo_count || 0} fotos
                </div>
              </div>

              {/* Event Info */}
              <div className="p-5">
                <h3 className="font-extrabold text-slate-800 text-base group-hover:text-amber-700 transition-colors line-clamp-1 mb-2">
                  {evt.name}
                </h3>
                {evt.description && (
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
                    {evt.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {evt.date ? new Date(evt.date + 'T00:00:00').toLocaleDateString('pt-BR') : 'Sem data'}
                  </span>
                  {evt.nucleus_name && (
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <Users className="w-3.5 h-3.5 text-emerald-600" />
                      {evt.nucleus_name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-md mx-auto">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base mb-1">Nenhum evento cadastrado</h3>
          <p className="text-xs text-slate-500 mb-4">Crie eventos para agrupar fotografias de datas comemorativas.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl"
          >
            Criar Primeiro Evento
          </button>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <Calendar className="w-5 h-5 text-sky-600" />
                Criar Novo Evento
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome do Evento *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Aniversário da Vovó 2026"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Categoria</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
                  >
                    <option value="">Selecione...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Núcleo Familiar</label>
                  <select
                    value={nucleusId}
                    onChange={(e) => setNucleusId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
                  >
                    <option value="">Selecione...</option>
                    {nuclei.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Data do Evento</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Localização</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Ex: Sítio São José"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descrição</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalhes sobre este evento..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Foto de Capa do Evento (Opcional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCoverFile(e.target.files[0])}
                  className="w-full text-xs text-slate-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-md"
                >
                  {saving ? 'Criando...' : 'Salvar Evento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Selected Event Detail Modal & Photo Gallery */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden my-auto">
            {/* Header / Cover */}
            <div className="relative h-48 bg-slate-900 overflow-hidden flex-shrink-0">
              {selectedEvent.cover_url && (
                <img src={selectedEvent.cover_url} alt={selectedEvent.name} className="w-full h-full object-cover opacity-50" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent"></div>
              
              <button
                onClick={() => setSelectedEvent(null)}
                className="absolute top-4 right-4 p-2 bg-slate-900/80 hover:bg-slate-800 text-white rounded-xl z-20"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute bottom-4 left-6 right-6 z-10 text-white">
                <span className="px-2.5 py-0.5 bg-amber-500 text-slate-950 text-[10px] font-bold uppercase rounded mb-2 inline-block">
                  {selectedEvent.category_name || 'Evento'}
                </span>
                <h2 className="text-2xl font-extrabold text-white">{selectedEvent.name}</h2>
                <p className="text-xs text-slate-300 mt-1 flex items-center gap-4">
                  <span>📅 {selectedEvent.date ? new Date(selectedEvent.date + 'T00:00:00').toLocaleDateString('pt-BR') : 'Sem data'}</span>
                  {selectedEvent.location && <span>📍 {selectedEvent.location}</span>}
                  {selectedEvent.nucleus_name && <span>👨‍👩‍👧‍👦 {selectedEvent.nucleus_name}</span>}
                </p>
              </div>
            </div>

            {/* Event Photos Grid */}
            <div className="p-6 flex-1 overflow-y-auto space-y-4">
              <h4 className="font-bold text-slate-800 text-sm">Fotografias do Evento ({eventPhotos.length})</h4>
              {eventPhotos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {eventPhotos.map(p => (
                    <div
                      key={p.id}
                      onClick={() => onOpenPhoto(p, eventPhotos)}
                      className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 relative group cursor-pointer border border-slate-200"
                    >
                      <img src={p.thumbnail_path} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic py-6 text-center">Nenhuma foto vinculada a este evento ainda.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventsView;
