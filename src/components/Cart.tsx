import { useState, useEffect, useRef } from 'react';
import {
  X,
  Trash2,
  CreditCard,
  Loader2,
  Sparkles,
  Plus,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Cart({ isOpen, onClose }: CartProps) {
  const { cart, removeFromCart, addToCart, cartTotal } = useApp();
  const [isProcessing, setIsProcessing] = useState(false);

  // Estados para a vitrine pública
  const [publicPhotos, setPublicPhotos] = useState<any[]>([]);
  const [isLoadingUpsell, setIsLoadingUpsell] = useState(false);

  // --- REFS PARA O CARROSSEL ---
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const startX = useRef(0);
  const scrollLeftStart = useRef(0);
  const isDragging = useRef(false);

  // Busca as fotos públicas
  useEffect(() => {
    if (!isOpen) return;

    const fetchPublicPhotos = async () => {
      setIsLoadingUpsell(true);
      try {
        const { data, error } = await supabase
          .from('photos')
          .select('*')
          .eq('is_public', true)
          .limit(10);

        if (data) {
          setPublicPhotos(data);
        }
      } catch (err) {
        console.error('Erro ao buscar fotos públicas:', err);
      } finally {
        setIsLoadingUpsell(false);
      }
    };

    fetchPublicPhotos();
  }, [isOpen]);

  const availableUpsells = publicPhotos.filter(
    publicPhoto => !cart.some(cartItem => cartItem.id === publicPhoto.id)
  );

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (
      !scrollContainer ||
      isCarouselPaused ||
      !isOpen ||
      availableUpsells.length === 0
    )
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
  }, [isCarouselPaused, isOpen, availableUpsells.length]);

  const scrollByAmount = (amount: number) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsCarouselPaused(true);
    isDragging.current = true;
    startX.current = e.pageX - scrollContainerRef.current!.offsetLeft;
    scrollLeftStart.current = scrollContainerRef.current!.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (startX.current - x) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeftStart.current + walk;
  };

  const handleMouseUpOrLeave = () => {
    isDragging.current = false;
    setIsCarouselPaused(false);
  };

  if (!isOpen) return null;

  const handleCheckout = async () => {
    setIsProcessing(true);
    try {
      const cartWithDiscount = cart.map((photo, index) => {
        const posicao = index + 1;
        const precoBase = 4.99;
        const precoExibicao =
          posicao >= 7 ? 1.99 : precoBase * Math.pow(0.84, index);

        return {
          ...photo,
          price: precoExibicao,
          name: `Foto Digital (${posicao}ª Foto)`,
        };
      });

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart: cartWithDiscount }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Erro ao iniciar pagamento. Tente novamente.');
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro de conexão com o pagamento.');
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col font-sans animate-in slide-in-from-right duration-500">
        {/* CABEÇALHO */}
        <div className="flex items-center justify-between p-6 border-b border-pink-100 bg-gradient-to-b from-pink-50/50 to-white">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-white shadow-md border-2 border-pink-100 flex items-center justify-center animate-bounce overflow-hidden">
                <img
                  src="/sheep.jpeg"
                  alt="Sheep"
                  className="w-full h-full object-cover"
                />
              </div>
              <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-yellow-400 animate-pulse" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-gray-900 leading-none">
                Suas Memórias
              </h2>
              <p className="text-sm text-pink-500 font-medium mt-1">
                A ovelhinha está cuidando delas!
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
            disabled={isProcessing}
          >
            <X className="w-6 h-6 text-gray-400 group-hover:rotate-90 transition-transform" />
          </button>
        </div>

        {/* ÁREA ROLÁVEL PRINCIPAL */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col">
          {cart.length === 0 ? (
            <div className="text-center py-10 flex flex-col items-center justify-center">
              <div className="relative mb-6">
                <img
                  src="/sheep.jpeg"
                  alt="Vazio"
                  className="w-24 h-24 rounded-full grayscale opacity-50"
                />
                <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-full shadow-md text-gray-300">
                  <CreditCard className="w-6 h-6" />
                </div>
              </div>
              <p className="text-gray-400 font-medium italic mb-6">
                Seu carrinho está esperando por fotos lindas!
              </p>
            </div>
          ) : (
            <div className="space-y-4 mb-8">
              {cart.map((photo, index) => {
                const posicao = index + 1;
                const precoBase = 4.99;
                const precoExibicao =
                  posicao >= 6 ? 1.99 : precoBase * Math.pow(0.8, index);

                return (
                  <div
                    key={photo.id}
                    className="group flex gap-4 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-pink-100 transition-all animate-in fade-in slide-in-from-right-4 duration-300"
                  >
                    <div className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 ring-2 ring-gray-50 group-hover:ring-pink-100 transition-all">
                      <img
                        src={photo.thumbnail_url}
                        alt="Foto"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 flex flex-col justify-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 mb-1 w-fit uppercase tracking-wider">
                        {posicao}ª Foto
                      </span>
                      <p className="text-sm text-gray-900 font-bold">
                        R$ {precoExibicao.toFixed(2)}
                      </p>
                      <p className="text-[10px] text-gray-400 font-medium italic uppercase">
                        Digital Alta Resolução
                      </p>
                    </div>

                    <button
                      onClick={() => removeFromCart(photo.id)}
                      disabled={isProcessing}
                      className="p-2 self-center text-gray-300 hover:text-red-400 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* --- NOVA SEÇÃO: CARROSSEL "VOCÊ TAMBÉM PODE GOSTAR" --- */}
          {availableUpsells.length > 0 && (
            <div className="mt-auto pt-8 border-t border-gray-100 animate-in fade-in duration-700 relative group">
              <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2 uppercase tracking-wide">
                <Sparkles className="w-4 h-4 text-pink-500" />
                Você também pode gostar
              </h3>

              {/* SETA ESQUERDA (Aparece no hover do desktop) */}
              <button
                onClick={() => scrollByAmount(-160)}
                onMouseEnter={() => setIsCarouselPaused(true)}
                onMouseLeave={() => setIsCarouselPaused(false)}
                className="hidden md:flex absolute left-[-16px] top-[60%] z-10 items-center justify-center w-8 h-8 bg-white border border-gray-100 rounded-full shadow-md text-pink-500 hover:bg-pink-50 transition-all opacity-0 group-hover:opacity-100"
              >
                <ChevronLeft className="w-5 h-5" />
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
                className="flex gap-4 overflow-x-auto pb-4 cursor-grab active:cursor-grabbing [&::-webkit-scrollbar]:hidden"
                style={{ WebkitOverflowScrolling: 'touch' }} // Scroll suave nativo no mobile
              >
                {availableUpsells.map(photo => (
                  <div
                    key={photo.id}
                    className="min-w-[140px] max-w-[140px] flex-shrink-0 flex flex-col gap-3 group/item select-none"
                  >
                    <div className="w-full aspect-square rounded-2xl overflow-hidden bg-gray-100 shadow-sm group-hover/item:shadow-md transition-shadow relative pointer-events-none">
                      <img
                        src={photo.thumbnail_url}
                        className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500"
                        alt="Foto Extra"
                        draggable={false} // Evita aquele "fantasma" da imagem ao arrastar no desktop
                      />
                    </div>

                    <button
                      onClick={() => addToCart(photo)}
                      className="w-full py-2 bg-gray-100 text-gray-900 text-xs font-bold rounded-xl hover:bg-pink-500 hover:text-white transition-colors flex items-center justify-center gap-1 active:scale-95"
                    >
                      <Plus className="w-4 h-4" /> Adicionar
                    </button>
                  </div>
                ))}
              </div>

              {/* SETA DIREITA (Aparece no hover do desktop) */}
              <button
                onClick={() => scrollByAmount(160)}
                onMouseEnter={() => setIsCarouselPaused(true)}
                onMouseLeave={() => setIsCarouselPaused(false)}
                className="hidden md:flex absolute right-[-16px] top-[60%] z-10 items-center justify-center w-8 h-8 bg-white border border-gray-100 rounded-full shadow-md text-pink-500 hover:bg-pink-50 transition-all opacity-0 group-hover:opacity-100"
              >
                <ChevronRight className="w-5 h-5" />
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
                      As imagens desta vitrine são destinadas exclusivamente
                      para apreciação e demonstração de portfólio.
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
        </div>

        {/* FOOTER DO CARRINHO */}
        {cart.length > 0 && (
          <div className="border-t border-gray-100 p-6 bg-white space-y-4 z-20">
            <div className="flex items-center justify-between p-4 bg-pink-50/50 rounded-2xl border border-pink-100/50">
              <div>
                <span className="text-sm text-gray-500 block">
                  Total do seu pedido
                </span>
                <span className="text-3xl font-black text-gray-900">
                  R$ {cartTotal.toFixed(2)}
                </span>
              </div>
              <img
                src="/compras.jpeg"
                className="w-28 h-auto rounded-full border-2 border-white shadow-sm"
                alt="Sheep Icon"
                draggable={false}
              />
            </div>

            <button
              onClick={handleCheckout}
              disabled={isProcessing}
              className="group relative w-full overflow-hidden bg-gray-900 text-white py-5 rounded-2xl font-bold border-2 border-transparent hover:border-pink-100 hover:bg-white transition-all duration-500 active:scale-95 disabled:opacity-70 shadow-xl"
            >
              {!isProcessing && (
                <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 flex items-center">
                  <img
                    src="/carrinho.png"
                    alt="Elefante e Ovelha no Carrinho"
                    className="h-12 w-auto animate-pass-cart object-contain"
                  />
                </div>
              )}

              <div className="relative flex items-center justify-center gap-3 z-10 transition-all duration-300 group-hover:opacity-0 group-hover:scale-90">
                {isProcessing ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-6 h-6" />
                    <span>Confirmar e Pagar</span>
                  </>
                )}
              </div>

              <div className="absolute inset-0 bg-pink-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </button>

            <div className="flex items-center justify-center gap-2">
              <img
                src="/sheep.jpeg"
                className="w-4 h-4 rounded-full opacity-40"
                alt="Footer Sheep"
              />
              <p className="text-[10px] text-gray-400 font-medium">
                Pagamento seguro processado pelo Stripe
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
