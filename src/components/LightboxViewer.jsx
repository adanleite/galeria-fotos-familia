import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
  Trash2,
  Edit3,
  Calendar,
  MapPin,
  Users,
  Tag,
  Info,
  Maximize,
  Check,
  Building2,
  FileText
} from 'lucide-react';
import ConfirmModal from './ConfirmModal';

const LightboxViewer = ({ photo, photosList = [], onClose, onPhotoUpdated, onPhotoDeleted, setToast }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showInfo, setShowInfo] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editEventId, setEditEventId] = useState('');
  const [editNucleusId, setEditNucleusId] = useState('');

  const [events, setEvents] = useState([]);
  const [nuclei, setNuclei] = useState([]);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    if (photo && photosList.length > 0) {
      const idx = photosList.findIndex(p => p.id === photo.id);
      if (idx !== -1) setCurrentIndex(idx);
    }
  }, [photo, photosList]);

  const currentPhoto = photosList[currentIndex] || photo;

  useEffect(() => {
    if (currentPhoto) {
      setEditTitle(currentPhoto.title || '');
      setEditDescription(currentPhoto.description || '');
      setEditDate(currentPhoto.date || '');
      setEditLocation(currentPhoto.location || '');
      setEditTags(currentPhoto.tags || '');
      setEditEventId(currentPhoto.event_id || '');
      setEditNucleusId(currentPhoto.nucleus_id || '');
      setZoomLevel(1);
      setIsEditing(false);
    }
  }, [currentIndex, currentPhoto]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isEditing) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, photosList, isEditing]);

  const handleNext = () => {
    if (photosList.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % photosList.length);
  };

  const handlePrev = () => {
    if (photosList.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + photosList.length) % photosList.length);
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.5));

  const handleDownload = () => {
    if (!currentPhoto) return;
    const link = document.createElement('a');
    link.href = currentPhoto.filepath;
    link.download = currentPhoto.original_name || currentPhoto.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const startEdit = async () => {
    try {
      const [eventsData, nucleiData] = await Promise.all([
        fetchApi('/api/events'),
        fetchApi('/api/nuclei')
      ]);
      if (eventsData.events) setEvents(eventsData.events);
      if (nucleiData.nuclei) setNuclei(nucleiData.nuclei);
      setIsEditing(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setSavingEdit(true);

    try {
      await fetchApi(`/api/photos/${currentPhoto.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: editTitle,
          description: editDescription,
          date: editDate,
          location: editLocation,
          tags: editTags,
          event_id: editEventId || null,
          nucleus_id: editNucleusId || null
        })
      });

      setToast({ type: 'success', message: 'Informações da foto atualizadas com sucesso!' });
      setIsEditing(false);
      if (onPhotoUpdated) onPhotoUpdated();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Erro ao atualizar foto.' });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    try {
      await fetchApi(`/api/photos/${currentPhoto.id}`, { method: 'DELETE' });
      setToast({ type: 'success', message: 'Foto excluída com sucesso!' });
      setShowDeleteConfirm(false);
      if (onPhotoDeleted) onPhotoDeleted(currentPhoto.id);
      onClose();
    } catch (err) {
      setToast({ type: 'error', message: 'Erro ao excluir foto.' });
    }
  };

  if (!currentPhoto) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col lg:flex-row overflow-hidden animate-fade-in select-none">
      {/* Main Image Stage */}
      <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden p-4">
        {/* Top Controls Overlay */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between text-white pointer-events-auto">
          <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-semibold">
            <span>{currentIndex + 1} de {photosList.length || 1}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              className="p-2.5 bg-slate-900/80 hover:bg-slate-800 rounded-xl border border-slate-800 text-white transition-colors"
              title="Reduzir Zoom"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <button
              onClick={handleZoomIn}
              className="p-2.5 bg-slate-900/80 hover:bg-slate-800 rounded-xl border border-slate-800 text-white transition-colors"
              title="Aumentar Zoom"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <button
              onClick={handleDownload}
              className="p-2.5 bg-slate-900/80 hover:bg-slate-800 rounded-xl border border-slate-800 text-amber-400 transition-colors"
              title="Baixar Foto Original"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowInfo(!showInfo)}
              className={`p-2.5 rounded-xl border transition-colors ${
                showInfo ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-900/80 text-white border-slate-800'
              }`}
              title="Painel de Informações"
            >
              <Info className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2.5 bg-slate-900/80 hover:bg-rose-600 rounded-xl border border-slate-800 text-white transition-colors ml-2"
              title="Fechar Visualizador"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Display Image with Zoom */}
        <div className="w-full h-full flex items-center justify-center overflow-auto">
          <img
            src={currentPhoto.filepath}
            alt={currentPhoto.title}
            style={{ transform: `scale(${zoomLevel})` }}
            className="max-h-full max-w-full object-contain transition-transform duration-200 ease-out"
          />
        </div>

        {/* Navigation Arrows */}
        {photosList.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-slate-900/70 hover:bg-amber-500 hover:text-slate-950 text-white border border-slate-800 backdrop-blur-md transition-all shadow-xl"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-2xl bg-slate-900/70 hover:bg-amber-500 hover:text-slate-950 text-white border border-slate-800 backdrop-blur-md transition-all shadow-xl"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* Side Details Panel */}
      {showInfo && (
        <div className="w-full lg:w-96 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col h-auto lg:h-full text-slate-200 p-6 overflow-y-auto">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
            <h3 className="font-extrabold text-white text-base">Detalhes da Fotografia</h3>
            <div className="flex items-center gap-2">
              {!isEditing && (
                <>
                  <button
                    onClick={startEdit}
                    className="p-2 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-slate-800"
                    title="Editar Informações"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800"
                    title="Excluir Foto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {isEditing ? (
            /* Editing Form */
            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Título da Foto</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Descrição</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Data</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Localização</label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Núcleo Familiar</label>
                <select
                  value={editNucleusId}
                  onChange={(e) => setEditNucleusId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">Nenhum</option>
                  {nuclei.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Evento</label>
                <select
                  value={editEventId}
                  onChange={(e) => setEditEventId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="">Nenhum</option>
                  {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Tags</label>
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  Salvar
                </button>
              </div>
            </form>
          ) : (
            /* Details View Mode */
            <div className="space-y-6 flex-1 text-sm">
              <div>
                <h4 className="text-xl font-bold text-white mb-2 leading-tight">
                  {currentPhoto.title || 'Sem título'}
                </h4>
                {currentPhoto.description ? (
                  <p className="text-slate-300 text-xs leading-relaxed bg-slate-800/50 p-3 rounded-xl border border-slate-800">
                    {currentPhoto.description}
                  </p>
                ) : (
                  <p className="text-slate-500 text-xs italic">Nenhuma descrição cadastrada.</p>
                )}
              </div>

              <div className="space-y-3 text-xs">
                {currentPhoto.nucleus_name && (
                  <div className="flex items-center gap-3 text-slate-300">
                    <Building2 className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <div>
                      <span className="block text-[10px] text-slate-500 font-bold uppercase">Núcleo Familiar</span>
                      <span>{currentPhoto.nucleus_name}</span>
                    </div>
                  </div>
                )}

                {currentPhoto.event_name && (
                  <div className="flex items-center gap-3 text-slate-300">
                    <Calendar className="w-4 h-4 text-sky-400 flex-shrink-0" />
                    <div>
                      <span className="block text-[10px] text-slate-500 font-bold uppercase">Evento</span>
                      <span>{currentPhoto.event_name}</span>
                    </div>
                  </div>
                )}

                {currentPhoto.date && (
                  <div className="flex items-center gap-3 text-slate-300">
                    <Calendar className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <div>
                      <span className="block text-[10px] text-slate-500 font-bold uppercase">Data do Registro</span>
                      <span>{new Date(currentPhoto.date + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                )}

                {currentPhoto.location && (
                  <div className="flex items-center gap-3 text-slate-300">
                    <MapPin className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <div>
                      <span className="block text-[10px] text-slate-500 font-bold uppercase">Localização</span>
                      <span>{currentPhoto.location}</span>
                    </div>
                  </div>
                )}

                {currentPhoto.members && currentPhoto.members.length > 0 && (
                  <div className="pt-2 border-t border-slate-800">
                    <span className="block text-[10px] text-slate-500 font-bold uppercase mb-2 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-purple-400" />
                      Pessoas Presentes:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {currentPhoto.members.map(m => (
                        <span key={m.id} className="px-2.5 py-1 bg-slate-800 text-purple-300 rounded-lg text-xs font-medium">
                          {m.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {currentPhoto.tags && (
                  <div className="pt-2 border-t border-slate-800">
                    <span className="block text-[10px] text-slate-500 font-bold uppercase mb-2 flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5 text-amber-500" />
                      Tags:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {currentPhoto.tags.split(',').map((t, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded text-[11px]">
                          #{t.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirmation modal for delete */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Excluir Fotografia"
        message="Tem certeza de que deseja excluir esta foto permanentemente? Esta ação não pode ser desfeita."
        confirmText="Excluir Foto"
        cancelText="Cancelar"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        isDanger={true}
      />
    </div>
  );
};

export default LightboxViewer;
