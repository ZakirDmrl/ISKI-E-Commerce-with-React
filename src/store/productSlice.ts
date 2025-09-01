// src/store/productSlice.ts
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '../supabaseClient';
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

// Stok bilgisi ile birlikte ürünleri çek
// createAsyncThunk Redux’ta asenkron işlemleri (API çağrısı, veri çekme, kaydetme vb.) yönetmek için kullanılır.
export const fetchProducts = createAsyncThunk<
    ProductWithStock[], 
    { page: number, limit: number, searchTerm: string, category: string | null, stockFilter: StockStatus | null }
>(
    'products/fetchProducts',
    async ({ page, limit, searchTerm, category, stockFilter }, { rejectWithValue }) => {
        try {
            const start = (page - 1) * limit;
            const end = start + limit - 1;
            
            // Ürünleri stok bilgisi ile birlikte çek
            let query = supabase
                .from('products')
                .select(`
                    *,
                    inventory:inventory(
                        id,
                        quantity,
                        reserved_quantity,
                        min_stock_level,
                        max_stock_level,
                        cost_price,
                        updated_at
                    )
                `)
                .eq('is_active', true);

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

            // Stok durumunu hesapla ve filtrele
            const productsWithStock: ProductWithStock[] = (data || []).map(product => {
                const inventory = Array.isArray(product.inventory) ? product.inventory[0] : product.inventory;
                const availableStock = inventory ? inventory.quantity - inventory.reserved_quantity : 0;
                
                let stockStatus: StockStatus = 'IN_STOCK';
                if (availableStock <= 0) {
                    stockStatus = 'OUT_OF_STOCK';
                } else if (inventory && availableStock <= inventory.min_stock_level) {
                    stockStatus = 'LOW_STOCK';
                }

                return {
                    ...product,
                    inventory,
                    available_stock: availableStock,
                    stock_status: stockStatus
                };
            });

            // Stok durumu filtresi uygula
            const filteredProducts = stockFilter 
                ? productsWithStock.filter(p => p.stock_status === stockFilter)
                : productsWithStock;

            return filteredProducts;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Toplam ürün sayısını çek (stok filtresi ile)
export const fetchTotalProductsCount = createAsyncThunk<
    number, 
    { searchTerm: string, category: string | null, stockFilter: StockStatus | null }
>(
    'products/fetchTotalProductsCount',
    async ({ searchTerm, category, stockFilter }, { rejectWithValue }) => {
        try {
            let query = supabase
                .from('products')
                .select('*, inventory:inventory(*)', { count: 'exact', head: true })
                .eq('is_active', true);
            
            if (searchTerm) {
                query = query.ilike('title', `%${searchTerm}%`);
            }
            if (category) {
                query = query.eq('category', category);
            }

            const { count, error } = await query;

            if (error) {
                throw new Error(error.message);
            }

            // Stok filtresi varsa, gerçek sayıyı hesaplamak için tüm veriyi çekip filtrelemeliyiz
            if (stockFilter) {
                const { data: allData } = await supabase
                    .from('products')
                    .select('*, inventory:inventory(*)')
                    .eq('is_active', true);

                if (!allData) return 0;

                const filteredCount = allData.filter(product => {
                    const inventory = Array.isArray(product.inventory) ? product.inventory[0] : product.inventory;
                    const availableStock = inventory ? inventory.quantity - inventory.reserved_quantity : 0;
                    
                    let stockStatus: StockStatus = 'IN_STOCK';
                    if (availableStock <= 0) {
                        stockStatus = 'OUT_OF_STOCK';
                    } else if (inventory && availableStock <= inventory.min_stock_level) {
                        stockStatus = 'LOW_STOCK';
                    }
                    
                    return stockStatus === stockFilter;
                }).length;

                return filteredCount;
            }

            return count as number;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Kategorileri çek
export const fetchCategories = createAsyncThunk<string[], void>(
    'products/fetchCategories',
    async (_, { rejectWithValue }) => {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('category')
                .eq('is_active', true);
                
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

// Düşük stok sayısını çek
export const fetchLowStockCount = createAsyncThunk<number, void>(
    'products/fetchLowStockCount',
    async (_, { rejectWithValue }) => {
        try {
            const { data, error } = await supabase
                .from('low_stock_products')
                .select('*', { count: 'exact', head: true });

            if (error) {
                throw new Error(error.message);
            }

            return (data as any) || 0;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Stok durumunu kontrol et
export const checkProductStock = createAsyncThunk<
    number, 
    { productId: number, quantity: number }
>(
    'products/checkProductStock',
    async ({ productId, quantity }, { rejectWithValue }) => {
        try {
            const { data, error } = await supabase
                .rpc('get_available_stock', { product_id_param: productId });

            if (error) {
                throw new Error(error.message);
            }

            const availableStock = data || 0;
            if (availableStock < quantity) {
                throw new Error(`Yetersiz stok. Mevcut: ${availableStock}, İstenen: ${quantity}`);
            }

            return availableStock;
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
