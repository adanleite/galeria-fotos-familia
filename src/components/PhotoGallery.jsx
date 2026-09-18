import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import {
  Camera,
  Search,
  Filter,
  CheckSquare,
  Square,
  Trash2,
  FolderInput,
  Image as ImageIcon,
  Calendar,
  Building2,
  Users,
  Grid,
  List,
  Sparkles,
  Plus
} from 'lucide-react';
import ConfirmModal from './ConfirmModal';

const PhotoGallery = ({ onOpenPhoto, onOpenUpload, setToast }) => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNucleus, setSelectedNucleus] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [nucleiList, setNucleiList] = useState([]);
  const [eventsList, setEventsList] = useState([]);

  // Bulk actions state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showBulkMoveModal, setShowBulkMoveModal] = useState(false);
  const [targetMoveEvent, setTargetMoveEvent] = useState('');
  const [targetMoveNucleus, setTargetMoveNucleus] = useState('');

  const loadPhotos = async () => {
    try {
      setLoading(true);
      let query = '/api/photos?limit=200';
      if (searchTerm) query += `&search=${encodeURIComponent(searchTerm)}`;
      if (selectedNucleus) query += `&nucleus_id=${selectedNucleus}`;
      if (selectedEvent) query += `&event_id=${selectedEvent}`;

      const data = await fetchApi(query);
      setPhotos(data.photos || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadFilterOptions = async () => {
    try {
      const [nData, eData] = await Promise.all([
        fetchApi('/api/nuclei'),
        fetchApi('/api/events')
      ]);
      if (nData.nuclei) setNucleiList(nData.nuclei);
      if (eData.events) setEventsList(eData.events);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadFilterOptions();
  }, []);

  useEffect(() => {
    loadPhotos();
  }, [searchTerm, selectedNucleus, selectedEvent]);

  const toggleSelectPhoto = (id) => {
    if (selectedPhotoIds.includes(id)) {
      setSelectedPhotoIds(selectedPhotoIds.filter(item => item !== id));
    } else {
      setSelectedPhotoIds([...selectedPhotoIds, id]);
    }
  };

  const selectAll = () => {
    if (selectedPhotoIds.length === photos.length) {
      setSelectedPhotoIds([]);
    } else {
      setSelectedPhotoIds(photos.map(p => p.id));
    }
  };

  const handleBulkDelete = async () => {
    try {
      const res = await fetchApi('/api/photos/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ ids: selectedPhotoIds })
      });
      setToast({ type: 'success', message: res.message || 'Fotos excluídas com sucesso!' });
      setSelectedPhotoIds([]);
      setSelectionMode(false);
      setShowBulkDeleteConfirm(false);
      loadPhotos();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Erro ao excluir fotos.' });
    }
  };

  const handleBulkMove = async () => {
    try {
      const res = await fetchApi('/api/photos/bulk-move', {
        method: 'POST',
        body: JSON.stringify({
          ids: selectedPhotoIds,
          event_id: targetMoveEvent || null,
          nucleus_id: targetMoveNucleus || null
        })
      });
      setToast({ type: 'success', message: res.message || 'Fotos movidas com sucesso!' });
      setSelectedPhotoIds([]);
      setSelectionMode(false);
      setShowBulkMoveModal(false);
      loadPhotos();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Erro ao mover fotos.' });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header & Filter Controls */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
              <Camera className="w-6 h-6 text-amber-600" />
              Galeria Principal de Fotografias
            </h2>
            <p className="text-xs text-slate-500">
              Total de {photos.length} foto(s) no acervo
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectionMode(!selectionMode);
                setSelectedPhotoIds([]);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
                selectionMode
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              {selectionMode ? 'Cancelar Seleção' : 'Selecionar Fotos'}
            </button>

            <button
              onClick={onOpenUpload}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Adicionar Fotos
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por título, tag ou local..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Filter Nucleus */}
          <select
            value={selectedNucleus}
            onChange={(e) => setSelectedNucleus(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">Todos os Núcleos Familiares</option>
            {nucleiList.map(n => (
              <option key={n.id} value={n.id}>{n.name}</option>
            ))}
          </select>

          {/* Filter Event */}
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">Todos os Eventos</option>
            {eventsList.map(ev => (
              <option key={ev.id} value={ev.id}>{ev.name}</option>
            ))}
          </select>
        </div>

        {/* Bulk Action Bar when selectionMode active */}
        {selectionMode && (
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl flex items-center justify-between text-xs animate-fade-in">
            <div className="flex items-center gap-3">
              <button
                onClick={selectAll}
                className="font-bold text-slate-800 flex items-center gap-1.5 hover:underline"
              >
                {selectedPhotoIds.length === photos.length ? <CheckSquare className="w-4 h-4 text-amber-600" /> : <Square className="w-4 h-4 text-slate-400" />}
                {selectedPhotoIds.length === photos.length ? 'Desmarcar Todas' : 'Selecionar Todas'}
              </button>
              <span className="text-slate-600 font-medium">
                ({selectedPhotoIds.length} foto(s) selecionada(s))
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBulkMoveModal(true)}
                disabled={selectedPhotoIds.length === 0}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl disabled:opacity-50 flex items-center gap-1"
              >
                <FolderInput className="w-4 h-4 text-sky-600" />
                Mover Seleção
              </button>
              <button
                onClick={() => setShowBulkDeleteConfirm(true)}
                disabled={selectedPhotoIds.length === 0}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl disabled:opacity-50 flex items-center gap-1 shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
                Excluir Seleção
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Photos Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
            <div key={n} className="bg-slate-200 animate-pulse rounded-2xl aspect-[4/3]"></div>
          ))}
        </div>
      ) : photos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => {
            const isSelected = selectedPhotoIds.includes(photo.id);
            return (
              <div
                key={photo.id}
                onClick={() => {
                  if (selectionMode) {
                    toggleSelectPhoto(photo.id);
                  } else {
                    onOpenPhoto(photo, photos);
                  }
                }}
                className={`group relative bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer ${
                  isSelected ? 'ring-4 ring-amber-500 border-amber-500' : 'border-slate-200/80 hover:border-amber-300'
                }`}
              >
                {/* Checkbox overlay if selection mode */}
                {selectionMode && (
                  <div className="absolute top-3 left-3 z-20">
                    <div className={`p-1.5 rounded-lg backdrop-blur-md ${isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-900/60 text-white'}`}>
                      {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                    </div>
                  </div>
                )}

                {/* Thumbnail Image */}
                <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100 relative">
                  <img
                    src={photo.thumbnail_path}
                    alt={photo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
                </div>

                {/* Info Card Body */}
                <div className="p-3">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-800 line-clamp-1 group-hover:text-amber-700 transition-colors">
                    {photo.title || 'Fotografia'}
                  </h4>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5 pt-1.5 border-t border-slate-100">
                    <span className="truncate max-w-[120px] font-medium text-slate-600">
                      {photo.nucleus_name || 'Geral'}
                    </span>
                    <span>
                      {photo.date ? new Date(photo.date + 'T00:00:00').toLocaleDateString('pt-BR') : ''}
                    </span>
                  </div>

                  {photo.event_name && (
                    <span className="inline-block mt-1 px-2 py-0.5 bg-sky-50 text-sky-700 font-semibold text-[10px] rounded">
                      {photo.event_name}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State Screen */
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-sm max-w-lg mx-auto">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-extrabold text-slate-800 mb-1">Nenhuma foto encontrada</h3>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            Não encontramos fotografias correspondentes aos filtros selecionados. Comece adicionando novas fotos à galeria.
          </p>
          <button
            onClick={onOpenUpload}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow-md"
          >
            Adicionar Fotos
          </button>
        </div>
      )}

      {/* Bulk Delete Confirm Modal */}
      <ConfirmModal
        isOpen={showBulkDeleteConfirm}
        title="Excluir Múltiplas Fotos"
        message={`Tem certeza de que deseja excluir ${selectedPhotoIds.length} foto(s) selecionada(s)? Esta ação é permanente.`}
        confirmText="Excluir Todas"
        cancelText="Cancelar"
        onConfirm={handleBulkDelete}
        onCancel={() => setShowBulkDeleteConfirm(false)}
        isDanger={true}
      />

      {/* Bulk Move Modal */}
      {showBulkMoveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-slate-800 shadow-2xl">
            <h3 className="font-bold text-base mb-2">Mover {selectedPhotoIds.length} foto(s) selecionada(s)</h3>
            <p className="text-xs text-slate-500 mb-4">Escolha o novo evento ou núcleo familiar para estas fotos:</p>

            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Novo Núcleo Familiar</label>
                <select
                  value={targetMoveNucleus}
                  onChange={(e) => setTargetMoveNucleus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                >
                  <option value="">Manter Atual / Nenhum</option>
                  {nucleiList.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Novo Evento</label>
                <select
                  value={targetMoveEvent}
                  onChange={(e) => setTargetMoveEvent(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                >
                  <option value="">Manter Atual / Nenhum</option>
                  {eventsList.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowBulkMoveModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleBulkMove}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl"
              >
                Confirmar Mudança
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoGallery;
