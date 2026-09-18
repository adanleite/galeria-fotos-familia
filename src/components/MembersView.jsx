import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import { User, Plus, Search, Camera, Users, X, Calendar } from 'lucide-react';

const MembersView = ({ onOpenPhoto, setToast }) => {
  const [members, setMembers] = useState([]);
  const [nuclei, setNuclei] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal creation state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [nucleusId, setNucleusId] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [description, setDescription] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);

  // Member photo search modal state
  const [selectedMember, setSelectedMember] = useState(null);
  const [memberPhotos, setMemberPhotos] = useState([]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      let query = '/api/members';
      if (searchTerm) query += `?search=${encodeURIComponent(searchTerm)}`;

      const [mRes, nRes] = await Promise.all([
        fetchApi(query),
        fetchApi('/api/nuclei')
      ]);

      if (mRes.members) setMembers(mRes.members);
      if (nRes.nuclei) setNuclei(nRes.nuclei);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [searchTerm]);

  const openMemberPhotos = async (member) => {
    setSelectedMember(member);
    try {
      const data = await fetchApi(`/api/members/${member.id}`);
      setMemberPhotos(data.photos || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateMember = async (e) => {
    e.preventDefault();
    if (!name || !nucleusId) {
      setToast({ type: 'error', message: 'Nome e Núcleo Familiar são obrigatórios.' });
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('nucleus_id', nucleusId);
      if (birthDate) formData.append('birth_date', birthDate);
      if (description) formData.append('description', description);
      if (avatarFile) formData.append('avatar', avatarFile);

      const res = await fetchApi('/api/members', {
        method: 'POST',
        body: formData
      });

      setToast({ type: 'success', message: res.message || 'Membro cadastrado com sucesso!' });
      setShowCreateModal(false);
      resetForm();
      loadMembers();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Erro ao cadastrar membro.' });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setName('');
    setNucleusId('');
    setBirthDate('');
    setDescription('');
    setAvatarFile(null);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <User className="w-6 h-6 text-purple-600" />
            Membros da Família
          </h2>
          <p className="text-xs text-slate-500">
            Perfis dos familiares e fotografias onde cada pessoa está presente
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Pessoa
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 max-w-md">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar por nome do familiar (Ex: Adailton)..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Members Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(n => <div key={n} className="bg-slate-200 animate-pulse h-40 rounded-2xl"></div>)}
        </div>
      ) : members.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {members.map((m) => (
            <div
              key={m.id}
              onClick={() => openMemberPhotos(m)}
              className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl transition-all cursor-pointer group flex items-start gap-4"
            >
              {/* Profile Avatar */}
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xl overflow-hidden flex-shrink-0 shadow-md group-hover:scale-105 transition-transform">
                {m.avatar_url ? (
                  <img src={m.avatar_url} alt={m.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{m.name.charAt(0)}</span>
                )}
              </div>

              {/* Profile Details */}
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 block mb-0.5">
                  {m.nucleus_name || 'Geral'}
                </span>
                <h3 className="font-extrabold text-slate-800 text-base group-hover:text-amber-700 transition-colors truncate">
                  {m.name}
                </h3>
                {m.birth_date && (
                  <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    Nascimento: {new Date(m.birth_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                  </p>
                )}

                <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg text-xs font-bold">
                  <Camera className="w-3.5 h-3.5 text-amber-600" />
                  {m.photo_count || 0} foto(s) marcadas
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-md mx-auto">
          <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base mb-1">Nenhum membro cadastrado</h3>
          <p className="text-xs text-slate-500 mb-4">Cadastre familiares para associar a rostos nas fotografias.</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl"
          >
            Cadastrar Pessoa
          </button>
        </div>
      )}

      {/* Create Member Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <User className="w-5 h-5 text-purple-600" />
                Cadastrar Familiar
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMember} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Vovô Adailton"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Núcleo Familiar *</label>
                <select
                  value={nucleusId}
                  onChange={(e) => setNucleusId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
                  required
                >
                  <option value="">Selecione o Núcleo...</option>
                  {nuclei.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Data de Nascimento</label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Observações / Descrição</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Patriarca, passatempos..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 resize-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Foto de Perfil (Avatar)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAvatarFile(e.target.files[0])}
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
                  {saving ? 'Cadastrando...' : 'Salvar Pessoa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Tagged Photos Modal */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden my-auto">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-500 text-slate-950 font-bold text-lg flex items-center justify-center">
                  {selectedMember.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-white">Fotos de: {selectedMember.name}</h3>
                  <p className="text-xs text-slate-300">{memberPhotos.length} fotografia(s) onde a pessoa está presente</p>
                </div>
              </div>
              <button onClick={() => setSelectedMember(null)} className="p-2 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              {memberPhotos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {memberPhotos.map(p => (
                    <div
                      key={p.id}
                      onClick={() => onOpenPhoto(p, memberPhotos)}
                      className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 relative group cursor-pointer border border-slate-200"
                    >
                      <img src={p.thumbnail_path} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic py-8 text-center">Nenhuma fotografia associada a {selectedMember.name} até o momento.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembersView;
