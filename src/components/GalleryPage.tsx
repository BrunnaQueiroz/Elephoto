import { useEffect, useState, useRef } from 'react';

import { useApp } from '../context/AppContext';
import { supabase, Photo } from '../lib/supabase';
import {
  ArrowLeft,
  ShoppingCart,
  Plus,
  Check,
  Loader2,
  X,
  Maximize2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Printer,
} from 'lucide-react';
import { Cart } from './Cart';

export function GalleryPage() {
  const { setCurrentView, addToCart, cart, removeFromCart, clearCart } =
    useApp();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [albumCode, setAlbumCode] = useState('');

  // Controla qual foto está aberta no modal (aceita fotos da galeria ou públicas)
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  // --- ESTADOS E REFS DA VITRINE "VOCÊ TAMBÉM PODE GOSTAR" ---
  const [publicPhotos, setPublicPhotos] = useState<Photo[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);
  const isDragging = useRef(false);

  // Busca as fotos do cliente e as fotos públicas
  // useEffect(() => {
  //   fetchPhotos();
  //   fetchPublicPhotos();
  // }, []);
  useEffect(() => {
    fetchPhotos();
  }, []);

  // Função para buscar as fotos públicas da vitrine
  // const fetchPublicPhotos = async () => {
  //   try {
  //     const { data, error } = await supabase
  //       .from('photos')
  //       .select('*')
  //       .eq('is_public', true);
  //     // .limit(10);

  //     if (data) {
  //       setPublicPhotos(data);
  //     }
  //   } catch (err) {
  //     console.error('Erro ao buscar fotos públicas:', err);
  //   }
  // };

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
      // ... (código existente da fetchPhotos) ...
      const { data: photosData, error: photosError } = await supabase
        .from('photos')
        .select('*')
        .eq('card_id', cardData.id);

      if (photosError) throw photosError;
      setPhotos(photosData || []);

      // 👇 COLE ESTE BLOCO NOVO AQUI 👇
      // Busca as fotos recomendadas (upsells) cruzando com a tabela photos
      const { data: upsellsData, error: upsellsError } = await supabase
        .from('card_upsells')
        .select('photos(*)')
        .eq('card_id', cardData.id);

      if (!upsellsError && upsellsData) {
        // Extrai as fotos de dentro do objeto retornado pelo Supabase e limpa os nulos
        const recommendedPhotos = upsellsData
          .map(item =>
            Array.isArray(item.photos) ? item.photos[0] : item.photos
          )
          .filter(Boolean) as Photo[];
        setPublicPhotos(recommendedPhotos);
      }
      // ☝️ FIM DO BLOCO NOVO ☝️
    } catch (err) {
      console.error('Erro ao buscar fotos:', err);
      setError('Ocorreu um erro ao carregar as fotos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const availableUpsells = publicPhotos.filter(
    publicPhoto => !cart.some(cartItem => cartItem.id === publicPhoto.id)
  );

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer || isCarouselPaused || availableUpsells.length === 0)
      return;

    let scrollAmount = scrollContainer.scrollLeft;
    const scrollSpeed = 0.5;
    let animationId: number;

    const scroll = () => {
      if (!scrollContainer) return;
      scrollAmount += scrollSpeed;

      if (
        scrollAmount >=
        scrollContainer.scrollWidth - scrollContainer.clientWidth
      ) {
        scrollAmount = 0;
      }

      scrollContainer.scrollLeft = scrollAmount;
      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationId);
  }, [isCarouselPaused, availableUpsells.length]);

  const scrollByAmount = (amount: number) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Só inicia arraste se clicar com botão esquerdo
    if (e.button !== 0) return;
    setIsCarouselPaused(true);
    isDragging.current = true;
    startX.current = e.pageX - scrollContainerRef.current!.offsetLeft;
    scrollLeftStart.current = scrollContainerRef.current!.scrollLeft;

    // Impede seleção de texto durante o arraste
    e.preventDefault();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (startX.current - x) * 1.5;
    scrollContainerRef.current.scrollLeft = scrollLeftStart.current + walk;
  };

  const handleMouseUpOrLeave = () => {
    isDragging.current = false;
    setIsCarouselPaused(false);
  };

  // Verificação de itens no carrinho
  const isInCart = (photoId: string) => cart.some(p => p.id === photoId);

  // Função auxiliar para renderizar botões
  const renderCartButton = (photo: Photo, isLarge = false) => {
    const selected = isInCart(photo.id);
    return (
      <button
        onClick={e => {
          e.stopPropagation();

          if (selected) {
            removeFromCart(photo.id);
          } else {
            addToCart(photo);
          }
        }}
        className={`rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
          isLarge ? 'px-6 py-3 min-w-[200px]' : 'w-full py-3'
        } ${
          selected
            ? 'bg-green-100 text-green-800 hover:bg-green-200'
            : isLarge
            ? 'bg-white text-gray-900 hover:bg-gray-100'
            : 'bg-gray-900 text-white hover:bg-gray-800'
        }`}
      >
        {selected ? (
          <>
            <Check className="w-5 h-5" />{' '}
            {isLarge ? 'Adicionado' : 'No carrinho'}
          </>
        ) : (
          <>
            <Plus className="w-5 h-5" /> Adicionar
          </>
        )}
      </button>
    );
  };

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

  const handleLogout = () => {
    if (cart.length > 0) {
      const confirmLeave = window.confirm(
        'Se você sair agora, seu carrinho será esvaziado. Deseja mesmo sair?'
      );
      if (!confirmLeave) return;
    }

    clearCart();
    localStorage.removeItem('elephoto_code');
    setCurrentView('home');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER DA GALERIA */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 px-4 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Sair do Álbum</span>{' '}
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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {photos.map(photo => (
              <div
                key={photo.id}
                className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group flex flex-col"
              >
                <div
                  className="aspect-square bg-gray-200 relative cursor-zoom-in overflow-hidden"
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <img
                    src={photo.thumbnail_url}
                    alt="Foto"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Maximize2 className="text-white w-8 h-8 drop-shadow-lg" />
                  </div>
                </div>

                <div className="p-3 sm:p-4 flex flex-col flex-1 bg-white">
                  <ul className="my-auto space-y-2 sm:space-y-2.5 text-[10px] sm:text-xs text-gray-500 w-full py-2 sm:py-0">
                    <li className="flex flex-col items-center text-center sm:text-left sm:flex-row sm:justify-between sm:items-center gap-0.5 sm:gap-2">
                      <span className="font-medium uppercase tracking-wider text-gray-400">
                        Resolução:
                      </span>
                      <span className="text-gray-900 font-semibold sm:text-right">
                        {photo.resolution || 'ORIGINAL'}
                      </span>
                    </li>
                    <li className="flex flex-col items-center text-center sm:text-left sm:flex-row sm:justify-between sm:items-center gap-0.5 sm:gap-2">
                      <span className="font-medium uppercase tracking-wider text-gray-400">
                        Data/Hora:
                      </span>
                      <span className="text-gray-900 font-semibold sm:text-right">
                        09/02/2026 20:42
                      </span>
                    </li>
                    <li className="flex flex-col items-center text-center sm:text-left sm:flex-row sm:justify-between sm:items-center gap-0.5 sm:gap-2">
                      <span className="font-medium uppercase tracking-wider text-gray-400">
                        Formato:
                      </span>
                      <span className="text-gray-900 font-semibold sm:text-right">
                        JPEG
                      </span>
                    </li>
                  </ul>
                  <div className="mt-auto pt-3 sm:pt-0">
                    {renderCartButton(photo)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {availableUpsells.length > 0 && (
          <div className="mt-16 pt-10 border-t border-gray-200 relative group animate-in fade-in duration-700">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2 uppercase tracking-wide">
              <Sparkles className="w-6 h-6 text-pink-500" />
              Você também pode gostar
            </h2>

            {/* SETA ESQUERDA */}
            <button
              onClick={() => scrollByAmount(-200)}
              onMouseEnter={() => setIsCarouselPaused(true)}
              onMouseLeave={() => setIsCarouselPaused(false)}
              className="hidden md:flex absolute left-[-20px] top-[60%] z-10 items-center justify-center w-12 h-12 bg-white border border-gray-100 rounded-full shadow-lg text-pink-500 hover:bg-pink-50 transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* CONTAINER ROLÁVEL */}
            <div
              ref={scrollContainerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              onTouchStart={() => setIsCarouselPaused(true)}
              onTouchEnd={() => setIsCarouselPaused(false)}
              className="flex gap-4 md:gap-6 overflow-x-auto pb-6 cursor-grab active:cursor-grabbing [&::-webkit-scrollbar]:hidden"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {availableUpsells.map(photo => (
                <div
                  key={photo.id}
                  className="min-w-[160px] max-w-[160px] md:min-w-[200px] md:max-w-[200px] flex-shrink-0 flex flex-col gap-3 group/item select-none"
                >
                  <div
                    className="w-full aspect-square rounded-2xl overflow-hidden bg-gray-200 shadow-sm group-hover/item:shadow-md transition-shadow relative cursor-zoom-in"
                    onClick={() => setSelectedPhoto(photo)}
                  >
                    <img
                      src={photo.thumbnail_url}
                      className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500"
                      alt="Foto Extra"
                      draggable={false}
                    />
                    {/* Overlay de zoom no hover para dar feedback visual */}
                    {/* <div className="absolute inset-0 bg-black/0 group-hover/item:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover/item:opacity-100">
                      <Maximize2 className="text-white w-6 h-6 drop-shadow-lg" />
                    </div> */}
                    <div
                      className="w-full aspect-square rounded-2xl overflow-hidden bg-gray-200 shadow-sm group-hover/item:shadow-md transition-shadow relative cursor-zoom-in"
                      onClick={() => setSelectedPhoto(photo)}
                    >
                      <img
                        src={photo.thumbnail_url}
                        className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500"
                        alt={photo.description || 'Foto Extra'}
                        draggable={false}
                      />
                      {/* Overlay de zoom e descrição no hover */}
                      <div className="absolute inset-0 bg-black/0 group-hover/item:bg-black/60 transition-colors flex flex-col items-center justify-center opacity-0 group-hover/item:opacity-100 p-4 text-center">
                        <Maximize2 className="text-white w-6 h-6 drop-shadow-lg mb-2" />
                        {photo.description && (
                          <p className="text-white text-xs font-medium drop-shadow-md line-clamp-3">
                            {photo.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => addToCart(photo)}
                    className="w-full py-3 bg-white border border-gray-200 text-gray-900 text-sm font-bold rounded-xl hover:bg-pink-500 hover:text-white hover:border-pink-500 transition-colors flex items-center justify-center gap-2 active:scale-95 shadow-sm"
                  >
                    <Plus className="w-4 h-4" /> Adicionar
                  </button>
                </div>
              ))}
            </div>

            {/* SETA DIREITA */}
            <button
              onClick={() => scrollByAmount(200)}
              onMouseEnter={() => setIsCarouselPaused(true)}
              onMouseLeave={() => setIsCarouselPaused(false)}
              className="hidden md:flex absolute right-[-20px] top-[60%] z-10 items-center justify-center w-12 h-12 bg-white border border-gray-100 rounded-full shadow-lg text-pink-500 hover:bg-pink-50 transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            {/* --- AVISO DE USO NÃO COMERCIAL --- */}
            <div className="max-w-4xl mx-auto mt-12 mb-8 px-6">
              <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-amber-600"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" x2="12" y1="8" y2="12" />
                    <line x1="12" x2="12.01" y1="16" y2="16" />
                  </svg>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-amber-900 uppercase tracking-wider">
                    Aviso de Direitos Autorais
                  </h4>
                  <p className="text-sm text-amber-800/80 font-light leading-relaxed">
                    As imagens desta vitrine são destinadas exclusivamente para
                    apreciação e demonstração de portfólio.
                    <span className="font-semibold text-amber-900">
                      {' '}
                      É estritamente proibida a reprodução, distribuição ou
                      utilização destas fotos para fins comerciais
                    </span>{' '}
                    sem a autorização prévia dos autores.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL / LIGHTBOX (VISUALIZAÇÃO AMPLIADA) */}

      {/* {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50"
          >
            <X className="w-8 h-8" />
          </button>

          <div
            className="relative max-w-5xl w-full max-h-[80vh] flex items-center justify-center"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={selectedPhoto.url || selectedPhoto.thumbnail_url}
              alt="Visualização ampliada"
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />
          </div>

          <div
            className="mt-6 flex items-center gap-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-white text-center">
              <p className="text-sm opacity-70">Foto Digital</p>
            </div>
            {renderCartButton(selectedPhoto, true)}
          </div>
        </div>
      )} */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            onClick={() => setSelectedPhoto(null)}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50"
          >
            <X className="w-8 h-8" />
          </button>

          <div
            className="relative max-w-5xl w-full max-h-[80vh] flex items-center justify-center"
            onClick={e => e.stopPropagation()}
          >
            {/* <img
              src={selectedPhoto.url || selectedPhoto.thumbnail_url}
              alt="Visualização ampliada"
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
            /> */}
            <div
              className="relative max-w-5xl w-full max-h-[80vh] flex items-center justify-center"
              onClick={e => e.stopPropagation()}
            >
              <img
                src={selectedPhoto.thumbnail_url}
                alt="Visualização ampliada"
                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl select-none"
                onContextMenu={e => e.preventDefault()}
                draggable={false}
              />
            </div>
          </div>

          {/* BARRA INFERIOR ATUALIZADA COM DESCRIÇÃO */}
          <div
            className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 w-full max-w-5xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="text-white text-center sm:text-left flex-1">
              <p className="text-sm opacity-70 font-semibold tracking-wider uppercase">
                Foto Digital
              </p>
              {selectedPhoto.description && (
                <p className="text-base text-gray-200 mt-2 font-light max-w-2xl">
                  {selectedPhoto.description}
                </p>
              )}
            </div>
            <div className="flex-shrink-0">
              {renderCartButton(selectedPhoto, true)}
            </div>
          </div>
        </div>
      )}
      {/* --- AVISO DE QUALIDADE DE IMPRESSÃO (TEXTO DO LAMBERT) --- */}
      <div className="max-w-4xl mx-auto mt-4 mb-12 px-6">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm flex-shrink-0">
            <Printer className="w-6 h-6 text-slate-600" />
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Sobre a Qualidade e Impressão
            </h4>
            <p className="text-sm text-slate-600 font-light leading-relaxed">
              A proposta da Elephoto é viabilizar fotografias acessíveis de
              qualidade diferenciada. As fotos adquiridas pelo preço padrão
              possuem resolução ideal para{' '}
              <strong className="font-semibold text-slate-800">
                redes sociais e impressões em até 20x30 cm
              </strong>{' '}
              (aprox. A4, a 245 dpi em compressão JPEG de alta qualidade).
            </p>
            <p className="text-sm text-slate-600 font-light leading-relaxed">
              Para formatos mais sofisticados (fine-art, impressões museológicas
              ou ampliações maiores que 20x30 cm),{' '}
              <strong className="font-semibold text-slate-800">
                é necessário tratar diretamente com o fotógrafo
              </strong>
              , que poderá fornecer arquivos sem compressão ou em resolução
              superior, mediante avaliação.
            </p>
          </div>
        </div>
      </div>

      {/* CARRINHO */}
      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  );
}
