import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginScreen from './components/LoginScreen';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PhotoGallery from './components/PhotoGallery';
import EventsView from './components/EventsView';
import NucleiView from './components/NucleiView';
import MembersView from './components/MembersView';
import DateTimelineView from './components/DateTimelineView';
import AdvancedSearch from './components/AdvancedSearch';
import AlbumsView from './components/AlbumsView';
import BannerManager from './components/BannerManager';
import AdminPanel from './components/AdminPanel';
import PhotoUploadModal from './components/PhotoUploadModal';
import LightboxViewer from './components/LightboxViewer';
import ToastNotification from './components/ToastNotification';

const MainLayout = () => {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('inicio');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // Global Lightbox state
  const [activePhoto, setActivePhoto] = useState(null);
  const [photosList, setPhotosList] = useState([]);

  // Toast state
  const [toast, setToast] = useState(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-300">Carregando acervo digital...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen setToast={setToast} />;
  }

  const handleOpenPhoto = (photo, list = []) => {
    setActivePhoto(photo);
    setPhotosList(list.length > 0 ? list : [photo]);
  };

  const handlePhotoUpdated = () => {
    // Refresh active views if needed
  };

  const handlePhotoDeleted = (photoId) => {
    setActivePhoto(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenUpload={() => setUploadModalOpen(true)}
        toggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
      />

      {/* Main Body */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenUpload={() => setUploadModalOpen(true)}
          mobileOpen={mobileSidebarOpen}
          setMobileOpen={setMobileSidebarOpen}
        />

        {/* Content View */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
          {activeTab === 'inicio' && (
            <Dashboard
              setActiveTab={setActiveTab}
              onOpenUpload={() => setUploadModalOpen(true)}
              onOpenPhoto={handleOpenPhoto}
              setToast={setToast}
            />
          )}

          {activeTab === 'galeria' && (
            <PhotoGallery
              onOpenPhoto={handleOpenPhoto}
              onOpenUpload={() => setUploadModalOpen(true)}
              setToast={setToast}
            />
          )}

          {activeTab === 'eventos' && (
            <EventsView
              onOpenPhoto={handleOpenPhoto}
              setToast={setToast}
            />
          )}

          {activeTab === 'nucleos' && (
            <NucleiView
              onOpenPhoto={handleOpenPhoto}
              setToast={setToast}
            />
          )}

          {activeTab === 'pessoas' && (
            <MembersView
              onOpenPhoto={handleOpenPhoto}
              setToast={setToast}
            />
          )}

          {activeTab === 'datas' && (
            <DateTimelineView
              onOpenPhoto={handleOpenPhoto}
              setToast={setToast}
            />
          )}

          {activeTab === 'pesquisar' && (
            <AdvancedSearch
              onOpenPhoto={handleOpenPhoto}
              setToast={setToast}
            />
          )}

          {activeTab === 'albuns' && (
            <AlbumsView
              onOpenPhoto={handleOpenPhoto}
              setToast={setToast}
            />
          )}

          {activeTab === 'banners' && user.role === 'Administrador' && (
            <BannerManager setToast={setToast} />
          )}

          {activeTab === 'configuracoes' && user.role === 'Administrador' && (
            <AdminPanel setToast={setToast} />
          )}
        </main>
      </div>

      {/* Global Photo Upload Modal */}
      <PhotoUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onUploadSuccess={() => {
          setToast({ type: 'success', message: 'Fotografias enviadas e organizadas com sucesso!' });
        }}
        setToast={setToast}
      />

      {/* Global Lightbox Viewer */}
      {activePhoto && (
        <LightboxViewer
          photo={activePhoto}
          photosList={photosList}
          onClose={() => setActivePhoto(null)}
          onPhotoUpdated={handlePhotoUpdated}
          onPhotoDeleted={handlePhotoDeleted}
          setToast={setToast}
        />
      )}

      {/* Global Toast Notification */}
      <ToastNotification
        toast={toast}
        onClose={() => setToast(null)}
      />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}

export default App;
