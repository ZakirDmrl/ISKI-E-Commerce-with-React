// src/pages/HomePage.tsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { type RootState, type AppDispatch } from '../store/store';
import { fetchProducts } from '../store/productSlice';
import { addOrUpdateCartItem } from '../store/cartSlice';
import { clearNotification, setNotification } from '../store/notificationSlice';
import ProductCard from '../components/ProductCard';

const HomePage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { products, status, error } = useSelector((state: RootState) => state.products);
    const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        if (status === 'idle') {
            dispatch(fetchProducts({ page: 1, limit: 20 }));
        }
    }, [status, dispatch]);

	const handleAddToCart = (product) => {
        if (!isAuthenticated || !user) {
            dispatch(setNotification({ message: 'Sepete ürün eklemek için giriş yapmalısınız.', type: 'error' }));
            setTimeout(() => dispatch(clearNotification()), 3000); // Bildirimi 3 saniye sonra kaldır
            return;
        }

        dispatch(addOrUpdateCartItem({ product, userId: user.id }))
            .unwrap()
            .then(() => {
                dispatch(setNotification({ message: `${product.title} sepete eklendi!`, type: 'success' }));
                setTimeout(() => dispatch(clearNotification()), 3000); // Bildirimi 3 saniye sonra kaldır
            })
            .catch((err) => {
                dispatch(setNotification({ message: `Sepete eklenirken hata oluştu: ${err.message}`, type: 'error' }));
                setTimeout(() => dispatch(clearNotification()), 3000); // Bildirimi 3 saniye sonra kaldır
            });
    };

    if (status === 'loading') {
        return <p>Ürünler yükleniyor...</p>;
    }

    if (status === 'failed') {
        return <p>Ürünler yüklenirken bir hata oluştu: {error}</p>;
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', padding: '20px' }}>
            {products.map((product) => (
                <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
            ))}
        </div>
    );
};

export default HomePage;
