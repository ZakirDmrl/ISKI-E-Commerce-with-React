// src/store/cartSlice.ts
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Product, CartItem } from '../types';
import { supabase } from '../supabaseClient';
import type { RootState } from './store';

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

// Supabase'den kullanıcının sepetini çekme
export const fetchCartItems = createAsyncThunk<CartItem[], string>(
    'cart/fetchCartItems',
    async (userId, { rejectWithValue }) => {
        try {
            let { data: cartData, error: cartError } = await supabase
                .from('carts')
                .select('id')
                .eq('user_id', userId)
                .single();

            if (cartError && cartError.code === 'PGRST116') {
                const { data: newCartData, error: newCartError } = await supabase
                    .from('carts')
                    .insert({ user_id: userId })
                    .select('id')
                    .single();
                if (newCartError) throw new Error(newCartError.message);
                cartData = newCartData;
            } else if (cartError) {
                throw new Error(cartError.message);
            }

            const { data, error } = await supabase
                .from('cart_items')
                .select('*, products(id, title, price, description, category, image, rating)')
                .eq('cart_id', cartData!.id);

            if (error) throw new Error(error.message);

            const formattedItems: CartItem[] = data.map((item) => ({
                ...item.products,
                id: item.products.id,
                quantity: item.quantity,
            }));
            return formattedItems;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Sepetteki ürün miktarını azaltma veya ürünü tamamen kaldırma
export const decrementCartItemQuantity = createAsyncThunk(
    'cart/decrementCartItemQuantity',
    async ({ productId, userId }: { productId: number, userId: string }, { getState, rejectWithValue }) => {
        try {
            const state = getState() as RootState;
            const existingItem = state.cart.items.find(item => item.id === productId);

            if (!existingItem) {
                throw new Error('Ürün sepette bulunamadı.');
            }

            const { data: cartData, error: cartError } = await supabase
                .from('carts')
                .select('id')
                .eq('user_id', userId)
                .single();
            if (cartError) throw new Error(cartError.message);

            if (existingItem.quantity > 1) {
                const newQuantity = existingItem.quantity - 1;
                await supabase
                    .from('cart_items')
                    .update({ quantity: newQuantity })
                    .eq('cart_id', cartData.id)
                    .eq('product_id', productId);
            } else {
                await supabase
                    .from('cart_items')
                    .delete()
                    .eq('cart_id', cartData.id)
                    .eq('product_id', productId);
            }

            const { data: updatedCartItemsData, error: updatedCartError } = await supabase
                .from('cart_items')
                .select('*, products(id, title, price, description, category, image, rating)')
                .eq('cart_id', cartData.id);

            if (updatedCartError) throw new Error(updatedCartError.message);

            const formattedItems = updatedCartItemsData.map((item) => ({
                ...item.products,
                id: item.products.id,
                quantity: item.quantity
            }));
            return formattedItems;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Sepete ürün ekleme veya güncelleme
export const addOrUpdateCartItem = createAsyncThunk<CartItem[], { product: Product, userId: string }>(
    'cart/addOrUpdateCartItem',
    async ({ product, userId }, { rejectWithValue }) => {
        try {
            let { data: cartData, error: cartError } = await supabase
                .from('carts')
                .select('id')
                .eq('user_id', userId)
                .single();

            if (cartError && cartError.code === 'PGRST116') {
                const { data: newCartData, error: newCartError } = await supabase
                    .from('carts')
                    .insert([{ user_id: userId }])
                    .select('id')
                    .single();
                if (newCartError) throw new Error(newCartError.message);
                cartData = newCartData;
            } else if (cartError) {
                throw new Error(cartError.message);
            }

            const { data: existingCartItem, error: existingItemError } = await supabase
                .from('cart_items')
                .select('*')
                .eq('cart_id', cartData!.id)
                .eq('product_id', product.id)
                .single();

            if (existingItemError && existingItemError.code !== 'PGRST116') {
                throw new Error(existingItemError.message);
            }

            if (existingCartItem) {
                const newQuantity = existingCartItem.quantity + 1;
                await supabase
                    .from('cart_items')
                    .update({ quantity: newQuantity })
                    .eq('cart_id', cartData!.id)
                    .eq('product_id', product.id);
            } else {
                await supabase
                    .from('cart_items')
                    .insert([
                        { cart_id: cartData!.id, product_id: product.id, quantity: 1 }
                    ]);
            }

            const { data: updatedCartItemsData, error: updatedCartError } = await supabase
                .from('cart_items')
                .select('*, products(id, title, price, description, category, image, rating)')
                .eq('cart_id', cartData!.id);

            if (updatedCartError) throw new Error(updatedCartError.message);

            const formattedItems: CartItem[] = updatedCartItemsData.map((item) => ({
                ...item.products,
                id: item.products.id,
                quantity: item.quantity
            }));
            return formattedItems;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Sepetten bir ürünü tamamen kaldırma
export const removeCartItem = createAsyncThunk(
    'cart/removeCartItem',
    async ({ productId, userId }: { productId: number, userId: string }, { rejectWithValue }) => {
        try {
            const { data: cartData, error: cartError } = await supabase
                .from('carts')
                .select('id')
                .eq('user_id', userId)
                .single();
            if (cartError) throw new Error(cartError.message);

            await supabase
                .from('cart_items')
                .delete()
                .eq('cart_id', cartData.id)
                .eq('product_id', productId);

            const { data: updatedCartItemsData, error: updatedCartError } = await supabase
                .from('cart_items')
                .select('*, products(id, title, price, description, category, image, rating)')
                .eq('cart_id', cartData.id);

            if (updatedCartError) throw new Error(updatedCartError.message);

            const formattedItems = updatedCartItemsData.map((item) => ({
                ...item.products,
                id: item.products.id,
                quantity: item.quantity
            }));
            return formattedItems;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Redux Slice
const cartSlice = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        clearCart: (state) => {
            state.items = [];
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchCartItems.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchCartItems.fulfilled, (state, action: PayloadAction<CartItem[]>) => {
                state.status = 'succeeded';
                state.items = action.payload;
            })
            .addCase(fetchCartItems.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
            })
            .addCase(addOrUpdateCartItem.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(addOrUpdateCartItem.fulfilled, (state, action: PayloadAction<CartItem[]>) => {
                state.status = 'succeeded';
                state.items = action.payload;
            })
            .addCase(addOrUpdateCartItem.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
            })
            .addCase(decrementCartItemQuantity.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(decrementCartItemQuantity.fulfilled, (state, action: PayloadAction<CartItem[]>) => {
                state.status = 'succeeded';
                state.items = action.payload;
            })
            .addCase(decrementCartItemQuantity.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
            })
            .addCase(removeCartItem.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(removeCartItem.fulfilled, (state, action: PayloadAction<CartItem[]>) => {
                state.status = 'succeeded';
                state.items = action.payload;
            })
            .addCase(removeCartItem.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload as string;
            });
    },
});

export const { clearCart } = cartSlice.actions;
export default cartSlice.reducer;
