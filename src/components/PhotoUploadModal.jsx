import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import { Upload, X, Image as ImageIcon, Calendar, MapPin, Tag, Users, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

const PhotoUploadModal = ({ isOpen, onClose, onUploadSuccess, setToast }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [eventId, setEventId] = useState('');
  const [nucleusId, setNucleusId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);

  const [events, setEvents] = useState([]);
  const [nuclei, setNuclei] = useState([]);
  const [members, setMembers] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadFormData();
    }
  }, [isOpen]);

  const loadFormData = async () => {
    try {
      const [eventsData, nucleiData, membersData] = await Promise.all([
        fetchApi('/api/events'),
        fetchApi('/api/nuclei'),
        fetchApi('/api/members')
      ]);
      if (eventsData.events) setEvents(eventsData.events);
      if (nucleiData.nuclei) setNuclei(nucleiData.nuclei);
      if (membersData.members) setMembers(membersData.members);
    } catch (err) {
      console.error('Erro ao carregar dados do formulário de upload:', err);
    }
  };

  const handleFileChange = (files) => {
    const validFiles = Array.from(files).filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
      return validTypes.includes(file.type);
    });

    if (validFiles.length < files.length) {
      setToast({ type: 'error', message: 'Formato de arquivo não suportado. Use JPG, JPEG, PNG, WEBP ou SVG.' });
    }

    const newFiles = [...selectedFiles, ...validFiles];
    setSelectedFiles(newFiles);

    // Create preview URLs
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    setPreviews([...previews, ...newPreviews]);
  };

  const removeFile = (index) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);

    const newPreviews = [...previews];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files);
    }
  };

  const toggleMemberSelect = (memberId) => {
    if (selectedMembers.includes(memberId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== memberId));
    } else {
      setSelectedMembers([...selectedMembers, memberId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      setToast({ type: 'error', message: 'Selecione pelo menos uma fotografia para enviar.' });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('photos', file);
      });

      if (eventId) formData.append('event_id', eventId);
      if (nucleusId) formData.append('nucleus_id', nucleusId);
      if (date) formData.append('date', date);
      if (location) formData.append('location', location);
      if (description) formData.append('description', description);
      if (tags) formData.append('tags', tags);
      if (selectedMembers.length > 0) formData.append('members', JSON.stringify(selectedMembers));

      const res = await fetchApi('/api/photos/upload', {
        method: 'POST',
        body: formData
      });

      setToast({ type: 'success', message: res.message || 'Fotos adicionadas com sucesso!' });
      resetForm();
      onClose();
      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Não foi possível enviar a imagem.' });
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    previews.forEach(url => URL.revokeObjectURL(url));
    setSelectedFiles([]);
    setPreviews([]);
    setEventId('');
    setNucleusId('');
    setDate(new Date().toISOString().split('T')[0]);
    setLocation('');
    setDescription('');
    setTags('');
    setSelectedMembers([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-base sm:text-lg">Adicionar Fotos à Galeria</h3>
              <p className="text-xs text-slate-500">Selecione uma ou mais imagens e defina suas informações</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/60">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Drag and Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
              dragActive ? 'border-amber-500 bg-amber-50/50 scale-[0.99]' : 'border-slate-300 hover:border-amber-400 bg-slate-50/50'
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
              <ImageIcon className="w-6 h-6" />
            </div>
            <p className="font-bold text-slate-800 text-sm mb-1">
              Arraste e solte suas fotos aqui
            </p>
            <p className="text-xs text-slate-500 mb-4">
              Suporta formatos JPG, JPEG, PNG, WEBP (até 25MB cada)
            </p>

            <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer shadow-md transition-all active:scale-95">
              <Upload className="w-4 h-4 text-amber-400" />
              Selecionar do Computador
              <input
                type="file"
                multiple
                accept="image/jpeg,image/jpg,image/png,image/webp,image/svg+xml"
                onChange={(e) => handleFileChange(e.target.files)}
                className="hidden"
              />
            </label>
          </div>

          {/* Selected Files Preview Grid */}
          {selectedFiles.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Fotos Selecionadas ({selectedFiles.length})
                </span>
                <button
                  type="button"
                  onClick={() => { setSelectedFiles([]); setPreviews([]); }}
                  className="text-xs text-rose-600 hover:underline font-semibold"
                >
                  Remover Todas
                </button>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 max-h-40 overflow-y-auto p-2 bg-slate-100/70 rounded-2xl border border-slate-200">
                {previews.map((preview, index) => (
                  <div key={index} className="relative aspect-square rounded-xl overflow-hidden group shadow-sm bg-white">
                    <img src={preview} alt="Pré-visualização" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full opacity-80 hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadata Assignment Fields */}
          <div className="border-t border-slate-200 pt-6 space-y-4">
            <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-600" />
              Informações e Organização Automática
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Núcleo Familiar */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Núcleo Familiar Relacionado
                </label>
                <select
                  value={nucleusId}
                  onChange={(e) => setNucleusId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="">Selecione um Núcleo Familiar (Opcional)</option>
                  {nuclei.map(n => (
                    <option key={n.id} value={n.id}>{n.name}</option>
                  ))}
                </select>
              </div>

              {/* Evento */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Evento Relacionado
                </label>
                <select
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="">Selecione um Evento (Opcional)</option>
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.name} ({ev.date})</option>
                  ))}
                </select>
              </div>

              {/* Data do Evento */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Data das Fotografias
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Local do Evento */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Localização / Cidade
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ex: Gramado - RS, Casa da Vovó"
                  className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Descrição ou História da Foto
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Conte brevemente o contexto deste momento..."
                rows={2}
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none"
              />
            </div>

            {/* Pessoas Presentes (Tagging members) */}
            {members.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  Marcar Pessoas Presentes nas Fotos:
                </label>
                <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {members.map(m => {
                    const isSelected = selectedMembers.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleMemberSelect(m.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                            : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        {m.name}
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-slate-950" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tags */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-500" />
                Tags (separadas por vírgula)
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Ex: niver, bolo, praia, ferias"
                className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/70 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={uploading || selectedFiles.length === 0}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:pointer-events-none transition-all flex items-center gap-2"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin"></div>
                Enviando Fotos...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Confirmar e Salvar Fotos ({selectedFiles.length})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhotoUploadModal;
