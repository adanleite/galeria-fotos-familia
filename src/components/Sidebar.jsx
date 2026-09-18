import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Home,
  Image,
  Calendar,
  Users,
  User,
  Search,
  FolderHeart,
  Clock,
  Upload,
  Layout,
  Settings,
  LogOut,
  X,
  ShieldAlert
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, onOpenUpload, mobileOpen, setMobileOpen }) => {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'Administrador';

  const menuItems = [
    { id: 'inicio', label: 'Início', icon: Home },
    { id: 'galeria', label: 'Galeria', icon: Image },
    { id: 'eventos', label: 'Eventos', icon: Calendar },
    { id: 'nucleos', label: 'Núcleos Familiares', icon: Users },
    { id: 'pessoas', label: 'Pessoas', icon: User },
    { id: 'pesquisar', label: 'Pesquisar Fotos', icon: Search },
    { id: 'albuns', label: 'Álbuns & Coleções', icon: FolderHeart },
    { id: 'datas', label: 'Datas & Linha do Tempo', icon: Clock },
    { id: 'upload_action', label: 'Adicionar Fotos', icon: Upload, isAction: true },
  ];

  const adminItems = [
    { id: 'banners', label: 'Gerenciar Banners', icon: Layout },
    { id: 'configuracoes', label: 'Painel do Admin', icon: Settings },
  ];

  const handleSelect = (item) => {
    if (item.isAction) {
      onOpenUpload();
    } else {
      setActiveTab(item.id);
    }
    setMobileOpen(false);
  };

  const navContent = (
    <div className="h-full flex flex-col justify-between py-6 px-4">
      <div className="space-y-6">
        {/* Mobile close button */}
        <div className="flex items-center justify-between lg:hidden pb-2 border-b border-slate-200">
          <span className="font-bold text-slate-800 text-sm uppercase tracking-wider">
            Navegação Principal
          </span>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Menu */}
        <div>
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Acervo Familiar
          </p>
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                    item.isAction
                      ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 mt-2 border border-amber-200/60'
                      : isActive
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-slate-950' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Admin Menu */}
        {isAdmin && (
          <div className="pt-2 border-t border-slate-200/80">
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
              Administração
            </p>
            <nav className="space-y-1">
              {adminItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-md'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Footer / Logout */}
      <div className="pt-4 border-t border-slate-200">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-sm text-rose-600 hover:bg-rose-50 transition-colors"
        >
          <LogOut className="w-5 h-5 text-rose-500" />
          <span>Sair da Galeria</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 bg-white border-r border-slate-200/80 flex-shrink-0 min-h-[calc(100vh-65px)] sticky top-[65px]">
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          ></div>
          <div className="relative w-72 max-w-full bg-white h-full shadow-2xl z-50 flex flex-col">
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
