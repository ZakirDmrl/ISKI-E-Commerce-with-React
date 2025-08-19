// src/context/CartProvider.tsx
import React, { useState, type ReactNode } from 'react';
import { CartContext } from './context'; // Yeni context dosyasından import et
import type { CartItem, Product } from '../types';

// Provider bileşenini oluştur
export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const addToCart = (product: Product) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      if (existingItem) {
        return prevItems.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [...prevItems, { ...product, quantity: 1 }];
      }
    });
  };

  const value = {
    cartItems,
    addToCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
