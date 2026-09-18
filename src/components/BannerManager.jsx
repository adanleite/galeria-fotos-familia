import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import { Layout, Plus, Trash2, Edit2, Eye, EyeOff, X, ArrowUp, ArrowDown, ExternalLink } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

const BannerManager = ({ setToast }) => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form modal
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [buttonText, setButtonText] = useState('');
  const [buttonLink, setButtonLink] = useState('');
  const [active, setActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState(0);
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);

  // Delete modal
  const [deleteId, setDeleteId] = useState(null);

  const loadBanners = async () => {
    try {
      setLoading(true);
      const res = await fetchApi('/api/banners');
      if (res.banners) setBanners(res.banners);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const openNewModal = () => {
    setEditingBanner(null);
    setTitle('');
    setDescription('');
    setButtonText('Explorar');
    setButtonLink('/galeria');
    setActive(true);
    setDisplayOrder(banners.length + 1);
    setImageFile(null);
    setShowModal(true);
  };

  const openEditModal = (b) => {
    setEditingBanner(b);
    setTitle(b.title || '');
    setDescription(b.description || '');
    setButtonText(b.button_text || '');
    setButtonLink(b.button_link || '');
    setActive(b.active === 1);
    setDisplayOrder(b.display_order || 0);
    setImageFile(null);
    setShowModal(true);
  };

  const handleToggleActive = async (banner) => {
    try {
      await fetchApi(`/api/banners/${banner.id}`, {
        method: 'PUT',
        body: JSON.stringify({ active: banner.active === 1 ? 0 : 1 })
      });
      setToast({ type: 'success', message: `Banner ${banner.active === 1 ? 'desativado' : 'ativado'} com sucesso!` });
      loadBanners();
    } catch (err) {
      setToast({ type: 'error', message: 'Erro ao alterar estado do banner.' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title) {
      setToast({ type: 'error', message: 'O título do banner é obrigatório.' });
      return;
    }
    if (!editingBanner && !imageFile) {
      setToast({ type: 'error', message: 'Selecione uma imagem para o novo banner.' });
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('button_text', buttonText);
      formData.append('button_link', buttonLink);
      formData.append('active', active ? '1' : '0');
      formData.append('display_order', displayOrder);
      if (imageFile) formData.append('image', imageFile);

      if (editingBanner) {
        await fetchApi(`/api/banners/${editingBanner.id}`, {
          method: 'PUT',
          body: formData
        });
        setToast({ type: 'success', message: 'Banner atualizado com sucesso!' });
      } else {
        await fetchApi('/api/banners', {
          method: 'POST',
          body: formData
        });
        setToast({ type: 'success', message: 'Banner criado com sucesso!' });
      }

      setShowModal(false);
      loadBanners();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Erro ao salvar banner.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetchApi(`/api/banners/${deleteId}`, { method: 'DELETE' });
      setToast({ type: 'success', message: 'Banner excluído com sucesso!' });
      setDeleteId(null);
      loadBanners();
    } catch (err) {
      setToast({ type: 'error', message: 'Erro ao excluir banner.' });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <Layout className="w-6 h-6 text-amber-600" />
            Gerenciamento de Banners da Página Inicial
          </h2>
          <p className="text-xs text-slate-500">
            Adicione, edite, ordene e ative banners em destaque para a tela principal
          </p>
        </div>

        <button
          onClick={openNewModal}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Novo Banner
        </button>
      </div>

      {/* Banners List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(n => <div key={n} className="bg-slate-200 animate-pulse h-32 rounded-3xl"></div>)}
        </div>
      ) : banners.length > 0 ? (
        <div className="space-y-4">
          {banners.map((b) => (
            <div
              key={b.id}
              className={`bg-white p-5 rounded-3xl border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-5 transition-all ${
                b.active === 1 ? 'border-slate-200' : 'border-slate-200 opacity-60 bg-slate-50'
              }`}
            >
              {/* Banner Image Preview */}
              <div className="w-full sm:w-48 aspect-[16/6] bg-slate-900 rounded-2xl overflow-hidden relative flex-shrink-0">
                <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" />
              </div>

              {/* Banner Metadata */}
              <div className="flex-1 space-y-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h3 className="font-extrabold text-slate-800 text-base">{b.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    b.active === 1 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {b.active === 1 ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                {b.description && <p className="text-xs text-slate-500 line-clamp-1">{b.description}</p>}
                {b.button_text && (
                  <p className="text-[11px] text-amber-700 font-semibold flex items-center justify-center sm:justify-start gap-1">
                    <ExternalLink className="w-3 h-3" />
                    Botão: "{b.button_text}" → {b.button_link}
                  </p>
                )}
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleActive(b)}
                  className={`p-2.5 rounded-xl border transition-colors ${
                    b.active === 1 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-600'
                  }`}
                  title={b.active === 1 ? 'Desativar Banner' : 'Ativar Banner'}
                >
                  {b.active === 1 ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => openEditModal(b)}
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                  title="Editar Banner"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteId(b.id)}
                  className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors"
                  title="Excluir Banner"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-md mx-auto">
          <Layout className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base mb-1">Nenhum banner cadastrado</h3>
          <p className="text-xs text-slate-500 mb-4">Cadastre o primeiro banner promocional para a página inicial.</p>
          <button
            onClick={openNewModal}
            className="px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl"
          >
            Cadastrar Banner
          </button>
        </div>
      )}

      {/* Banner Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <Layout className="w-5 h-5 text-amber-600" />
                {editingBanner ? 'Editar Banner' : 'Novo Banner'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Título do Banner *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Preservando Memórias de Família"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descrição</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Texto explicativo para a página inicial..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Texto do Botão</label>
                  <input
                    type="text"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    placeholder="Ex: Ver Galeria"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Destino do Botão</label>
                  <select
                    value={buttonLink}
                    onChange={(e) => setButtonLink(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
                  >
                    <option value="/galeria">Galeria Principal (/galeria)</option>
                    <option value="/eventos">Seção de Eventos (/eventos)</option>
                    <option value="/nucleos">Núcleos Familiares (/nucleos)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {editingBanner ? 'Substituir Imagem do Banner' : 'Imagem do Banner *'}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0])}
                  className="w-full text-xs text-slate-500"
                  required={!editingBanner}
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="bannerActive"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500"
                />
                <label htmlFor="bannerActive" className="font-semibold text-slate-700">
                  Banner Ativo na Página Inicial
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-md"
                >
                  {saving ? 'Salvando...' : 'Salvar Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      <ConfirmModal
        isOpen={!!deleteId}
        title="Excluir Banner"
        message="Tem certeza de que deseja excluir este banner da página inicial?"
        confirmText="Excluir Banner"
        cancelText="Cancelar"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        isDanger={true}
      />
    </div>
  );
};

export default BannerManager;
