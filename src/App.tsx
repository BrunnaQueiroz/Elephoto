import { AppProvider, useApp } from './context/AppContext';
import { HomePage } from './components/HomePage';
import { GalleryPage } from './components/GalleryPage';
import { AdminPage } from './components/AdminPage';
import { PhotographerMenu } from './components/PhotographerMenu';
import { PortfolioUpload } from './components/PortfolioUpload';

// Componente interno que consome o contexto e decide qual tela mostrar
function AppContent() {
  const { currentView } = useApp();

  return (
    <div className="antialiased text-gray-900 bg-white min-h-screen">
      {/* Lógica de Roteamento Simples */}
      {currentView === 'home' && <HomePage />}
      {currentView === 'gallery' && <GalleryPage />}
      {currentView === 'admin' && <AdminPage />}
      {currentView === 'photographerMenu' && <PhotographerMenu />}
      {currentView === 'portfolioUpload' && <PortfolioUpload />}
    </div>
  );
}

// Componente Principal que fornece o Contexto
export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
