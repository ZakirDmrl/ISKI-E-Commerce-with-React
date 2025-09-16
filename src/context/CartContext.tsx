// src/context/CartProvider.tsx
import React, { useState, type ReactNode } from 'react';
import { CartContext } from './context'; // Yeni context dosyasından import et
import type { CartItem, Product } from '../types';

// Provider bileşenini oluştur
export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
	// CartContext'te tanımlanan state ve fonksiyonları burada yönet
	const [cartItems, setCartItems] = useState<CartItem[]>([]);

	// Sepete ürün ekleme fonksiyonu
	const addToCart = (product: Product) => {
		setCartItems(prevItems => {
			const existingItem = prevItems.find(item => item.id === product.id);
			// 2. Eğer varsa, miktarını artır 
			if (existingItem) {
				return prevItems.map(item =>
					item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
				);
			}
			// 3. Eğer yoksa, yeni ürünü sepete ekle
			else {
				return [...prevItems, { ...product, quantity: 1 }];
			}
		});
	};

	const decrementQuantity = (productId: number) => {
		setCartItems(prevItems =>
			prevItems.map(item =>
				item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
			).filter(item => item.quantity > 0)
		);
	};

	const removeFromCart = (productId: number) => {
		setCartItems(prevItems => prevItems.filter(item => item.id !== productId));
	};

	const value = {
		cartItems,
		addToCart,
		decrementQuantity,
		removeFromCart,
	};

	return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
