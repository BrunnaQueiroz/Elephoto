import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AdminLogin } from './admin/AdminLogin';
import { AdminDashboard } from './admin/AdminDashboard';
import { ClientManager } from './admin/ClientManager';
import { AlbumManager } from './admin/AlbumManager';
import { PublicGalleryManager } from './admin/PublicGalleryManager';
import { AlbumViewer } from './admin/AlbumViewer';
import { PhotoUploadForm } from './admin/PhotoUploadForm';
import { ClientUpsell } from './admin/ClientUpsell';

export function AdminPage() {
  const { setCurrentView } = useApp();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [uploadMode, setUploadMode] = useState<
    | 'selection'
    | 'private'
    | 'public'
    | 'manage'
    | 'clients'
    | 'manage_albums'
    | 'view_album'
    | 'client_upsell'
  >('selection');

  const [upsellClient, setUpsellClient] = useState<{
    id: string;
    code: string;
  } | null>(null);

  const [selectedAlbum, setSelectedAlbum] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentView('home');
  };

  const handleUploadSuccess = () => {
    // Se estava dentro de um álbum, volta pra ele. Se não, volta pro menu.
    if (selectedAlbum) {
      setUploadMode('view_album');
    } else {
      setUploadMode('selection');
    }
  };

  // 1. TELA DE LOGIN
  if (!isAuthenticated) {
    return (
      <AdminLogin
        onLoginSuccess={() => setIsAuthenticated(true)}
        onBackToHome={() => setCurrentView('home')}
      />
    );
  }

  // 2. MENU PRINCIPAL
  if (uploadMode === 'selection') {
    return (
      <AdminDashboard
        onLogout={handleLogout}
        onNavigate={mode => setUploadMode(mode)}
        clearSelectedAlbum={() => setSelectedAlbum(null)}
        loadPublicGallery={function (): void {
          throw new Error('Function not implemented.');
        }}
      />
    );
  }

  // 3. GERENCIAR CLIENTES
  if (uploadMode === 'clients') {
    return (
      <ClientManager
        onBack={() => setUploadMode('selection')}
        onUpsell={client => {
          setUpsellClient(client);
          setUploadMode('client_upsell');
        }}
      />
    );
  }

  // TELA NOVA: SELECIONAR FOTOS PARA O CLIENTE (UPSELL)
  if (uploadMode === 'client_upsell' && upsellClient) {
    return (
      <ClientUpsell
        client={upsellClient}
        onBack={() => setUploadMode('clients')}
      />
    );
  }

  // 4. GERENCIAR ÁLBUNS PÚBLICOS
  if (uploadMode === 'manage_albums') {
    return (
      <AlbumManager
        onBack={() => setUploadMode('selection')}
        onOpenAlbum={album => {
          setSelectedAlbum(album);
          setUploadMode('view_album');
        }}
      />
    );
  }

  // 5. VISUALIZAR UM ÁLBUM ESPECÍFICO
  if (uploadMode === 'view_album' && selectedAlbum) {
    return (
      <AlbumViewer
        album={selectedAlbum}
        onBack={() => setUploadMode('manage_albums')}
        onAddPhotos={() => setUploadMode('public')}
      />
    );
  }

  // 6. GERENCIAR VITRINE PÚBLICA (FOTOS SOLTAS)
  if (uploadMode === 'manage') {
    return <PublicGalleryManager onBack={() => setUploadMode('selection')} />;
  }

  // 7. FORMULÁRIO DE UPLOAD (PÚBLICO OU PRIVADO)
  if (uploadMode === 'public' || uploadMode === 'private') {
    return (
      <PhotoUploadForm
        uploadMode={uploadMode}
        selectedAlbum={selectedAlbum}
        onBack={() => {
          if (selectedAlbum) setUploadMode('view_album');
          else setUploadMode('selection');
        }}
        onLogout={handleLogout}
        onSuccess={handleUploadSuccess}
      />
    );
  }

  return null;
}
