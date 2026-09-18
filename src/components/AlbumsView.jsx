import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import { FolderHeart, Plus, Camera, X } from 'lucide-react';

const AlbumsView = ({ onOpenPhoto, setToast }) => {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [coverFile, setCoverFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [albumPhotos, setAlbumPhotos] = useState([]);

  const loadAlbums = async () => {
    try {
      setLoading(true);
      const res = await fetchApi('/api/albums');
      if (res.albums) setAlbums(res.albums);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlbums();
  }, []);

  const openAlbumDetail = async (album) => {
    setSelectedAlbum(album);
    try {
      const res = await fetchApi(`/api/albums/${album.id}`);
      setAlbumPhotos(res.photos || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateAlbum = async (e) => {
    e.preventDefault();
    if (!name) {
      setToast({ type: 'error', message: 'O nome do álbum é obrigatório.' });
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      if (description) formData.append('description', description);
      if (coverFile) formData.append('cover', coverFile);

      const res = await fetchApi('/api/albums', {
        method: 'POST',
        body: formData
      });

      setToast({ type: 'success', message: res.message || 'Álbum criado com sucesso!' });
      setShowCreateModal(false);
      setName('');
      setDescription('');
      setCoverFile(null);
      loadAlbums();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Erro ao criar álbum.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <FolderHeart className="w-6 h-6 text-rose-600" />
            Álbuns & Coleções Especiais
          </h2>
          <p className="text-xs text-slate-500">
            Coleções personalizadas agregando momentos de diferentes eventos
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Álbum
        </button>
      </div>

      {/* Albums Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map(n => <div key={n} className="bg-slate-200 animate-pulse h-48 rounded-3xl"></div>)}
        </div>
      ) : albums.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {albums.map((album) => (
            <div
              key={album.id}
              onClick={() => openAlbumDetail(album)}
              className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="aspect-[16/9] w-full bg-slate-900 relative overflow-hidden">
                {album.cover_url ? (
                  <img src={album.cover_url} alt={album.name} className="w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-rose-900/30 text-rose-400">
                    <FolderHeart className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute bottom-3 right-3 bg-rose-600 text-white px-3 py-1 rounded-full text-[11px] font-extrabold shadow">
                  {album.photo_count || 0} fotos
                </div>
              </div>

              <div className="p-5">
                <h3 className="font-extrabold text-slate-800 text-base group-hover:text-amber-700 transition-colors">
                  {album.name}
                </h3>
                {album.description && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{album.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-md mx-auto">
          <FolderHeart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base mb-1">Nenhum álbum cadastrado</h3>
          <p className="text-xs text-slate-500 mb-4">Crie álbuns para reunir suas coleções preferidas.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl"
          >
            Criar Primeiro Álbum
          </button>
        </div>
      )}

      {/* Create Album Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <FolderHeart className="w-5 h-5 text-rose-600" />
                Criar Álbum / Coleção
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAlbum} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome do Álbum *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Férias em Família, Casamentos..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descrição</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Sobre esta coleção..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Capa do Álbum (Opcional)</label>
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
                  {saving ? 'Criando...' : 'Salvar Álbum'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Album Photos Modal */}
      {selectedAlbum && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden my-auto">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-lg text-white">Álbum: {selectedAlbum.name}</h3>
                <p className="text-xs text-slate-300">{albumPhotos.length} foto(s) nesta coleção</p>
              </div>
              <button onClick={() => setSelectedAlbum(null)} className="p-2 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              {albumPhotos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {albumPhotos.map(p => (
                    <div
                      key={p.id}
                      onClick={() => onOpenPhoto(p, albumPhotos)}
                      className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 relative group cursor-pointer border border-slate-200"
                    >
                      <img src={p.thumbnail_path} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic py-8 text-center">Nenhuma fotografia vinculada a este álbum ainda.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlbumsView;
