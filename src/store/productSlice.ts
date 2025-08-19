// src/store/productSlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import type { Product } from '../types';

interface ProductState {
  products: Product[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: ProductState = {
  products: [],
  status: 'idle',
  error: null,
};

// Asenkron thunk ile API'den ürünleri çekme
export const fetchProducts = createAsyncThunk('products/fetchProducts', async () => {
  const response = await fetch('https://fakestoreapi.com/products?limit=5');
  const data: Product[] = await response.json();
  return data;
});

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {}, // Senkron reducer'lar buraya eklenir
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchProducts.fulfilled, (state, action: PayloadAction<Product[]>) => {
        state.status = 'succeeded';
        state.products = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error.message || 'Ürünler yüklenirken hata oluştu';
      });
  },
});

export default productSlice.reducer;
