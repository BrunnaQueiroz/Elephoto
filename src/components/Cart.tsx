import { useState } from 'react';
import { X, Trash2, CreditCard, Loader2, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Cart({ isOpen, onClose }: CartProps) {
  const { cart, removeFromCart, cartTotal } = useApp();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleCheckout = async () => {
    setIsProcessing(true);
    try {
      // Envia o carrinho para a API do Stripe
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart }),
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
      {/* Overlay com desfoque suave */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col font-sans animate-in slide-in-from-right duration-500">
        {/* CABEÇALHO LÚDICO COM OVELHA EM DESTAQUE */}
        <div className="flex items-center justify-between p-6 border-b border-pink-100 bg-gradient-to-b from-pink-50/50 to-white">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-white shadow-md border-2 border-pink-100 flex items-center justify-center animate-bounce overflow-hidden">
                <img
                  src="/sheep.jpeg"
                  // src="/compras.jpeg"
                  alt="Sheep"
                  className="w-full h-full object-cover"
                />
              </div>
              <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-yellow-400 animate-pulse" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-gray-900 leading-none">
                Suas Fotos
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

        {/* LISTA DE ITENS COM ANIMAÇÕES */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center py-20 flex flex-col items-center justify-center">
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
              <p className="text-gray-400 font-medium italic">
                Seu carrinho está esperando por fotos lindas!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((photo, index) => {
                const posicao = index + 1;
                const precoBase = 6.9;
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
        </div>

        {/* FOOTER */}
        {cart.length > 0 && (
          <div className="border-t border-gray-100 p-6 bg-white space-y-4">
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
              />
            </div>

            <button
              onClick={handleCheckout}
              disabled={isProcessing}
              className="group relative w-full overflow-hidden bg-gray-900 text-white py-5 rounded-2xl font-bold border-2 border-transparent hover:border-pink-100 hover:bg-white transition-all duration-500 active:scale-95 disabled:opacity-70 shadow-xl"
            >
              {/* Camada da Animação do Carrinho */}
              {!isProcessing && (
                <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 flex items-center">
                  <img
                    src="/carrinho.png"
                    alt="Elefante e Ovelha no Carrinho"
                    className="h-12 w-auto animate-pass-cart object-contain"
                  />
                </div>
              )}

              {/* Conteúdo Original (Some completamente no hover) */}
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

              {/* Fundo Branco no Hover */}
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
