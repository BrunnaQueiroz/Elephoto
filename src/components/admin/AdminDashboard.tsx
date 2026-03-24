import {
  LogOut,
  Lock,
  Globe,
  ImagePlus,
  LayoutList,
  Save,
  Trash2,
  Image as ImageIcon,
  Plus,
} from 'lucide-react';

interface AdminDashboardProps {
  onLogout: () => void;
  onNavigate: (mode: any) => void;
  loadPublicGallery: () => void;
  clearSelectedAlbum: () => void;
}

export function AdminDashboard({
  onLogout,
  onNavigate,
  loadPublicGallery,
  clearSelectedAlbum,
}: AdminDashboardProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900">Elephoto Admin</span>
        </div>
        <button
          onClick={onLogout}
          className="text-gray-500 hover:text-red-600 flex items-center gap-2 text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sair
        </button>
      </header>

      <main className="max-w-6xl mx-auto p-6 mt-10">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            O que vamos fazer hoje?
          </h1>
          <p className="text-gray-500 text-lg">
            Selecione o destino das fotos ou gerencie sua vitrine.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => onNavigate('private')}
            className="group bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl border border-gray-200 transition-all text-left flex flex-col items-start gap-6"
          >
            <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Fotos do Cliente
              </h2>
              <p className="text-gray-500 leading-relaxed text-sm">
                Álbum privado e seguro.
              </p>
            </div>
            <div className="mt-auto pt-4 flex items-center text-blue-600 font-semibold text-sm">
              <ImagePlus className="w-5 h-5 mr-2" /> Enviar fotos privadas
            </div>
          </button>

          <button
            onClick={() => {
              clearSelectedAlbum();
              onNavigate('public');
            }}
            className="group bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl border border-gray-200 transition-all text-left flex flex-col items-start gap-6"
          >
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
              <Globe className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Fotos Públicas
              </h2>
              <p className="text-gray-500 leading-relaxed text-sm">
                Fotos genéricas para a vitrine livre.
              </p>
            </div>
            <div className="mt-auto pt-4 flex items-center text-emerald-600 font-semibold text-sm">
              <ImagePlus className="w-5 h-5 mr-2" /> Enviar fotos públicas
            </div>
          </button>

          <button
            onClick={() => {
              onNavigate('manage');
              loadPublicGallery();
            }}
            className="group bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl border border-gray-200 transition-all text-left flex flex-col items-start gap-6"
          >
            <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl group-hover:scale-110 transition-transform">
              <LayoutList className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Gerenciar Vitrine
              </h2>
              <p className="text-gray-500 leading-relaxed text-sm">
                Edite as descrições das fotos públicas.
              </p>
            </div>
            <div className="mt-auto pt-4 flex items-center text-purple-600 font-semibold text-sm">
              <Save className="w-5 h-5 mr-2" /> Editar Descrições
            </div>
          </button>

          <button
            onClick={() => onNavigate('clients')}
            className="group bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl border border-gray-200 transition-all text-left flex flex-col items-start gap-6"
          >
            <div className="p-4 bg-orange-50 text-orange-600 rounded-2xl group-hover:scale-110 transition-transform">
              <LayoutList className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Gerenciar Clientes
              </h2>
              <p className="text-gray-500 leading-relaxed text-sm">
                Visualize e exclua clientes antigos.
              </p>
            </div>
            <div className="mt-auto pt-4 flex items-center text-orange-600 font-semibold text-sm">
              <Trash2 className="w-5 h-5 mr-2" /> Limpar Base de Clientes
            </div>
          </button>

          <button
            onClick={() => onNavigate('manage_albums')}
            className="group bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl border border-gray-200 transition-all text-left flex flex-col items-start gap-6"
          >
            <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl group-hover:scale-110 transition-transform">
              <ImageIcon className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Organizar Álbuns
              </h2>
              <p className="text-gray-500 leading-relaxed text-sm">
                Gerencie fotos por local e álbuns.
              </p>
            </div>
            <div className="mt-auto pt-4 flex items-center text-purple-600 font-semibold text-sm">
              <Plus className="w-5 h-5 mr-2" /> Criar Novo Álbum
            </div>
          </button>
        </div>
      </main>
    </div>
  );
}
