import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { Photo } from '../lib/supabase';

type View = 'home' | 'gallery' | 'admin';

interface AppContextType {
  currentView: View;
  setCurrentView: (view: View) => void;
  cart: Photo[];
  addToCart: (photo: Photo) => void;
  removeFromCart: (photoId: string) => void;
  clearCart: () => void;
  cartTotal: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentView, setCurrentView] = useState<View>('home');

  // 1. Inicializa o carrinho lendo do LocalStorage (se existir)
  const [cart, setCart] = useState<Photo[]>(() => {
    const savedCart = localStorage.getItem('elephoto_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // 2. Sempre que o carrinho mudar, salva no LocalStorage
  useEffect(() => {
    localStorage.setItem('elephoto_cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (photo: Photo) => {
    setCart(prev => {
      if (prev.find(p => p.id === photo.id)) return prev;
      return [...prev, photo];
    });
  };

  const removeFromCart = (photoId: string) => {
    setCart(prev => prev.filter(p => p.id !== photoId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce((total, _, index) => {
    const posicao = index + 1; // 1ª foto, 2ª foto, etc.
    const precoBase = 6.9;

    if (posicao >= 6) {
      // Da sexta foto em diante, valor fixo
      return total + 1.99;
    }

    // Cálculo da progressão: cada foto custa 80% da anterior
    // Foto 1: 6.90 * (0.8 ^ 0) = 6.90
    // Foto 2: 6.90 * (0.8 ^ 1) = 5.52
    // Foto 3: 6.90 * (0.8 ^ 2) = 4.416...
    const precoDaFoto = precoBase * Math.pow(0.8, index);
    return total + precoDaFoto;
  }, 0);

  return (
    <AppContext.Provider
      value={{
        currentView,
        setCurrentView,
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        cartTotal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
