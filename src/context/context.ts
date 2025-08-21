// src/context/context.ts
import { createContext } from 'react';
import type { CartItem, Product } from '../types';

// Tip tanımını burada tutmak en doğrusu
export interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product) => void;
  decrementQuantity: (productId: number) => void;
  removeFromCart: (productId: number) => void;
  // Diğer fonksiyonlar buraya eklenebilir.
}

// Context nesnesini oluştur ve dışa aktar
export const CartContext = createContext<CartContextType | undefined>(undefined);
