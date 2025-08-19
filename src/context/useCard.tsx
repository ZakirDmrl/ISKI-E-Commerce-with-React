// src/context/useCart.tsx
import { useContext } from 'react';
import { CartContext, type CartContextType } from './context'; 

// Özel hook'u oluştur
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);

  // Context'in Provider içinde kullanıldığından emin ol
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }

  return context;
};
