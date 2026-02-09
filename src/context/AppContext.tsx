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

  const cartTotal = cart.reduce((acc, photo) => acc + Number(photo.price), 0);

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
