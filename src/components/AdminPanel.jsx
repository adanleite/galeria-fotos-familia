import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import { Settings, Users, Shield, Lock, HardDrive, Plus, Edit2, Trash2, Check, X, ShieldAlert, KeyRound } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

const AdminPanel = ({ setToast }) => {
  const [activeTab, setActiveTab] = useState('users');

  // Users state
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Usuário');
  const [status, setStatus] = useState('active');
  const [savingUser, setSavingUser] = useState(false);

  // Storage metrics state
  const [storageMetrics, setStorageMetrics] = useState(null);

  // Categories state
  const [categories, setCategories] = useState([]);
  const [catName, setCatName] = useState('');

  useEffect(() => {
    loadUsers();
    loadStorage();
    loadCategories();
  }, []);

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await fetchApi('/api/users');
      if (res.users) setUsers(res.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadStorage = async () => {
    try {
      const res = await fetchApi('/api/settings/storage');
      if (res.storage) setStorageMetrics(res.storage);
    } catch (err) {
      console.error(err);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await fetchApi('/api/events/categories');
      if (res.categories) setCategories(res.categories);
    } catch (err) {
      console.error(err);
    }
  };

  const openNewUserModal = () => {
    setEditingUser(null);
    setName('');
    setUsername('');
    setEmail('');
    setPassword('');
    setRole('Usuário');
    setStatus('active');
    setShowUserModal(true);
  };

  const openEditUserModal = (u) => {
    setEditingUser(u);
    setName(u.name || '');
    setUsername(u.username || '');
    setEmail(u.email || '');
    setPassword('');
    setRole(u.role || 'Usuário');
    setStatus(u.status || 'active');
    setShowUserModal(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setSavingUser(true);

    try {
      if (editingUser) {
        await fetchApi(`/api/users/${editingUser.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name,
            email,
            role,
            status,
            newPassword: password || undefined
          })
        });
        setToast({ type: 'success', message: 'Usuário atualizado com sucesso!' });
      } else {
        await fetchApi('/api/users', {
          method: 'POST',
          body: JSON.stringify({ name, username, email, password, role })
        });
        setToast({ type: 'success', message: 'Usuário cadastrado com sucesso!' });
      }

      setShowUserModal(false);
      loadUsers();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Erro ao salvar usuário.' });
    } finally {
      setSavingUser(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!catName) return;
    try {
      await fetchApi('/api/events/categories', {
        method: 'POST',
        body: JSON.stringify({ name: catName })
      });
      setToast({ type: 'success', message: 'Categoria criada com sucesso!' });
      setCatName('');
      loadCategories();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Erro ao criar categoria.' });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-amber-600" />
            Painel do Administrador
          </h2>
          <p className="text-xs text-slate-500">
            Gerenciamento de usuários, permissões, categorias e métricas de armazenamento
          </p>
        </div>
      </div>

      {/* Admin Subtabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'users' ? 'bg-slate-900 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          Usuários & Permissões
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'categories' ? 'bg-slate-900 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          Categorias de Eventos
        </button>
        <button
          onClick={() => setActiveTab('storage')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'storage' ? 'bg-slate-900 text-white shadow' : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          Uso do Armazenamento
        </button>
      </div>

      {/* Tab 1: Users & Permissions */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200">
            <h3 className="font-extrabold text-slate-800 text-sm">Contas Cadastradas ({users.length})</h3>
            <button
              onClick={openNewUserModal}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs shadow"
            >
              + Novo Usuário
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Nome / Usuário</th>
                  <th className="px-6 py-3.5">E-mail</th>
                  <th className="px-6 py-3.5">Papel / Nível</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {u.name}
                      <span className="block text-xs font-medium text-slate-400">@{u.username}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        u.role === 'Administrador' ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        u.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {u.status === 'active' ? 'Ativo' : 'Desativado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openEditUserModal(u)}
                        className="p-2 text-slate-500 hover:text-amber-600 rounded-lg hover:bg-slate-100"
                        title="Editar Usuário"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Event Categories */}
      {activeTab === 'categories' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-6">
          <h3 className="font-extrabold text-slate-800 text-sm">Gerenciar Categorias Personalizadas</h3>

          <form onSubmit={handleAddCategory} className="flex gap-2 max-w-md">
            <input
              type="text"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="Ex: Formatura, Bodas, Réveillon..."
              className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm"
              required
            />
            <button
              type="submit"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs"
            >
              Adicionar Categoria
            </button>
          </form>

          <div className="flex flex-wrap gap-2">
            {categories.map(c => (
              <span key={c.id} className="px-3.5 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200">
                {c.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Storage Usage */}
      {activeTab === 'storage' && storageMetrics && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center">
            <HardDrive className="w-8 h-8 text-amber-600 mx-auto mb-2" />
            <span className="text-2xl font-extrabold text-slate-900">{storageMetrics.photosSizeMb} MB</span>
            <span className="block text-xs font-semibold text-slate-500 mt-1">Armazenamento de Fotografias</span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center">
            <Shield className="w-8 h-8 text-sky-600 mx-auto mb-2" />
            <span className="text-2xl font-extrabold text-slate-900">{storageMetrics.databaseSizeMb} MB</span>
            <span className="block text-xs font-semibold text-slate-500 mt-1">Tamanho do Banco de Dados</span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center">
            <Lock className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <span className="text-2xl font-extrabold text-slate-900">{storageMetrics.totalSizeMb} MB</span>
            <span className="block text-xs font-semibold text-slate-500 mt-1">Uso Total em Disco</span>
          </div>
        </div>
      )}

      {/* Create / Edit User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-base">
                {editingUser ? 'Editar Conta de Usuário' : 'Novo Usuário'}
              </h3>
              <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome Completo *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nome de Usuário (login) *</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">E-mail *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  {editingUser ? 'Nova Senha (deixe em branco para não alterar)' : 'Senha *'}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  required={!editingUser}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Papel / Nível</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="Usuário">Usuário (Padrão)</option>
                    <option value="Administrador">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status da Conta</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="active">Ativo</option>
                    <option value="disabled">Desativado</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingUser}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-md"
                >
                  {savingUser ? 'Salvando...' : 'Salvar Conta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
