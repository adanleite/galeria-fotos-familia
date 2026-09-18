import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import { Search, Filter, RotateCcw, Camera, Calendar, Users, MapPin, Tag } from 'lucide-react';

const AdvancedSearch = ({ onOpenPhoto, setToast }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [nucleusId, setNucleusId] = useState('');
  const [eventId, setEventId] = useState('');
  const [memberId, setMemberId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');
  const [location, setLocation] = useState('');
  const [tag, setTag] = useState('');

  const [nuclei, setNuclei] = useState([]);
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [categories, setCategories] = useState([]);

  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    loadFilterData();
  }, []);

  const loadFilterData = async () => {
    try {
      const [nRes, eRes, mRes, cRes] = await Promise.all([
        fetchApi('/api/nuclei'),
        fetchApi('/api/events'),
        fetchApi('/api/members'),
        fetchApi('/api/events/categories')
      ]);
      if (nRes.nuclei) setNuclei(nRes.nuclei);
      if (eRes.events) setEvents(eRes.events);
      if (mRes.members) setMembers(mRes.members);
      if (cRes.categories) setCategories(cRes.categories);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setHasSearched(true);

    try {
      let query = '/api/photos?limit=200';
      if (searchTerm) query += `&search=${encodeURIComponent(searchTerm)}`;
      if (nucleusId) query += `&nucleus_id=${nucleusId}`;
      if (eventId) query += `&event_id=${eventId}`;
      if (memberId) query += `&member_id=${memberId}`;
      if (categoryId) query += `&category_id=${categoryId}`;
      if (dateStart) query += `&date_start=${dateStart}`;
      if (dateEnd) query += `&date_end=${dateEnd}`;
      if (location) query += `&location=${encodeURIComponent(location)}`;
      if (tag) query += `&tag=${encodeURIComponent(tag)}`;

      const res = await fetchApi(query);
      setPhotos(res.photos || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setNucleusId('');
    setEventId('');
    setMemberId('');
    setCategoryId('');
    setDateStart('');
    setDateEnd('');
    setLocation('');
    setTag('');
    setPhotos([]);
    setHasSearched(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm">
        <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
          <Search className="w-6 h-6 text-purple-600" />
          Pesquisa Avançada no Acervo
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Combine múltiplos critérios para localizar qualquer fotografia instantaneamente
        </p>
      </div>

      {/* Filter Panel Form */}
      <form onSubmit={handleSearch} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs sm:text-sm">
          {/* Termo Geral */}
          <div className="sm:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1">Palavra-chave ou Título</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ex: bolo de aniversário, praia, viagem..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Núcleo Familiar */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Núcleo Familiar</label>
            <select
              value={nucleusId}
              onChange={(e) => setNucleusId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
            >
              <option value="">Todos os Núcleos</option>
              {nuclei.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
            </select>
          </div>

          {/* Evento */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Evento</label>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
            >
              <option value="">Todos os Eventos</option>
              {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
            </select>
          </div>

          {/* Pessoa Presente */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Pessoa Presente</label>
            <select
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
            >
              <option value="">Todas as Pessoas</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>

          {/* Categoria do Evento */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Categoria do Evento</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
            >
              <option value="">Todas as Categorias</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Data Inicial */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Data Inicial</label>
            <input
              type="date"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
            />
          </div>

          {/* Data Final */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Data Final</label>
            <input
              type="date"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
            />
          </div>

          {/* Local */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Localização</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ex: Gramado, São Paulo..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
            />
          </div>

          {/* Tag */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Tag Específica</label>
            <input
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="Ex: niver, praia..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleClearFilters}
            className="px-4 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Limpar Filtros
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs sm:text-sm shadow-md flex items-center gap-2 transition-all active:scale-95"
          >
            <Search className="w-4 h-4" />
            {loading ? 'Pesquisando...' : 'Pesquisar Fotos'}
          </button>
        </div>
      </form>

      {/* Results Grid */}
      {hasSearched && (
        <div className="space-y-4">
          <h3 className="font-extrabold text-slate-800 text-base">
            Resultados da Pesquisa ({photos.length} foto(s) encontrada(s))
          </h3>

          {photos.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map(p => (
                <div
                  key={p.id}
                  onClick={() => onOpenPhoto(p, photos)}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md cursor-pointer group transition-all"
                >
                  <div className="aspect-[4/3] w-full bg-slate-100 relative overflow-hidden">
                    <img src={p.thumbnail_path} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                  <div className="p-3">
                    <h4 className="font-bold text-xs text-slate-800 line-clamp-1">{p.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {p.date ? new Date(p.date + 'T00:00:00').toLocaleDateString('pt-BR') : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 max-w-md mx-auto">
              <p className="font-bold text-slate-800 text-sm mb-1">Não encontramos nenhuma foto com esses filtros.</p>
              <p className="text-xs text-slate-500">Tente ajustar ou limpar os filtros de busca.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;
