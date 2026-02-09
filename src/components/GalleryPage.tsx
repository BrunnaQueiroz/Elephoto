import { useEffect, useState } from 'react';
import { ShoppingCart, Plus, Check, User } from 'lucide-react'; // Importei o User
import { useApp } from '../context/AppContext';
import { supabase, Photo } from '../lib/supabase';
import { Cart } from './Cart';

export function GalleryPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);

  const { currentCode, cart, clearCart, addToCart, setCurrentView } = useApp();

  useEffect(() => {
    loadPhotos();
  }, [currentCode]);

  const loadPhotos = async () => {
    if (!currentCode) return;
    setLoading(true);
    try {
      const { data: cardData } = await supabase
        .from('cards')
        .select('id')
        .eq('code', currentCode)
        .maybeSingle();

      if (!cardData) return;

      const { data: photosData, error } = await supabase
        .from('photos')
        .select('*')
        .eq('card_id', cardData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPhotos(photosData || []);
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const isInCart = (photoId: string) => {
    return cart.some(p => p.id === photoId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* LADO ESQUERDO: LOGO (VOLTAR) */}
          <div
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => {
              setCurrentView('home');
              clearCart();
            }}
          >
            <img
              src={'./logo.png'}
              alt="Elefoto"
              className="h-9 w-auto object-contain"
            />
          </div>

          {/* LADO DIREITO: PERFIL + CARRINHO */}
          <div className="flex items-center gap-4">
            {/* EXIBIÇÃO DO CÓDIGO COM ÍCONE (NOVO) */}
            {currentCode && (
              <div className="flex items-center gap-3 bg-gray-50 pl-2 pr-4 py-1.5 rounded-full border border-gray-100">
                {/* Ícone de Usuário em um círculo */}
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm text-gray-600">
                  <User className="w-4 h-4" />
                </div>

                {/* Texto do Código */}
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 font-bold leading-none mb-0.5">
                    Cliente
                  </span>
                  <span className="text-sm font-bold text-gray-800 leading-none">
                    {currentCode}
                  </span>
                </div>
              </div>
            )}

            {/* DIVISÓRIA PEQUENA ENTRE PERFIL E CARRINHO */}
            <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>

            {/* BOTÃO DO CARRINHO */}
            <button
              onClick={() => setShowCart(true)}
              className="relative flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="hidden sm:inline font-light text-sm">
                Carrinho
              </span>
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold border-2 border-white">
                  {cart.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* --- MAIN --- */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-500 font-light">Carregando suas fotos...</p>
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-100 shadow-sm">
            <p className="text-gray-500 font-light text-lg">
              Nenhuma foto encontrada para este código.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-baseline justify-between">
              <h2 className="text-2xl font-light text-gray-800">Sua Galeria</h2>
              <p className="text-gray-500 text-sm font-light">
                {photos.length}{' '}
                {photos.length === 1 ? 'foto disponível' : 'fotos disponíveis'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {photos.map(photo => (
                <div
                  key={photo.id}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 group"
                >
                  <div className="aspect-[4/5] bg-gray-100 overflow-hidden relative">
                    <img
                      src={photo.thumbnail_url}
                      alt="Foto"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                  </div>

                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                        Digital
                      </span>
                      <span className="text-lg font-medium text-gray-900">
                        R$ {Number(photo.price).toFixed(2)}
                      </span>
                    </div>

                    <button
                      onClick={() => addToCart(photo)}
                      disabled={isInCart(photo.id)}
                      className={`w-full py-3 px-4 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                        isInCart(photo.id)
                          ? 'bg-green-50 text-green-700 border border-green-200 cursor-default'
                          : 'bg-gray-900 text-white hover:bg-gray-800 shadow-sm hover:shadow'
                      }`}
                    >
                      {isInCart(photo.id) ? (
                        <>
                          <Check className="w-4 h-4" />
                          Adicionado
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" />
                          Adicionar ao Carrinho
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      <Cart isOpen={showCart} onClose={() => setShowCart(false)} />
    </div>
  );
}
