// ========================================
// src/store/productSlice.ts - TAM MİGRASYON
// ========================================

import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '../config/api'; // Supabase yerine axios
import type { ProductWithStock, StockStatus } from '../types';

interface ProductState {
    products: ProductWithStock[];
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
    currentPage: number;
    totalPages: number;
    searchTerm: string;
    selectedCategory: string | null;
    categories: string[];
    stockFilter: StockStatus | null;
    lowStockCount: number;
}

const initialState: ProductState = {
    products: [],
    status: 'idle',
    error: null,
    currentPage: 1,
    totalPages: 1,
    searchTerm: '',
    selectedCategory: null,
    categories: [],
    stockFilter: null,
    lowStockCount: 0,
};

// ESKI: Supabase complex query with JOIN + range + filtering
// YENI: HTTP GET /products with query params
export const fetchProducts = createAsyncThunk<
    ProductWithStock[], 
    { page: number, limit: number, searchTerm: string, category: string | null, stockFilter: StockStatus | null }
>(
    'products/fetchProducts',
    async ({ page, limit, searchTerm, category, stockFilter }, { rejectWithValue }) => {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });
            
            if (searchTerm) params.append('search', searchTerm);
            if (category) params.append('category', category);
            if (stockFilter) params.append('stock_filter', stockFilter);

            const response = await apiClient.get(`/products?${params}`);
            return response.data.products;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.error || 'Ürünler alınamadı'
            );
        }
    }
);

// ESKI: Supabase count query + complex filtering
// YENI: HTTP GET /products/count
export const fetchTotalProductsCount = createAsyncThunk<
    number, 
    { searchTerm: string, category: string | null, stockFilter: StockStatus | null }
>(
    'products/fetchTotalProductsCount',
    async ({ searchTerm, category, stockFilter }, { rejectWithValue }) => {
        try {
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (category) params.append('category', category);
            if (stockFilter) params.append('stock_filter', stockFilter);

            const response = await apiClient.get(`/products/count?${params}`);
            return response.data.count;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.error || 'Ürün sayısı alınamadı'
            );
        }
    }
);

// ESKI: Supabase distinct select
// YENI: HTTP GET /products/categories
export const fetchCategories = createAsyncThunk<string[], void>(
    'products/fetchCategories',
    async (_, { rejectWithValue }) => {
        try {
            const response = await apiClient.get('/products/categories');
            return response.data.categories;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.error || 'Kategoriler alınamadı'
            );
        }
    }
);

// ESKI: Supabase view query
// YENI: HTTP GET /products/low-stock-count
export const fetchLowStockCount = createAsyncThunk<number, void>(
    'products/fetchLowStockCount',
    async (_, { rejectWithValue }) => {
        try {
            const response = await apiClient.get('/products/low-stock-count');
            return response.data.count;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.error || 'Düşük stok sayısı alınamadı'
            );
        }
    }
);

// ESKI: Supabase RPC function call
// YENI: HTTP POST /products/:id/check-stock
export const checkProductStock = createAsyncThunk<
    number, 
    { productId: number, quantity: number }
>(
    'products/checkProductStock',
    async ({ productId, quantity }, { rejectWithValue }) => {
        try {
            const response = await apiClient.post(`/products/${productId}/check-stock`, {
                quantity: quantity
            });
            return response.data.available_stock;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.error || 'Stok kontrolü yapılamadı'
            );
        }
    }
);

const productSlice = createSlice({
    name: 'products',
    initialState,
    reducers: {
        setCurrentPage: (state, action: PayloadAction<number>) => {
            state.currentPage = action.payload;
        },
        setSearchTerm: (state, action: PayloadAction<string>) => {
            state.searchTerm = action.payload;
            state.currentPage = 1;
        },
        setSelectedCategory: (state, action: PayloadAction<string | null>) => {
            state.selectedCategory = action.payload;
            state.currentPage = 1;
        },
        setStockFilter: (state, action: PayloadAction<StockStatus | null>) => {
            state.stockFilter = action.payload;
            state.currentPage = 1;
        },
        clearFilters: (state) => {
            state.searchTerm = '';
            state.selectedCategory = null;
            state.stockFilter = null;
            state.currentPage = 1;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchProducts.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchProducts.fulfilled, (state, action: PayloadAction<ProductWithStock[]>) => {
                state.status = 'succeeded';
                state.products = action.payload;
            })
            .addCase(fetchProducts.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
            })
            .addCase(fetchTotalProductsCount.fulfilled, (state, action: PayloadAction<number>) => {
                const totalCount = action.payload;
                const limit = 5;
                state.totalPages = Math.ceil(totalCount / limit);
            })
            .addCase(fetchCategories.fulfilled, (state, action: PayloadAction<string[]>) => {
                state.categories = action.payload;
            })
            .addCase(fetchLowStockCount.fulfilled, (state, action: PayloadAction<number>) => {
                state.lowStockCount = action.payload;
            })
            .addCase(checkProductStock.rejected, (state, action) => {
                state.error = action.payload as string;
            });
    },
});

export const { 
    setCurrentPage, 
    setSearchTerm, 
    setSelectedCategory, 
    setStockFilter,
    clearFilters 
} = productSlice.actions;

export default productSlice.reducer;
