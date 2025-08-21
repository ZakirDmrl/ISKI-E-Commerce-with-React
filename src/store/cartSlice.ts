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

// Asenkoron Thunk'lar supabase ile iletişim için
// Supabase'den kullanıcının sepetini çekme
export const fetchCartItems = createAsyncThunk<CartItem[], string>(
	'cart/fetchCartItems',
	async (userId, { rejectWithValue }) => {
		try {
			// Önce kullanıcının sepetinini bul yoksa oluştur
			let { data: cartData, error: cartError } = await supabase
				.from('carts')
				.select('id')
				.eq('user_id', userId)
				.single();
			if (cartError && cartError.code === 'PGRST116') {
				// Eğer sepet bulunamazsa, yeni bir sepet oluştur
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
			// Sepet Id ile ürünleri çek
			const { data, error } = await supabase
				.from('cart_items')
				.select(`
                    *,
                    products (id, title, price, description, category, image, rating)
                `)
				.eq('cart_id', cartData!.id);
			if (error) throw new Error(error.message);

			// Gelen veriyi CartItem tipine dönüştür
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

			// Kullanıcının sepetini bul
			const { data: cartData, error: cartError } = await supabase
				.from('carts')
				.select('id')
				.eq('user_id', userId)
				.single();
			if (cartError) throw new Error(cartError.message);

			if (existingItem.quantity > 1) {
				// Miktarı 1'den büyükse azalt
				const newQuantity = existingItem.quantity - 1;
				await supabase
					.from('cart_items')
					.update({ quantity: newQuantity })
					.eq('cart_id', cartData.id)
					.eq('product_id', productId);
			} else {
				// Miktar 1 ise ürünü tamamen sil
				await supabase
					.from('cart_items')
					.delete()
					.eq('cart_id', cartData.id)
					.eq('product_id', productId);
			}

			// Güncel sepeti veritabanından tekrar çek
			const { data: updatedCartItemsData, error: updatedCartError } = await supabase
				.from('cart_items')
				.select(`
                    *,
                    products (id, title, price, description, category, image, rating)
                `)
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
// Sepete ürün ekleme veya güncelleme
export const addOrUpdateCartItem = createAsyncThunk<CartItem[], { product: Product, userId: string }>(
	'cart/addOrUpdateCartItem',
	async ({ product, userId }, { rejectWithValue }) => { // Artık getState kullanmıyoruz, çünkü veritabanından kontrol edeceğiz
		try {
			// Kullanıcının sepetini al veya oluştur
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

			// Veritabanında ürünün sepette olup olmadığını kontrol et
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
				// Eğer ürün veritabanında varsa, miktarını güncelle
				const newQuantity = existingCartItem.quantity + 1;
				await supabase
					.from('cart_items')
					.update({ quantity: newQuantity })
					.eq('cart_id', cartData!.id)
					.eq('product_id', product.id);
			} else {
				// Eğer ürün veritabanında yoksa, yeni ürün ekle
				await supabase
					.from('cart_items')
					.insert([
						{ cart_id: cartData!.id, product_id: product.id, quantity: 1 }
					]);
			}

			// İşlem başarılıysa, güncellenmiş sepeti tekrar çek
			const { data: updatedCartItemsData, error: updatedCartError } = await supabase
				.from('cart_items')
				.select(`
                    *,
                    products (id, title, price, description, category, image, rating)
                `)
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
			// Kullanıcının sepetini bul
			const { data: cartData, error: cartError } = await supabase
				.from('carts')
				.select('id')
				.eq('user_id', userId)
				.single();
			if (cartError) throw new Error(cartError.message);

			// Ürünü sepetten sil
			await supabase
				.from('cart_items')
				.delete()
				.eq('cart_id', cartData.id)
				.eq('product_id', productId);

			// Güncel sepeti veritabanından tekrar çek
			const { data: updatedCartItemsData, error: updatedCartError } = await supabase
				.from('cart_items')
				.select(`
                    *,
                    products (id, title, price, description, category, image, rating)
                `)
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
		// Redux'un sepetini temizleme
		clearCart: (state) => {
			state.items = [];
		}
	},
	extraReducers: (builder) => {
		builder
			// Sepet verilerini çekme
			.addCase(fetchCartItems.pending, (state) => {
				state.status = 'loading';
			})
			.addCase(fetchCartItems.fulfilled, (state, action: PayloadAction<CartItem[]>) => {
				state.status = 'succeeded';
				state.items = action.payload; // Sepeti gelen verilerle değiştir
			})
			.addCase(fetchCartItems.rejected, (state, action) => {
				state.status = 'failed';
				state.error = action.payload as string;
			})
			// Sepete ekleme
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
			// Yeni eklenen thunk için case'ler
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
				state.items = action.payload; // Güncel sepeti state'e yaz
			})
			.addCase(removeCartItem.rejected, (state, action) => {
				state.status = 'failed';
				state.error = action.payload as string;
			});
	},
});

export const { clearCart } = cartSlice.actions;
export default cartSlice.reducer;
