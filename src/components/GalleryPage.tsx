import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { supabase, Photo } from '../lib/supabase';
import { ArrowLeft, ShoppingCart, Plus, Check, Loader2 } from 'lucide-react';
import { Cart } from './Cart';

export function GalleryPage() {
  const { setCurrentView, addToCart, cart, removeFromCart } = useApp();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [albumCode, setAlbumCode] = useState('');

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      setError(null);

      const code = localStorage.getItem('elephoto_code');

      if (!code) {
        setError(
          'Nenhum código encontrado. Por favor, volte e digite novamente.'
        );
        setLoading(false);
        return;
      }

      setAlbumCode(code);

      const { data: cardData, error: cardError } = await supabase
        .from('cards')
        .select('id')
        .eq('code', code)
        .single();

      if (cardError || !cardData) {
        setError(`O álbum "${code}" não foi encontrado. Verifique o código.`);
        setLoading(false);
        return;
      }

      const { data: photosData, error: photosError } = await supabase
        .from('photos')
        .select('*')
        .eq('card_id', cardData.id);

      if (photosError) throw photosError;

      setPhotos(photosData || []);
    } catch (err) {
      console.error('Erro ao buscar fotos:', err);
      setError('Ocorreu um erro ao carregar as fotos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const isInCart = (photoId: string) => cart.some(p => p.id === photoId);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-gray-500 gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-gray-900" />
        <p>Buscando suas fotos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Ops! Algo deu errado.
        </h2>
        <p className="text-gray-500 mb-6">{error}</p>
        <button
          onClick={() => setCurrentView('home')}
          className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
        >
          Voltar para Início
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER DA GALERIA */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 px-4 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setCurrentView('home')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Voltar</span>
          </button>

          <div className="text-center">
            <h1 className="font-semibold text-gray-900">Álbum {albumCode}</h1>
            <p className="text-xs text-gray-500">
              {photos.length} fotos disponíveis
            </p>
          </div>

          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 hover:bg-gray-100 rounded-full transition-colors group"
          >
            <ShoppingCart className="w-6 h-6 text-gray-700 group-hover:text-gray-900" />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-gray-900 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-bold border-2 border-white">
                {cart.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* GRID DE FOTOS */}
      <main className="max-w-6xl mx-auto p-4 py-8">
        {photos.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">
              Este álbum ainda não tem fotos.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {photos.map(photo => {
              const selected = isInCart(photo.id);
              return (
                <div
                  key={photo.id}
                  className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Imagem */}
                  <div className="aspect-[3/4] bg-gray-200 relative">
                    <img
                      src={photo.thumbnail_url}
                      alt="Foto"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Informações e Botão */}
                  <div className="p-4 space-y-3">
                    <div>
                      <p className="text-sm text-gray-500 font-medium">
                        Foto Digital
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        R$ {Number(photo.price).toFixed(2)}
                      </p>
                    </div>

                    {/* BOTÃO LARGO ESTILO FOTO 2 */}
                    <button
                      onClick={() =>
                        selected ? removeFromCart(photo.id) : addToCart(photo)
                      }
                      className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                        selected
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-900 text-white hover:bg-gray-800'
                      }`}
                    >
                      {selected ? (
                        <>
                          <Check className="w-5 h-5" /> No carrinho
                        </>
                      ) : (
                        <>
                          <Plus className="w-5 h-5" /> Adicionar
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* CARRINHO */}
      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}
