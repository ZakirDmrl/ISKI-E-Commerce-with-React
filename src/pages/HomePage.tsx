// src/pages/HomePage.tsx
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { type RootState, type AppDispatch } from '../store/store';
import { fetchProducts } from '../store/productSlice';
import { addToCart } from '../store/cartSlice';
import ProductCard from '../components/ProductCard';
import type { Product } from '../types';
import { clearNotification, setNotification } from '../store/notificationSlice';

const HomePage = () => {
	const dispatch = useDispatch<AppDispatch>();
	const { products, status, error } = useSelector((state: RootState) => state.products);

	useEffect(() => {
		if (status === 'idle') {
			dispatch(fetchProducts());
		}
	}, [status, dispatch]);

	const handleAddToCart = (product: Product) => {
		dispatch(addToCart(product));
		dispatch(setNotification({ message: `${product.title} sepete eklendi!`, type: 'success' })); // Olumlu işlem bildirimi

		setTimeout(() => {
			dispatch(clearNotification());
		}, 3000); // 3 saniye sonra bildirimi kaldır
	};

	if (status === 'loading') {
		return <div>Ürünler yükleniyor...</div>;
	}

	if (status === 'failed') {
		return <div>Hata: {error}</div>;
	}

	return (
		<div>
			<h1>Ürünler</h1>
			<div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
				{products.map((product) => (
					<ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
				))}
			</div>
		</div>
	);
};

export default HomePage;
