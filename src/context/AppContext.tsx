import { createContext, useContext, useState, ReactNode } from 'react';
import { Photo } from '../lib/supabase';

interface AppContextType {
  currentCode: string | null;
  setCurrentCode: (code: string | null) => void;
  currentView: 'home' | 'gallery' | 'admin';
  setCurrentView: (view: 'home' | 'gallery' | 'admin') => void;
  cart: Photo[];
  addToCart: (photo: Photo) => void;
  removeFromCart: (photoId: string) => void;
  clearCart: () => void;
  cartTotal: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentCode, setCurrentCode] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<'home' | 'admin' | 'gallery'>(
    'home'
  );
  const [cart, setCart] = useState<Photo[]>([]);

  const addToCart = (photo: Photo) => {
    setCart(prev => {
      if (prev.find(p => p.id === photo.id)) {
        return prev;
      }
      return [...prev, photo];
    });
  };

  const removeFromCart = (photoId: string) => {
    setCart(prev => prev.filter(p => p.id !== photoId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotal = cart.reduce((sum, photo) => sum + Number(photo.price), 0);

  return (
    <AppContext.Provider
      value={{
        currentCode,
        setCurrentCode,
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
