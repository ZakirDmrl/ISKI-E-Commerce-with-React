// src/store/productSlice.ts
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '../supabaseClient';
import { type Product } from '../types';

interface ProductState {
    products: Product[];
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
    currentPage: number;
    totalPages: number;
    searchTerm: string; // Arama terimi için yeni alan
    selectedCategory: string | null; // Seçili kategori için yeni alan
    categories: string[]; // Kategori listesi için yeni alan
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
};

// Sayfalama, arama ve filtreleme için parametre alan thunk
export const fetchProducts = createAsyncThunk<Product[], { page: number, limit: number, searchTerm: string, category: string | null }>(
    'products/fetchProducts',
    async ({ page, limit, searchTerm, category }, { rejectWithValue }) => {
        try {
            const start = (page - 1) * limit;
            const end = start + limit - 1;
            
            let query = supabase.from('products').select('*');

            // Arama terimi filtresi
            if (searchTerm) {
                query = query.ilike('title', `%${searchTerm}%`);
            }

            // Kategori filtresi
            if (category) {
                query = query.eq('category', category);
            }

            const { data, error } = await query.range(start, end);

            if (error) {
                throw new Error(error.message);
            }

            return data as Product[];
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Toplam ürün sayısını çekmek için thunk (arama ve kategori filtrelemesi eklendi)
export const fetchTotalProductsCount = createAsyncThunk<number, { searchTerm: string, category: string | null }>(
    'products/fetchTotalProductsCount',
    async ({ searchTerm, category }, { rejectWithValue }) => {
        try {
            let query = supabase.from('products').select('*', { count: 'exact', head: true });
            
            // Arama terimi filtresi
            if (searchTerm) {
                query = query.ilike('title', `%${searchTerm}%`);
            }
            // Kategori filtresi
            if (category) {
                query = query.eq('category', category);
            }

            const { count, error } = await query;

            if (error) {
                throw new Error(error.message);
            }
            return count as number;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Kategorileri çekmek için yeni thunk
export const fetchCategories = createAsyncThunk<string[], void>(
    'products/fetchCategories',
    async (_, { rejectWithValue }) => {
        try {
            // Distinct kategorileri çekmek için
            const { data, error } = await supabase.from('products').select('category');
            if (error) {
                throw new Error(error.message);
            }
            const uniqueCategories = Array.from(new Set(data.map(item => item.category)));
            return uniqueCategories as string[];
        } catch (error) {
            return rejectWithValue(error.message);
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
            state.currentPage = 1; // Arama değiştiğinde ilk sayfaya dön
        },
        setSelectedCategory: (state, action: PayloadAction<string | null>) => {
            state.selectedCategory = action.payload;
            state.currentPage = 1; // Kategori değiştiğinde ilk sayfaya dön
        },
    },
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
                state.error = action.payload as string;
            })
            .addCase(fetchTotalProductsCount.fulfilled, (state, action: PayloadAction<number>) => {
                const totalCount = action.payload;
                const limit = 5;
                state.totalPages = Math.ceil(totalCount / limit);
            })
            .addCase(fetchCategories.fulfilled, (state, action: PayloadAction<string[]>) => {
                state.categories = action.payload;
            });
    },
});

export const { setCurrentPage, setSearchTerm, setSelectedCategory } = productSlice.actions;
export default productSlice.reducer;
