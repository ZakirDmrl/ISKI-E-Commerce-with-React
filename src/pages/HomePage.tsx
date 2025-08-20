// src/pages/HomePage.tsx
import React, { useEffect, useState } from 'react';
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
    const [page, setPage] = useState(1);
    const limit = 7;

    useEffect(() => {
        dispatch(fetchProducts({ page: page, limit: limit }));
    }, [page, dispatch]);

    const handleAddToCart = (product: Product) => {
        dispatch(addToCart(product));
        dispatch(setNotification({ message: `${product.title} sepete eklendi!`, type: 'success' }));

        setTimeout(() => {
            dispatch(clearNotification());
        }, 3000);
    };

    // Yüklenme durumunu butonun dışında kontrol et
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
            {/* Sayfalama butonu */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                <button
                    onClick={() => setPage(prevPage => prevPage + 1)}
                    disabled={status === 'loading'}
                    style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}
                >
                    {status === 'loading' ? 'Yükleniyor...' : 'Daha Fazla Ürün Yükle'}
                </button>
            </div>
        </div>
    );
};

export default HomePage;
