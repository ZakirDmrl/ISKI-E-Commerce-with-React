// src/store/cartSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Product, CartItem } from '../types';

interface CartState {
  items: CartItem[];
}

const initialState: CartState = {
  items: [],
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<Product>) => {
      const existingItem = state.items.find((item) => item.id === action.payload.id);
      if (existingItem) {
        existingItem.quantity++;
      } else {
        state.items.push({ ...action.payload, quantity: 1 });
      }
    },
    // Sepetteki bir ürünün miktarını azaltır
    decrementQuantity: (state, action: PayloadAction<number>) => {
      const existingItem = state.items.find((item) => item.id === action.payload);
      if (existingItem && existingItem.quantity > 1) {
        existingItem.quantity--;
      } else {
        // Eğer miktar 1 ise, ürünü tamamen sepetten çıkar
        state.items = state.items.filter((item) => item.id !== action.payload);
      }
    },
    // Bir ürünü tamamen sepetten siler
    removeFromCart: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
  },
});

export const { addToCart, decrementQuantity, removeFromCart } = cartSlice.actions;
export default cartSlice.reducer;
