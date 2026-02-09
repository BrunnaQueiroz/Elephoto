import { useState } from 'react';
import { X, Trash2, CreditCard, Loader2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { supabase } from '../lib/supabase';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Cart({ isOpen, onClose }: CartProps) {
  const { cart, removeFromCart, cartTotal, clearCart } = useApp();
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleCheckout = async () => {
    setIsProcessing(true);

    // 1. Simulando "Processar o Pagamento"
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      // 2. O Pagamento foi "Aprovado". Agora vamos baixar as originais.
      let downloadCount = 0;

      for (const photo of cart) {
        // Verifica se temos o caminho do arquivo original (salvo no AdminPage)
        const originalPath = photo.filename;

        if (originalPath) {
          // Baixa o arquivo ORIGINAL (Sem marca d'água) direto do Storage
          const { data, error } = await supabase.storage
            .from('photos')
            .download(originalPath);

          if (error) {
            console.error('Erro ao baixar foto:', error);
            continue;
          }

          // Cria um link invisível para forçar o download do arquivo
          if (data) {
            const url = window.URL.createObjectURL(data);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            // Define o nome do arquivo que será salvo no PC do cliente
            a.download = `foto_original_${photo.id.slice(0, 5)}.jpg`;
            document.body.appendChild(a);
            a.click();

            // Limpa a memória
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            downloadCount++;
          }
        }
      }

      // 3. Feedback e Limpeza
      if (downloadCount > 0) {
        alert(
          `Pagamento Aprovado! ${downloadCount} fotos foram baixadas para seu computador.`
        );
        clearCart(); // Limpa o carrinho
        onClose(); // Fecha a janela
      } else {
        alert('Erro ao baixar as fotos. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro no checkout:', error);
      alert('Ocorreu um erro ao processar seu pedido.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl z-50 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-light text-gray-800">Carrinho</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isProcessing}
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 font-light">
                Seu carrinho está vazio
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map(photo => (
                <div
                  key={photo.id}
                  className="flex gap-4 bg-gray-50 rounded-lg p-3"
                >
                  <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                    <img
                      src={photo.thumbnail_url}
                      alt="Foto"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-light">
                        Foto Digital
                      </p>
                      <p className="text-lg font-light text-gray-800">
                        R$ {Number(photo.price).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => removeFromCart(photo.id)}
                    disabled={isProcessing}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors self-start"
                  >
                    <Trash2 className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-gray-200 p-4 space-y-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <span className="text-lg font-light text-gray-600">Total</span>
              <span className="text-2xl font-light text-gray-800">
                R$ {cartTotal.toFixed(2)}
              </span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={isProcessing}
              className="w-full bg-gray-900 text-white py-4 px-6 rounded-lg font-light hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5" />
                  Finalizar Pagamento (Simular)
                </>
              )}
            </button>
            <p className="text-xs text-center text-gray-400">
              Ambiente de Teste: Nenhuma cobrança real será feita.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
