import React, { useState, useEffect } from 'react';
import { fetchApi } from '../services/api';
import {
  Camera,
  Calendar,
  Users,
  UserCheck,
  FolderHeart,
  Plus,
  Search,
  Sparkles,
  ChevronRight,
  ArrowRight,
  MapPin,
  Clock,
  ChevronLeft,
  Image as ImageIcon
} from 'lucide-react';

const Dashboard = ({ setActiveTab, onOpenUpload, onOpenPhoto, setToast }) => {
  const [stats, setStats] = useState({
    totalPhotos: 0,
    totalEvents: 0,
    totalNuclei: 0,
    totalMembers: 0,
    totalAlbums: 0
  });
  const [recentPhotos, setRecentPhotos] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);
  const [banners, setBanners] = useState([]);
  const [activeBannerIdx, setActiveBannerIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, bannersData] = await Promise.all([
        fetchApi('/api/stats'),
        fetchApi('/api/banners?onlyActive=true')
      ]);

      if (statsData.stats) setStats(statsData.stats);
      if (statsData.recentPhotos) setRecentPhotos(statsData.recentPhotos);
      if (statsData.recentEvents) setRecentEvents(statsData.recentEvents);
      if (bannersData.banners) setBanners(bannersData.banners);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Banner carousel auto timer
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setActiveBannerIdx((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [banners]);

  const currentBanner = banners.length > 0 ? banners[activeBannerIdx] : null;

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Welcome Banner / Active Carousel */}
      {currentBanner ? (
        <div className="relative rounded-3xl overflow-hidden shadow-xl min-h-[260px] sm:min-h-[320px] flex items-center bg-slate-900 text-white group">
          <img
            src={currentBanner.image_url}
            alt={currentBanner.title}
            className="absolute inset-0 w-full h-full object-cover opacity-40 transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-transparent"></div>

          <div className="relative z-10 p-6 sm:p-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider mb-4 border border-amber-500/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Destaque do Acervo
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-3">
              {currentBanner.title}
            </h2>
            {currentBanner.description && (
              <p className="text-sm sm:text-base text-slate-300 mb-6 leading-relaxed">
                {currentBanner.description}
              </p>
            )}

            {currentBanner.button_text && (
              <button
                onClick={() => {
                  if (currentBanner.button_link === '/galeria') setActiveTab('galeria');
                  else if (currentBanner.button_link === '/eventos') setActiveTab('eventos');
                  else if (currentBanner.button_link === '/nucleos') setActiveTab('nucleos');
                  else setActiveTab('galeria');
                }}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
              >
                {currentBanner.button_text}
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Carousel controls if multiple banners */}
          {banners.length > 1 && (
            <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 bg-slate-950/50 backdrop-blur-md p-1.5 rounded-full border border-white/10">
              <button
                onClick={() => setActiveBannerIdx((prev) => (prev - 1 + banners.length) % banners.length)}
                className="p-1.5 text-white/80 hover:text-white rounded-full hover:bg-white/10"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs text-white/80 px-1 font-semibold">
                {activeBannerIdx + 1} / {banners.length}
              </span>
              <button
                onClick={() => setActiveBannerIdx((prev) => (prev + 1) % banners.length)}
                className="p-1.5 text-white/80 hover:text-white rounded-full hover:bg-white/10"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-slate-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-200 text-xs font-bold uppercase tracking-wider mb-4 border border-white/10">
              <Camera className="w-3.5 h-3.5" />
              Bem-vindo à sua Galeria Digital
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3">
              Armazene e Proteja as Memórias da Sua Família
            </h2>
            <p className="text-sm sm:text-base text-amber-100/90 leading-relaxed mb-6">
              Organize fotografias por eventos, núcleos familiares, pessoas e datas de forma intuitiva, elegante e 100% privada.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={onOpenUpload}
                className="px-5 py-3 bg-white text-slate-900 font-bold rounded-xl text-sm shadow-lg hover:bg-amber-50 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4 text-amber-600" />
                Adicionar Novas Fotos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Access Action Buttons */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Ações Rápidas
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <button
            onClick={onOpenUpload}
            className="p-4 bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-2xl shadow-sm text-left transition-all group flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <span className="block font-bold text-slate-800 text-sm">Adicionar Fotos</span>
              <span className="text-xs text-slate-500">Enviar novas imagens</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('eventos')}
            className="p-4 bg-white hover:bg-sky-50 border border-slate-200 hover:border-sky-300 rounded-2xl shadow-sm text-left transition-all group flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="block font-bold text-slate-800 text-sm">Novo Evento</span>
              <span className="text-xs text-slate-500">Criar festas ou viagens</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('nucleos')}
            className="p-4 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-2xl shadow-sm text-left transition-all group flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="block font-bold text-slate-800 text-sm">Novo Núcleo</span>
              <span className="text-xs text-slate-500">Cadastrar ramos da família</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('pesquisar')}
            className="p-4 bg-white hover:bg-purple-50 border border-slate-200 hover:border-purple-300 rounded-2xl shadow-sm text-left transition-all group flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <span className="block font-bold text-slate-800 text-sm">Pesquisar Fotos</span>
              <span className="text-xs text-slate-500">Filtros por pessoa ou data</span>
            </div>
          </button>
        </div>
      </div>

      {/* Photo Statistics Cards */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Resumo do Acervo
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-extrabold text-slate-900">{stats.totalPhotos}</span>
              <span className="block text-xs font-semibold text-slate-500">Fotos Gravadas</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-extrabold text-slate-900">{stats.totalEvents}</span>
              <span className="block text-xs font-semibold text-slate-500">Eventos</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-extrabold text-slate-900">{stats.totalNuclei}</span>
              <span className="block text-xs font-semibold text-slate-500">Núcleos Familiares</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-extrabold text-slate-900">{stats.totalMembers}</span>
              <span className="block text-xs font-semibold text-slate-500">Pessoas Cadastradas</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3 col-span-2 lg:col-span-1">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center flex-shrink-0">
              <FolderHeart className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-extrabold text-slate-900">{stats.totalAlbums}</span>
              <span className="block text-xs font-semibold text-slate-500">Álbuns & Coleções</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recently Added Photos */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">Fotos Adicionadas Recentemente</h3>
            <p className="text-xs text-slate-500">Últimas memórias salvas no acervo</p>
          </div>
          <button
            onClick={() => setActiveTab('galeria')}
            className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 hover:underline"
          >
            Ver Todas
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {recentPhotos.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {recentPhotos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => onOpenPhoto(photo)}
                className="group relative bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-md cursor-pointer transition-all"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100 relative">
                  <img
                    src={photo.thumbnail_path}
                    alt={photo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-slate-950/20 group-hover:bg-slate-950/0 transition-colors"></div>
                </div>

                <div className="p-3">
                  <h4 className="font-bold text-xs text-slate-800 line-clamp-1 group-hover:text-amber-700 transition-colors">
                    {photo.title}
                  </h4>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                    <span>{photo.nucleus_name || 'Geral'}</span>
                    <span>{photo.date ? new Date(photo.date + 'T00:00:00').toLocaleDateString('pt-BR') : ''}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200">
            <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">Nenhuma foto adicionada ainda</p>
            <p className="text-xs text-slate-500 mb-4">Comece adicionando suas primeiras fotografias familiares.</p>
            <button
              onClick={onOpenUpload}
              className="px-4 py-2 bg-amber-500 text-slate-950 text-xs font-bold rounded-xl"
            >
              Adicionar Fotos
            </button>
          </div>
        )}
      </div>

      {/* Recently Created Events */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">Eventos Recentes</h3>
            <p className="text-xs text-slate-500">Celebrações e reuniões cadastradas</p>
          </div>
          <button
            onClick={() => setActiveTab('eventos')}
            className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 hover:underline"
          >
            Ver Todos os Eventos
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {recentEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recentEvents.map((evt) => (
              <div
                key={evt.id}
                onClick={() => setActiveTab('eventos')}
                className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex gap-4 cursor-pointer group"
              >
                <div className="w-20 h-20 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 relative">
                  {evt.cover_url ? (
                    <img src={evt.cover_url} alt={evt.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 bg-amber-50">
                      <Calendar className="w-8 h-8 text-amber-500" />
                    </div>
                  )}
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded mb-1">
                      {evt.category_name || 'Evento'}
                    </span>
                    <h4 className="font-bold text-sm text-slate-800 group-hover:text-amber-700 transition-colors line-clamp-1">
                      {evt.name}
                    </h4>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {evt.date ? new Date(evt.date + 'T00:00:00').toLocaleDateString('pt-BR') : 'Sem data'}
                    </span>
                    {evt.location && (
                      <span className="flex items-center gap-1 line-clamp-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {evt.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-200">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">Nenhum evento cadastrado</p>
            <p className="text-xs text-slate-500 mb-4">Crie um evento para agrupar as fotos de aniversários ou festas.</p>
            <button
              onClick={() => setActiveTab('eventos')}
              className="px-4 py-2 bg-amber-500 text-slate-950 text-xs font-bold rounded-xl"
            >
              Criar Novo Evento
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
