import { X, Trash2, CreditCard } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Cart({ isOpen, onClose }: CartProps) {
  const { cart, removeFromCart, cartTotal } = useApp();

  if (!isOpen) return null;

  const handleCheckout = () => {
    alert('Funcionalidade de pagamento será integrada em breve!');
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
                      <p className="text-sm text-gray-600 font-light">Foto</p>
                      <p className="text-lg font-light text-gray-800">
                        R$ {Number(photo.price).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => removeFromCart(photo.id)}
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
          <div className="border-t border-gray-200 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-lg font-light text-gray-600">Total</span>
              <span className="text-2xl font-light text-gray-800">
                R$ {cartTotal.toFixed(2)}
              </span>
            </div>

            <button
              onClick={handleCheckout}
              className="w-full bg-gray-800 text-white py-4 px-6 rounded-lg font-light hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
            >
              <CreditCard className="w-5 h-5" />
              Finalizar pagamento
            </button>
          </div>
        )}
      </div>
    </>
  );
}
