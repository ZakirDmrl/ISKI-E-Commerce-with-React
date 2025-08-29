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

    const productsPerPage = 8; // Daha fazla ürün gösterelim

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
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '60vh',
                fontSize: '1.2rem',
                color: '#fff'
            }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '20px'
                }}>
                    <div className="loading-spinner" style={{
                        width: '50px',
                        height: '50px',
                        border: '4px solid #333',
                        borderTop: '4px solid #007bff',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }}></div>
                    Ürünler yükleniyor...
                </div>
            </div>
        );
    }

    if (status === 'failed') {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '60vh',
                flexDirection: 'column',
                gap: '20px',
                color: '#ff6b6b',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '3rem' }}>⚠️</div>
                <div style={{ fontSize: '1.2rem' }}>
                    Ürünler yüklenirken bir hata oluştu
                </div>
                <div style={{ fontSize: '0.9rem', color: '#ccc' }}>
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div style={{ 
            padding: '0',
            maxWidth: '1400px',
            margin: '0 auto'
        }}>
            {/* Hero Section */}
            <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '60px 40px',
                borderRadius: '20px',
                margin: '20px',
                marginBottom: '40px',
                textAlign: 'center',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
            }}>
                <h1 style={{
                    fontSize: '3rem',
                    fontWeight: '700',
                    margin: '0 0 20px 0',
                    background: 'linear-gradient(45deg, #fff, #e0e0e0)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                }}>
                    İSKİ E-Commerce
                </h1>
                <p style={{
                    fontSize: '1.3rem',
                    opacity: 0.9,
                    margin: 0,
                    color: '#fff'
                }}>
                    En kaliteli ürünleri keşfedin ve güvenli alışveriş yapın
                </p>
            </div>

            {/* Filters Section */}
            <div style={{ 
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '30px',
                margin: '20px',
                marginBottom: '40px',
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
                <div style={{ 
                    display: 'flex', 
                    gap: '20px', 
                    alignItems: 'center', 
                    flexWrap: 'wrap',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ flex: '1', minWidth: '300px' }}>
                        <input
                            type="text"
                            placeholder="🔍 Ürün ara..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            style={{ 
                                width: '100%',
                                padding: '15px 20px',
                                fontSize: '1rem',
                                borderRadius: '12px',
                                border: '2px solid rgba(255,255,255,0.1)',
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                color: '#fff',
                                outline: 'none',
                                transition: 'all 0.3s ease',
                                backdropFilter: 'blur(10px)'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#007bff';
                                e.target.style.boxShadow = '0 0 20px rgba(0,123,255,0.3)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>
                    <div>
                        <select
                            value={selectedCategory || ''}
                            onChange={handleCategoryChange}
                            style={{ 
                                padding: '15px 20px',
                                fontSize: '1rem',
                                borderRadius: '12px',
                                border: '2px solid rgba(255,255,255,0.1)',
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                color: '#fff',
                                outline: 'none',
                                cursor: 'pointer',
                                minWidth: '200px',
                                backdropFilter: 'blur(10px)'
                            }}
                        >
                            <option value="" style={{ backgroundColor: '#333', color: '#fff' }}>
                                📂 Tüm Kategoriler
                            </option>
                            {categories.map((category) => (
                                <option key={category} value={category} style={{ backgroundColor: '#333', color: '#fff' }}>
                                    {category}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
            
            {/* Products Grid */}
            <div style={{ 
                padding: '0 20px',
                marginBottom: '40px'
            }}>
                {products.length > 0 ? (
                    <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                        gap: '30px'
                    }}>
                        {products.map((product) => (
                            <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
                        ))}
                    </div>
                ) : (
                    <div style={{ 
                        textAlign: 'center',
                        padding: '60px 20px',
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '16px',
                        border: '2px dashed rgba(255,255,255,0.2)'
                    }}>
                        <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🔍</div>
                        <h3 style={{ fontSize: '1.5rem', marginBottom: '10px', color: '#fff' }}>
                            Ürün Bulunamadı
                        </h3>
                        <p style={{ color: '#ccc', fontSize: '1.1rem' }}>
                            Aradığınız kriterlere uygun ürün bulunmamaktadır.
                        </p>
                    </div>
                )}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    margin: '40px 20px',
                    gap: '10px', 
                    flexWrap: 'wrap'
                }}>
                    {currentPage > 1 && (
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            style={{
                                padding: '12px 20px',
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                color: '#fff',
                                border: '2px solid rgba(255,255,255,0.2)',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                transition: 'all 0.3s ease',
                                backdropFilter: 'blur(10px)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            ← Önceki
                        </button>
                    )}
                    
                    {[...Array(totalPages)].map((_, index) => {
                        const pageNum = index + 1;
                        const isActive = currentPage === pageNum;
                        
                        return (
                            <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                disabled={isActive}
                                style={{
                                    padding: '12px 18px',
                                    cursor: isActive ? 'default' : 'pointer',
                                    backgroundColor: isActive ? '#007bff' : 'rgba(255,255,255,0.1)',
                                    color: '#fff',
                                    border: `2px solid ${isActive ? '#007bff' : 'rgba(255,255,255,0.2)'}`,
                                    borderRadius: '12px',
                                    fontSize: '1rem',
                                    fontWeight: isActive ? 'bold' : 'normal',
                                    transition: 'all 0.3s ease',
                                    backdropFilter: 'blur(10px)',
                                    boxShadow: isActive ? '0 0 20px rgba(0,123,255,0.4)' : 'none',
                                    minWidth: '50px'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }
                                }}
                            >
                                {pageNum}
                            </button>
                        );
                    })}
                    
                    {currentPage < totalPages && (
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            style={{
                                padding: '12px 20px',
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                color: '#fff',
                                border: '2px solid rgba(255,255,255,0.2)',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                fontSize: '1rem',
                                transition: 'all 0.3s ease',
                                backdropFilter: 'blur(10px)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            Sonraki →
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default HomePage;
