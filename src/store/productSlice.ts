// src/store/productSlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '../supabaseClient';
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

// Asenkron thunk ile Supabase'den ürünleri çekme
export const fetchProducts = createAsyncThunk(
    'products/fetchProducts',
    async ({ page, limit }: { page: number; limit: number }) => {
        const offset = (page - 1) * limit;

        const { data, error } = await supabase
            .from('products')
            .select('*')
            .range(offset, offset + limit - 1);

        if (error) {
            throw new Error(error.message);
        }
        return data as Product[];
    }
);

const productSlice = createSlice({
    name: 'products',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchProducts.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchProducts.fulfilled, (state, action: PayloadAction<Product[]>) => {
                state.status = 'succeeded';
                
                // Yeni gelen ürünlerin ID'lerini bir Set'e alarak hızlı kontrol yap
                const existingProductIds = new Set(state.products.map(product => product.id));
                
                // Sadece daha önce eklenmemiş ürünleri filtrele
                const uniqueNewProducts = action.payload.filter(
                    newProduct => !existingProductIds.has(newProduct.id)
                );
                
                // Yeni ve benzersiz ürünleri mevcut listeye ekle
                state.products.push(...uniqueNewProducts);
            })
            .addCase(fetchProducts.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.error.message || 'Ürünler yüklenirken hata oluştu';
            });
    },
});

export default productSlice.reducer;
