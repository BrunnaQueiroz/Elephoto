import { useState } from 'react';
import { X, Trash2, CreditCard, Loader2 } from 'lucide-react';
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
      // Chama a API do Stripe
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cart }),
      });

      const data = await response.json();

      if (data.url) {
        // Redireciona para o Stripe
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
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl z-50 flex flex-col font-sans">
        {/* CABEÇALHO DO CARRINHO */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-medium text-gray-900">Seu Carrinho</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={isProcessing}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* LISTA DE ITENS */}
        <div className="flex-1 overflow-y-auto p-6">
          {cart.length === 0 ? (
            <div className="text-center py-12 flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                <CreditCard className="w-8 h-8" />
              </div>
              <p className="text-gray-500">Seu carrinho está vazio</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((photo, index) => {
                // Cálculo lógico para exibição individual
                const posicao = index + 1;
                const precoBase = 6.9;
                let precoExibicao = 0;

                if (posicao >= 6) {
                  precoExibicao = 1.99;
                } else {
                  precoExibicao = precoBase * Math.pow(0.8, index);
                }

                return (
                  <div
                    key={photo.id}
                    className="flex gap-4 bg-gray-50 rounded-xl p-3 border border-gray-100 animate-in fade-in slide-in-from-right-4 duration-300"
                  >
                    <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                      <img
                        src={photo.thumbnail_url}
                        alt="Foto"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 flex flex-col justify-between py-1">
                      <div>
                        <p className="text-xs text-blue-600 font-semibold mb-0.5">
                          {posicao}ª Foto — Desconto Progressivo
                        </p>
                        <p className="text-sm text-gray-500 font-medium">
                          Foto Alta Resolução
                        </p>
                        <p className="text-lg font-semibold text-gray-900">
                          R$ {precoExibicao.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => removeFromCart(photo.id)}
                      disabled={isProcessing}
                      className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all self-center text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RODAPÉ COM TOTAL E BOTÃO VERDE */}
        {cart.length > 0 && (
          <div className="border-t border-gray-100 p-6 bg-gray-50 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600">Total</span>
              <span className="text-2xl font-semibold text-gray-900">
                R$ {cartTotal.toFixed(2)}
              </span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isProcessing}
              className="w-full bg-green-600 text-white py-4 rounded-xl font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-200 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Redirecionando...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" /> Ir para Pagamento (Stripe)
                </>
              )}
            </button>

            <p className="text-xs text-center text-gray-400">
              Ambiente seguro via Stripe
            </p>
          </div>
        )}
      </div>
    </>
  );
}
