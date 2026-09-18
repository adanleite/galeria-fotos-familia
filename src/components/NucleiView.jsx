import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import { Users, Plus, Camera, Calendar, UserCheck, X, FileText, Sparkles } from 'lucide-react';

const NucleiView = ({ onOpenPhoto, setToast }) => {
  const [nuclei, setNuclei] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal creation state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [saving, setSaving] = useState(false);

  // Selected nucleus detail state
  const [selectedNucleus, setSelectedNucleus] = useState(null);
  const [nucleusDetails, setNucleusDetails] = useState({ members: [], events: [], photos: [] });

  const loadNuclei = async () => {
    try {
      setLoading(true);
      const data = await fetchApi('/api/nuclei');
      if (data.nuclei) setNuclei(data.nuclei);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNuclei();
  }, []);

  const openNucleusDetail = async (nuc) => {
    setSelectedNucleus(nuc);
    try {
      const data = await fetchApi(`/api/nuclei/${nuc.id}`);
      setNucleusDetails({
        members: data.members || [],
        events: data.events || [],
        photos: data.photos || []
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateNucleus = async (e) => {
    e.preventDefault();
    if (!name) {
      setToast({ type: 'error', message: 'O nome do núcleo familiar é obrigatório.' });
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      if (description) formData.append('description', description);
      if (coverFile) formData.append('cover', coverFile);

      const res = await fetchApi('/api/nuclei', {
        method: 'POST',
        body: formData
      });

      setToast({ type: 'success', message: res.message || 'Núcleo familiar criado com sucesso!' });
      setShowCreateModal(false);
      resetForm();
      loadNuclei();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Erro ao criar núcleo familiar.' });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setCoverFile(null);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            Núcleos Familiares
          </h2>
          <p className="text-xs text-slate-500">
            Organize os acervos por ramos e linhagens familiares
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Núcleo Familiar
        </button>
      </div>

      {/* Nuclei Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[1, 2].map(n => <div key={n} className="bg-slate-200 animate-pulse h-56 rounded-3xl"></div>)}
        </div>
      ) : nuclei.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {nuclei.map((nuc) => (
            <div
              key={nuc.id}
              onClick={() => openNucleusDetail(nuc)}
              className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between"
            >
              {/* Cover Header */}
              <div className="aspect-[21/9] w-full bg-slate-900 relative overflow-hidden">
                {nuc.cover_url ? (
                  <img src={nuc.cover_url} alt={nuc.name} className="w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-emerald-800 text-emerald-100">
                    <Users className="w-12 h-12 opacity-40" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                
                <div className="absolute bottom-4 left-6 right-6 text-white">
                  <h3 className="font-extrabold text-xl text-white group-hover:text-amber-300 transition-colors">
                    {nuc.name}
                  </h3>
                </div>
              </div>

              {/* Nucleus Info Body */}
              <div className="p-6 space-y-4">
                {nuc.description && (
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {nuc.description}
                  </p>
                )}

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="block text-base font-extrabold text-slate-900">{nuc.member_count || 0}</span>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">Membros</span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="block text-base font-extrabold text-slate-900">{nuc.event_count || 0}</span>
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">Eventos</span>
                  </div>
                  <div className="bg-amber-50 p-2 rounded-xl">
                    <span className="block text-base font-extrabold text-amber-700">{nuc.photo_count || 0}</span>
                    <span className="text-[10px] font-bold text-amber-700 uppercase">Fotos</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-md mx-auto">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base mb-1">Nenhum núcleo familiar</h3>
          <p className="text-xs text-slate-500 mb-4">Crie o primeiro núcleo familiar para agrupar fotos e pessoas.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl"
          >
            Cadastrar Núcleo
          </button>
        </div>
      )}

      {/* Create Nucleus Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                Criar Núcleo Familiar
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNucleus} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome do Núcleo Familiar *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Família Ribeiro"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descrição do Núcleo</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Histórico ou ramificação da família..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Foto de Capa do Núcleo (Opcional)</label>
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
                  {saving ? 'Criando...' : 'Salvar Núcleo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Nucleus Detail View Modal */}
      {selectedNucleus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden my-auto">
            {/* Header Cover */}
            <div className="relative h-48 bg-slate-900 overflow-hidden flex-shrink-0">
              {selectedNucleus.cover_url && (
                <img src={selectedNucleus.cover_url} alt={selectedNucleus.name} className="w-full h-full object-cover opacity-60" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent"></div>
              
              <button
                onClick={() => setSelectedNucleus(null)}
                className="absolute top-4 right-4 p-2 bg-slate-900/80 hover:bg-slate-800 text-white rounded-xl z-20"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute bottom-4 left-6 right-6 z-10 text-white">
                <h2 className="text-2xl font-extrabold text-white">{selectedNucleus.name}</h2>
                <p className="text-xs text-slate-300 mt-1">{selectedNucleus.description}</p>
              </div>
            </div>

            {/* Nucleus Tabs / Content */}
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              {/* Members */}
              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-3">Membros Cadastrados ({nucleusDetails.members.length})</h4>
                <div className="flex flex-wrap gap-2">
                  {nucleusDetails.members.map(m => (
                    <span key={m.id} className="px-3 py-1.5 bg-slate-100 text-slate-700 font-medium text-xs rounded-xl flex items-center gap-2">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                      {m.name}
                    </span>
                  ))}
                  {nucleusDetails.members.length === 0 && (
                    <p className="text-xs text-slate-500 italic">Nenhum membro cadastrado neste núcleo.</p>
                  )}
                </div>
              </div>

              {/* Photos Gallery */}
              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-3">Fotografias do Núcleo ({nucleusDetails.photos.length})</h4>
                {nucleusDetails.photos.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {nucleusDetails.photos.map(p => (
                      <div
                        key={p.id}
                        onClick={() => onOpenPhoto(p, nucleusDetails.photos)}
                        className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 relative group cursor-pointer border border-slate-200"
                      >
                        <img src={p.thumbnail_path} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">Nenhuma foto vinculada a este núcleo ainda.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NucleiView;
