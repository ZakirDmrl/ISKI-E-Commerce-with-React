// src/pages/CartPage.tsx
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store/store';
import { decrementQuantity, removeFromCart } from '../store/cartSlice';
import { setNotification, clearNotification } from '../store/notificationSlice'; // Yeni import

const CartPage = () => {
	const dispatch = useDispatch<AppDispatch>();
	const cartItems = useSelector((state: RootState) => state.cart.items);

	const handleDecrement = (productId: number) => {
		// Ürünün bilgilerini bulmak için mevcut cartItems listesini kullan
		const item = cartItems.find(item => item.id === productId)
		if (!item) return; // Ürün bulunamassa işlem yapma
		// işlemi dispatch et
		dispatch(decrementQuantity(productId));

		// Bildirimi göster
		if (item.quantity > 1) {
			dispatch(setNotification({ message: `${item.title} sayısı azaltıldı.`, type: 'info' })); // Bilgilendirici mesaj
		} else {
			dispatch(setNotification({ message: `${item.title} sepetten kaldırıldı.`, type: 'error' })); // Hata/olumsuz işlem
		}
		// Bilirlenen süre sonunda bildirimi kaldır
		setTimeout(() => {
			dispatch(clearNotification());
		}, 2000); // 2 saniye sonra bildirimi kaldır
	}

	const handleRemove = (productId: number) => {
		// ürünün bilgielerini bulmak için mevcut cartItems listesini kullan
		const item = cartItems.find(item => item.id === productId);
		if (!item) return; // Ürün bulunamazsa işlem yapma

		// İşlemi dispatch et
		dispatch(removeFromCart(productId));

		// Bildirimi göster
		dispatch(setNotification({ message: `${item.title} sepetten tamamen kaldırıldı.`, type: 'error' })); // Hata/olumsuz işlem
		// Bildirilen süre sonunda bildirimi kaldır
		setTimeout(() => {
			dispatch(clearNotification());
		}, 2000); // 2 saniye sonra bildirimi kaldır
	}

	return (
		<div>
			<h1>Sepetim</h1>
			{cartItems.length === 0 ? (
				<p>Sepetinizde ürün bulunmamaktadır.</p>
			) : (
				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
					{cartItems.map((item) => (
						<div key={item.id} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '5px', textAlign: 'center' }}>
							<img src={item.image} alt={item.title} style={{ width: '100px', height: '100px', objectFit: 'cover', marginBottom: '10px' }} />
							<h3>{item.title}</h3>
							<p>Fiyat: <strong>{item.price} TL</strong></p>
							<p>Adet: {item.quantity}</p>
							<div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '10px' }}>
								<button onClick={() => handleDecrement(item.id)} style={{ padding: '8px 12px', cursor: 'pointer' }}>-</button>
								<button onClick={() => handleRemove(item.id)} style={{ padding: '8px 12px', cursor: 'pointer' }}>Tamamen Kaldır</button>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default CartPage;	
