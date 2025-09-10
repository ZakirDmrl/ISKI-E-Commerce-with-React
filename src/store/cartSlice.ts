// src/store/cartSlice.ts - TAM MİGRASYON
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '../config/api'; // Supabase yerine axios
import type { CartItem, Product, ProductWithStock } from '../types';

interface CartState {
    items: CartItem[];
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: CartState = {
    items: [],
    status: 'idle',
    error: null,
};

// ESKI: Supabase cart bulma + JOIN query
// YENI: Tek HTTP GET isteği
export const fetchCartItems = createAsyncThunk<CartItem[], string>(
    'cart/fetchCartItems',
    async (_userId: string, { rejectWithValue }) => {
        try {
            const response = await apiClient.get('/cart');
            return response.data.items;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.error || 'Sepet öğeleri alınamadı'
            );
        }
    }
);

// ESKI: Stok kontrolü + cart bulma + mevcut item kontrolü + insert/update
// YENI: Tek HTTP POST isteği (backend'de tüm logic)
export const addOrUpdateCartItem = createAsyncThunk<
    CartItem,
    { product: Product | ProductWithStock; userId: string; quantity?: number }
>(
    'cart/addOrUpdateCartItem',
    async ({ product, quantity = 1 }, { rejectWithValue }) => {
        try {
            const response = await apiClient.post('/cart/items', {
                product_id: product.id,
                quantity: quantity
            });
            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.error || 'Sepete eklenemedi'
            );
        }
    }
);

// ESKI: Cart bulma + item bulma + quantity kontrolü + update/delete
// YENI: Tek HTTP PUT isteği
export const decrementCartItemQuantity = createAsyncThunk<
    { productId: number; newQuantity: number },
    { productId: number; userId: string }
>(
    'cart/decrementCartItemQuantity',
    async ({ productId }, { rejectWithValue }) => {
        try {
            const response = await apiClient.put(`/cart/items/${productId}/decrement`);
            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.error || 'Miktar azaltılamadı'
            );
        }
    }
);

// ESKI: Cart bulma + cart item silme
// YENI: Tek HTTP DELETE isteği
export const removeCartItem = createAsyncThunk<
    number,
    { productId: number; userId: string }
>(
    'cart/removeCartItem',
    async ({ productId }, { rejectWithValue }) => {
        try {
            await apiClient.delete(`/cart/items/${productId}`);
            return productId;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.error || 'Ürün sepetten kaldırılamadı'
            );
        }
    }
);

// ESKI: Order insert + order_items insert + cart temizleme + status update
// YENI: Tek HTTP POST isteği (backend'de transaction)
export const createOrder = createAsyncThunk<
    void,
    { userId: string; cartItems: CartItem[]; totalAmount: number }
>(
    'cart/createOrder',
    async ({ cartItems, totalAmount }, { rejectWithValue }) => {
        try {
            await apiClient.post('/cart/checkout', {
                cart_items: cartItems,
                total_amount: totalAmount
            });
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.error || 'Sipariş oluşturulamadı'
            );
        }
    }
);

// Redux slice (extraReducers aynı kalıyor)
const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        clearCart: (state) => {
            state.items = [];
        },
        setCartError: (state, action: PayloadAction<string>) => {
            state.error = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // fetchCartItems
            .addCase(fetchCartItems.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(fetchCartItems.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.items = action.payload;
                state.error = null;
            })
            .addCase(fetchCartItems.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
            })

            // addOrUpdateCartItem
            .addCase(addOrUpdateCartItem.pending, (state) => {
                state.error = null;
            })
            .addCase(addOrUpdateCartItem.fulfilled, (state, action) => {
                const newItem = action.payload;
                const existingItemIndex = state.items.findIndex(
                    item => item.product_id === newItem.product_id
                );

                if (existingItemIndex !== -1) {
                    state.items[existingItemIndex] = newItem;
                } else {
                    state.items.push(newItem);
                }
                state.error = null;
            })
            .addCase(addOrUpdateCartItem.rejected, (state, action) => {
                state.error = action.payload as string;
            })

            // decrementCartItemQuantity
            .addCase(decrementCartItemQuantity.fulfilled, (state, action) => {
                const { productId, newQuantity } = action.payload;

                if (newQuantity === 0) {
                    state.items = state.items.filter(item => item.product_id !== productId);
                } else {
                    const item = state.items.find(item => item.product_id === productId);
                    if (item) {
                        item.quantity = newQuantity;
                    }
                }
                state.error = null;
            })
            .addCase(decrementCartItemQuantity.rejected, (state, action) => {
                state.error = action.payload as string;
            })

            // removeCartItem
            .addCase(removeCartItem.fulfilled, (state, action) => {
                const productId = action.payload;
                state.items = state.items.filter(item => item.product_id !== productId);
                state.error = null;
            })
            .addCase(removeCartItem.rejected, (state, action) => {
                state.error = action.payload as string;
            })

            // createOrder
            .addCase(createOrder.fulfilled, (state) => {
                state.items = [];
                state.error = null;
            })
            .addCase(createOrder.rejected, (state, action) => {
                state.error = action.payload as string;
            });
    },
});

export const { clearCart, setCartError, clearError } = cartSlice.actions;
export default cartSlice.reducer;
