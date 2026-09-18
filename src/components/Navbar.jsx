import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Camera, Plus, Search, LogOut, Menu, UserCheck, Shield } from 'lucide-react';

const Navbar = ({ activeTab, setActiveTab, onOpenUpload, toggleMobileSidebar }) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          onClick={toggleMobileSidebar}
          className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
          title="Abrir Menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Brand logo & title */}
        <div 
          onClick={() => setActiveTab('inicio')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-600/10 group-hover:scale-105 transition-transform">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-slate-800 text-base sm:text-lg leading-tight tracking-tight">
              Galeria Digital
            </h1>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">
              Acervo de Memórias da Família
            </p>
          </div>
        </div>
      </div>

      {/* Header Quick Actions */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Quick Search trigger */}
        <button
          onClick={() => setActiveTab('pesquisar')}
          className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs sm:text-sm font-medium transition-colors"
        >
          <Search className="w-4 h-4 text-slate-500" />
          <span className="hidden md:inline">Pesquisar...</span>
        </button>

        {/* Quick Add Photos button */}
        <button
          onClick={onOpenUpload}
          className="flex items-center gap-2 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-sm transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Adicionar Fotos</span>
        </button>

        <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>

        {/* User Info & Logout */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5">
              {user?.name}
              {user?.role === 'Administrador' ? (
                <Shield className="w-3.5 h-3.5 text-amber-600" title="Administrador" />
              ) : (
                <UserCheck className="w-3.5 h-3.5 text-sky-600" title="Usuário" />
              )}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              {user?.role}
            </span>
          </div>

          <button
            onClick={logout}
            className="p-2.5 text-slate-500 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
            title="Encerrar Sessão (Sair)"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
