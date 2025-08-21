// src/pages/HomePage.tsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { type RootState, type AppDispatch } from '../store/store';
import { fetchProducts, fetchTotalProductsCount, fetchCategories, setCurrentPage, setSearchTerm, setSelectedCategory } from '../store/productSlice';
import { addOrUpdateCartItem } from '../store/cartSlice';
import { setNotification, clearNotification } from '../store/notificationSlice';
import ProductCard from '../components/ProductCard';
import type { Product } from '../types';

const HomePage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { products, status, error, currentPage, totalPages, searchTerm, selectedCategory, categories } = useSelector((state: RootState) => state.products);
    const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

    const productsPerPage = 5;

    useEffect(() => {
        dispatch(fetchTotalProductsCount({ searchTerm: searchTerm, category: selectedCategory }));
        dispatch(fetchCategories());
    }, [dispatch, searchTerm, selectedCategory]);

    useEffect(() => {
        dispatch(fetchProducts({ page: currentPage, limit: productsPerPage, searchTerm, category: selectedCategory }));
    }, [dispatch, currentPage, searchTerm, selectedCategory]);

    const handleAddToCart = (product: Product) => {
        if (!isAuthenticated || !user) {
            dispatch(setNotification({ message: 'Sepete ürün eklemek için giriş yapmalısınız.', type: 'error' }));
            setTimeout(() => dispatch(clearNotification()), 3000);
            return;
        }

        dispatch(addOrUpdateCartItem({ product, userId: user.id }))
            .unwrap()
            .then(() => {
                dispatch(setNotification({ message: `${product.title} sepete eklendi!`, type: 'success' }));
                setTimeout(() => dispatch(clearNotification()), 3000);
            })
            .catch((err) => {
                dispatch(setNotification({ message: `Sepete eklenirken hata oluştu: ${err.message}`, type: 'error' }));
                setTimeout(() => dispatch(clearNotification()), 3000);
            });
    };

    const handlePageChange = (pageNumber: number) => {
        dispatch(setCurrentPage(pageNumber));
    };

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        dispatch(setSearchTerm(event.target.value));
    };

    const handleCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const value = event.target.value === '' ? null : event.target.value;
        dispatch(setSelectedCategory(value));
    };

    if (status === 'loading' && products.length === 0) {
        return <p style={{ textAlign: 'center', marginTop: '50px' }}>Ürünler yükleniyor...</p>;
    }

    if (status === 'failed') {
        return <p style={{ textAlign: 'center', marginTop: '50px' }}>Ürünler yüklenirken bir hata oluştu: {error}</p>;
    }

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                    type="text"
                    placeholder="Ürün Ara..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    style={{ padding: '10px', minWidth: '200px', flexGrow: 1, borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <select
                    value={selectedCategory || ''}
                    onChange={handleCategoryChange}
                    style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                    <option value="">Tüm Kategoriler</option>
                    {categories.map((category) => (
                        <option key={category} value={category}>{category}</option>
                    ))}
                </select>
            </div>
            
            {/* gridTemplateColumns: '1fr' olarak değiştirildi */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                {products.length > 0 ? (
                    products.map((product) => (
                        <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
                    ))
                ) : (
                    <p style={{ gridColumn: '1 / -1', textAlign: 'center' }}>Aradığınız kriterlere uygun ürün bulunamadı.</p>
                )}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', gap: '10px', flexWrap: 'wrap' }}>
                {[...Array(totalPages)].map((_, index) => (
                    <button
                        key={index + 1}
                        onClick={() => handlePageChange(index + 1)}
                        disabled={currentPage === index + 1}
                        style={{
                            padding: '10px 15px',
                            cursor: 'pointer',
                            backgroundColor: currentPage === index + 1 ? '#007bff' : '#f0f0f0',
                            color: currentPage === index + 1 ? 'white' : 'black',
                            border: '1px solid #ccc',
                            borderRadius: '4px'
                        }}
                    >
                        {index + 1}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default HomePage;
