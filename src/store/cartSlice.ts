// src/store/cartSlice.ts - Tamamen düzeltilmiş versiyon
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '../supabaseClient';
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

// Sepet öğelerini çek (düzeltilmiş)
export const fetchCartItems = createAsyncThunk<CartItem[], string>(
	'cart/fetchCartItems',
	async (userId: string, { rejectWithValue }) => {
		try {
			// Önce kullanıcının cart'ını bul veya oluştur
			let { data: cartData, error: cartError } = await supabase
				.from('carts')
				.select('id')
				.eq('user_id', userId)
				.single();

			if (cartError) {
				// Cart yoksa oluştur
				const { data: newCart, error: createError } = await supabase
					.from('carts')
					.insert([{ user_id: userId }])
					.select('id')
					.single();

				if (createError) {
					throw new Error(`Cart oluşturulamadı: ${createError.message}`);
				}
				cartData = newCart;
			}

			if (!cartData) {
				return [];
			}

			// Cart items'ları çek - JOIN kullan
			const { data, error } = await supabase
				.from('cart_items')
				.select(`
                    id,
                    cart_id,
                    product_id,
                    quantity,
                    created_at,
                    products!cart_items_product_id_fkey (
                        id,
                        title,
                        description,
                        price,
                        image,
                        category,
                        sku,
                        rating,
                        rating_count,
                        is_active
                    )
                `)
				.eq('cart_id', cartData.id);

			if (error) {
				console.error('Sepet öğeleri çekilemedi:', error);
				throw new Error(error.message);
			}

			// Veriyi uygun formata çevir
			const formattedItems: CartItem[] = (data || [])
				.filter(item => item.products && item.products.is_active !== false)
				.map(item => ({
					id: item.id,
					cart_id: item.cart_id,
					product_id: item.product_id,
					quantity: item.quantity,
					created_at: item.created_at,
					product: Array.isArray(item.products) ? item.products[0] : item.products
				}));

			return formattedItems;
		} catch (error) {
			console.error('fetchCartItems hata:', error);
			return rejectWithValue(error.message);
		}
	}
);

// Sepete ürün ekle veya güncelle (düzeltilmiş)
export const addOrUpdateCartItem = createAsyncThunk<
	CartItem,
	{ product: Product | ProductWithStock; userId: string; quantity?: number }
>(
	'cart/addOrUpdateCartItem',
	async ({ product, userId, quantity = 1 }, { rejectWithValue }) => {
		try {
			// Önce stok kontrolü yap (ürün stok bilgisi varsa)
			if ('available_stock' in product && product.available_stock !== undefined) {
				if (product.available_stock < quantity) {
					throw new Error(`Yetersiz stok. Mevcut: ${product.available_stock}, İstenen: ${quantity}`);
				}
			}

			// Kullanıcının cart'ını bul veya oluştur
			let { data: cartData, error: cartError } = await supabase
				.from('carts')
				.select('id')
				.eq('user_id', userId)
				.single();

			if (cartError) {
				const { data: newCart, error: createError } = await supabase
					.from('carts')
					.insert([{ user_id: userId }])
					.select('id')
					.single();

				if (createError) {
					throw new Error(`Cart oluşturulamadı: ${createError.message}`);
				}
				cartData = newCart;
			}

			if (!cartData) {
				throw new Error('Cart verisi alınamadı');
			}

			// Mevcut cart item'ı kontrol et
			const { data: existingItem } = await supabase
				.from('cart_items')
				.select('id, quantity')
				.eq('cart_id', cartData.id)
				.eq('product_id', product.id)
				.single();

			let cartItemData;
			if (existingItem) {
				// Mevcut item'ı güncelle
				const { data, error } = await supabase
					.from('cart_items')
					.update({ quantity: existingItem.quantity + quantity })
					.eq('id', existingItem.id)
					.select(`
                        id,
                        cart_id,
                        product_id,
                        quantity,
                        created_at
                    `)
					.single();

				if (error) {
					throw new Error(`Sepet güncellenemedi: ${error.message}`);
				}
				cartItemData = data;
			} else {
				// Yeni item ekle
				const { data, error } = await supabase
					.from('cart_items')
					.insert([{
						cart_id: cartData.id,
						product_id: product.id,
						quantity: quantity
					}])
					.select(`
                        id,
                        cart_id,
                        product_id,
                        quantity,
                        created_at
                    `)
					.single();

				if (error) {
					throw new Error(`Sepete eklenemedi: ${error.message}`);
				}
				cartItemData = data;
			}

			// Product bilgisini manuel ekle (JOIN sorunları için)
			const result: CartItem = {
				...cartItemData,
				product: {
					id: product.id,
					title: product.title,
					description: product.description,
					price: product.price,
					image: product.image,
					category: product.category,
					sku: product.sku,
					rating: product.rating,
					rating_count: product.rating_count,
					is_active: product.is_active,
					created_at: product.created_at,
					updated_at: product.updated_at
				}
			};

			return result;
		} catch (error) {
			console.error('addOrUpdateCartItem hata:', error);
			return rejectWithValue(error.message);
		}
	}
);

// Sepet öğesi miktarını azalt (düzeltilmiş)
export const decrementCartItemQuantity = createAsyncThunk<
	{ productId: number; newQuantity: number },
	{ productId: number; userId: string }
>(
	'cart/decrementCartItemQuantity',
	async ({ productId, userId }, { rejectWithValue }) => {
		try {
			// Kullanıcının cart'ını bul
			const { data: cartData, error: cartError } = await supabase
				.from('carts')
				.select('id')
				.eq('user_id', userId)
				.single();

			if (cartError || !cartData) {
				throw new Error('Sepet bulunamadı');
			}

			// Mevcut cart item'ı bul
			const { data: existingItem, error: findError } = await supabase
				.from('cart_items')
				.select('id, quantity')
				.eq('cart_id', cartData.id)
				.eq('product_id', productId)
				.single();

			if (findError || !existingItem) {
				throw new Error('Sepet öğesi bulunamadı');
			}

			if (existingItem.quantity <= 1) {
				// Miktar 1 ise tamamen kaldır
				const { error } = await supabase
					.from('cart_items')
					.delete()
					.eq('id', existingItem.id);

				if (error) {
					throw new Error(`Ürün kaldırılamadı: ${error.message}`);
				}

				return { productId, newQuantity: 0 };
			} else {
				// Miktarı azalt
				const { error } = await supabase
					.from('cart_items')
					.update({ quantity: existingItem.quantity - 1 })
					.eq('id', existingItem.id);

				if (error) {
					throw new Error(`Miktar azaltılamadı: ${error.message}`);
				}

				return { productId, newQuantity: existingItem.quantity - 1 };
			}
		} catch (error) {
			console.error('decrementCartItemQuantity hata:', error);
			return rejectWithValue(error.message);
		}
	}
);

// Sepetten ürün kaldır (düzeltilmiş)
export const removeCartItem = createAsyncThunk<
	number,
	{ productId: number; userId: string }
>(
	'cart/removeCartItem',
	async ({ productId, userId }, { rejectWithValue }) => {
		try {
			console.log('removeCartItem çağrıldı:', { productId, userId });

			if (!productId || productId === undefined) {
				throw new Error('Geçersiz product ID');
			}

			// Kullanıcının cart'ını bul
			const { data: cartData, error: cartError } = await supabase
				.from('carts')
				.select('id')
				.eq('user_id', userId)
				.single();

			if (cartError || !cartData) {
				throw new Error('Sepet bulunamadı');
			}

			console.log('Cart bulundu:', cartData.id);

			// Cart item'ı sil
			const { error } = await supabase
				.from('cart_items')
				.delete()
				.eq('cart_id', cartData.id)
				.eq('product_id', productId);

			if (error) {
				throw new Error(`Ürün sepetten kaldırılamadı: ${error.message}`);
			}

			console.log('Ürün başarıyla kaldırıldı:', productId);
			return productId;
		} catch (error) {
			console.error('removeCartItem hata:', error);
			return rejectWithValue(error.message);
		}
	}
);

// createOrder fonksiyonu (bonus - sipariş oluşturma için)
export const createOrder = createAsyncThunk<
	void,
	{ userId: string; cartItems: CartItem[]; totalAmount: number }
>(
	'cart/createOrder',
	async ({ userId, cartItems, totalAmount }, { rejectWithValue }) => {
		try {
			// Sipariş oluştur
			const { data: orderData, error: orderError } = await supabase
				.from('orders')
				.insert([{
					user_id: userId,
					total_amount: totalAmount,
					status: 'pending'
				}])
				.select('id')
				.single();

			if (orderError || !orderData) {
				throw new Error(`Sipariş oluşturulamadı: ${orderError?.message}`);
			}

			// Sipariş öğelerini ekle
			const orderItems = cartItems.map(item => ({
				order_id: orderData.id,
				product_id: item.product_id,
				quantity: item.quantity,
				unit_price: item.product?.price || 0,
				total_price: (item.product?.price || 0) * item.quantity
			}));

			const { error: itemsError } = await supabase
				.from('order_items')
				.insert(orderItems);

			if (itemsError) {
				throw new Error(`Sipariş öğeleri eklenemedi: ${itemsError.message}`);
			}

			// Sepeti temizle
			const { data: cartData } = await supabase
				.from('carts')
				.select('id')
				.eq('user_id', userId)
				.single();

			if (cartData) {
				await supabase
					.from('cart_items')
					.delete()
					.eq('cart_id', cartData.id);
			}

			// Sipariş durumunu 'completed' olarak güncelle (stok düşürme trigger'ı için)
			await supabase
				.from('orders')
				.update({ status: 'completed' })
				.eq('id', orderData.id);

		} catch (error) {
			console.error('createOrder hata:', error);
			return rejectWithValue(error.message);
		}
	}
);

// Redux slice
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
			// 🔹 fetchCartItems (Sepeti yükle)
			// Sepet öğeleri çekilirken (bekleme aşaması)
			.addCase(fetchCartItems.pending, (state) => {
				state.status = 'loading';   // işlem devam ediyor
				state.error = null;         // hata sıfırlanır
			})
			// Sepet öğeleri başarıyla çekildiğinde
			.addCase(fetchCartItems.fulfilled, (state, action) => {
				state.status = 'succeeded'; // işlem başarılı
				state.items = action.payload; // gelen ürünler state’e yazılır
				state.error = null;         // hata yok
			})
			// Sepet öğeleri alınırken hata oluştuğunda
			.addCase(fetchCartItems.rejected, (state, action) => {
				state.status = 'failed';              // işlem başarısız
				state.error = action.payload as string; // hata mesajı kaydedilir
			})

			// 🔹 addOrUpdateCartItem (Sepete ekle veya güncelle)
			// Sepete ürün eklenirken veya güncellenirken (bekleme aşaması)
			.addCase(addOrUpdateCartItem.pending, (state) => {
				state.error = null; // hata sıfırlanır
			})
			// Sepete ürün ekleme/güncelleme başarılı olduğunda
			.addCase(addOrUpdateCartItem.fulfilled, (state, action) => {
				const newItem = action.payload; // eklenen/güncellenen ürün
				const existingItemIndex = state.items.findIndex(
					item => item.product_id === newItem.product_id
				);

				if (existingItemIndex !== -1) {
					// Eğer ürün zaten varsa → güncelle
					state.items[existingItemIndex] = newItem;
				} else {
					// Yoksa → yeni ürün olarak ekle
					state.items.push(newItem);
				}
				state.error = null;
			})
			// Sepete ekleme/güncelleme başarısız olduğunda
			.addCase(addOrUpdateCartItem.rejected, (state, action) => {
				state.error = action.payload as string; // hata mesajı kaydedilir
			})

			// 🔹 decrementCartItemQuantity (Sepette ürün miktarını azalt)
			// Azaltma başarılı olduğunda
			.addCase(decrementCartItemQuantity.fulfilled, (state, action) => {
				const { productId, newQuantity } = action.payload;

				if (newQuantity === 0) {
					// Eğer miktar 0 olduysa → ürünü sepetten çıkar
					state.items = state.items.filter(item => item.product_id !== productId);
				} else {
					// Yoksa → sadece miktarı güncelle
					const item = state.items.find(item => item.product_id === productId);
					if (item) {
						item.quantity = newQuantity;
					}
				}
				state.error = null;
			})
			// Azaltma başarısız olduğunda
			.addCase(decrementCartItemQuantity.rejected, (state, action) => {
				state.error = action.payload as string; // hata mesajı kaydedilir
			})

			// 🔹 removeCartItem (Sepetten ürünü tamamen sil)
			// Silme başarılı olduğunda
			.addCase(removeCartItem.fulfilled, (state, action) => {
				const productId = action.payload;
				// Belirtilen ürün sepetten çıkarılır
				state.items = state.items.filter(item => item.product_id !== productId);
				state.error = null;
			})
			// Silme başarısız olduğunda
			.addCase(removeCartItem.rejected, (state, action) => {
				state.error = action.payload as string; // hata mesajı kaydedilir
			})

			// 🔹 createOrder (Sipariş oluştur)
			// Sipariş başarılı olduğunda
			.addCase(createOrder.fulfilled, (state) => {
				state.items = [];   // sipariş tamamlandığında sepet temizlenir
				state.error = null; // hata sıfırlanır
			})
			// Sipariş başarısız olduğunda
			.addCase(createOrder.rejected, (state, action) => {
				state.error = action.payload as string; // hata mesajı kaydedilir
			});
	},
});

export const { clearCart, setCartError, clearError } = cartSlice.actions;
export default cartSlice.reducer;
