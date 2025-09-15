// src/HomePage.tsx
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

    const productsPerPage = 8;

    useEffect(() => {
        dispatch(fetchTotalProductsCount({ searchTerm: searchTerm, category: selectedCategory, stockFilter: null }));
        dispatch(fetchCategories());
    }, [dispatch, searchTerm, selectedCategory]);

    useEffect(() => {
        dispatch(fetchProducts({ page: currentPage, limit: productsPerPage, searchTerm, category: selectedCategory, stockFilter: null }));
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
        // Sayfa değiştiğinde en üste scroll yap
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
            <div className="loading-container">
                <div className="loading-content">
                    <div className="loading-spinner"></div>
                    Ürünler yükleniyor...
                </div>
                <style>{`
                    .loading-container {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 50vh;
                        font-size: 1.2rem;
                        color: #fff;
                    }
                    
                    .loading-content {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 20px;
                    }
                    
                    .loading-spinner {
                        width: 50px;
                        height: 50px;
                        border: 4px solid #333;
                        border-top: 4px solid #007bff;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                    }
                `}</style>
            </div>
        );
    }

    if (status === 'failed') {
        return (
            <div className="error-container">
                <div className="error-icon">⚠️</div>
                <div className="error-title">Ürünler yüklenirken bir hata oluştu</div>
                <div className="error-message">{error}</div>
                <style>{`
                    .error-container {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 50vh;
                        flex-direction: column;
                        gap: 20px;
                        color: #ff6b6b;
                        text-align: center;
                        padding: 2rem;
                    }
                    
                    .error-icon {
                        font-size: 3rem;
                    }
                    
                    .error-title {
                        font-size: 1.2rem;
                    }
                    
                    .error-message {
                        font-size: 0.9rem;
                        color: #ccc;
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="homepage-container">
            {/* Hero Section */}
            <div className="hero-section">
                <h1 className="hero-title">İSKİ E-Commerce</h1>
                <p className="hero-subtitle">
                    En kaliteli ürünleri keşfedin ve güvenli alışveriş yapın
                </p>
            </div>

            {/* Filters Section */}
            <div className="filters-section">
                <div className="filters-content">
                    <div className="search-container">
                        <input
                            type="text"
                            placeholder="🔍 Ürün ara..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="search-input"
                        />
                    </div>
                    <div className="category-container">
                        <select
                            value={selectedCategory || ''}
                            onChange={handleCategoryChange}
                            className="category-select"
                        >
                            <option value="">📂 Tüm Kategoriler</option>
                            {categories.map((category) => (
                                <option key={category} value={category}>
                                    {category}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
            
            {/* Products Grid */}
            <div className="products-section">
                {products && products.length > 0 ? (
                    <div className="products-grid">
                        {products.map((product) => (
                            <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
                        ))}
                    </div>
                ) : (
                    <div className="no-products">
                        <div className="no-products-icon">🔍</div>
                        <h3 className="no-products-title">Ürün Bulunamadı</h3>
                        <p className="no-products-message">
                            Aradığınız kriterlere uygun ürün bulunmamaktadır.
                        </p>
                    </div>
                )}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
                <div className="pagination-section">
                    {currentPage > 1 && (
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            className="pagination-btn pagination-prev"
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
                                className={`pagination-btn pagination-number ${isActive ? 'active' : ''}`}
                            >
                                {pageNum}
                            </button>
                        );
                    })}
                    
                    {currentPage < totalPages && (
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            className="pagination-btn pagination-next"
                        >
                            Sonraki →
                        </button>
                    )}
                </div>
            )}

            <style>{`
                .homepage-container {
                    width: 100%;
                    min-height: calc(100vh - 80px);
                    padding: 0;
                }

                /* Hero Section */
                .hero-section {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: clamp(2rem, 5vw, 4rem) clamp(1rem, 3vw, 2.5rem);
                    border-radius: 20px;
                    margin: 1rem;
                    margin-bottom: 2rem;
                    text-align: center;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                }

                .hero-title {
                    font-size: clamp(2rem, 5vw, 3rem);
                    font-weight: 700;
                    margin: 0 0 1rem 0;
                    background: linear-gradient(45deg, #fff, #e0e0e0);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .hero-subtitle {
                    font-size: clamp(1rem, 2.5vw, 1.3rem);
                    opacity: 0.9;
                    margin: 0;
                    color: #fff;
                }

                /* Filters Section */
                .filters-section {
                    background: rgba(255,255,255,0.05);
                    backdrop-filter: blur(10px);
                    border-radius: 16px;
                    padding: clamp(1rem, 3vw, 2rem);
                    margin: 1rem;
                    margin-bottom: 2rem;
                    border: 1px solid rgba(255,255,255,0.1);
                }

                .filters-content {
                    display: flex;
                    gap: 1rem;
                    align-items: center;
                    flex-wrap: wrap;
                    justify-content: space-between;
                }

                .search-container {
                    flex: 1;
                    min-width: min(300px, 100%);
                }

                .search-input {
                    width: 100%;
                    padding: 15px 20px;
                    font-size: 1rem;
                    border-radius: 12px;
                    border: 2px solid rgba(255,255,255,0.1);
                    background-color: rgba(255,255,255,0.1);
                    color: #fff;
                    outline: none;
                    transition: all 0.3s ease;
                    backdrop-filter: blur(10px);
                }

                .search-input:focus {
                    border-color: #007bff;
                    box-shadow: 0 0 20px rgba(0,123,255,0.3);
                }

                .search-input::placeholder {
                    color: rgba(255,255,255,0.7);
                }

                .category-select {
                    padding: 15px 20px;
                    font-size: 1rem;
                    border-radius: 12px;
                    border: 2px solid rgba(255,255,255,0.1);
                    background-color: rgba(255,255,255,0.1);
                    color: #fff;
                    outline: none;
                    cursor: pointer;
                    min-width: min(200px, 100%);
                    backdrop-filter: blur(10px);
                }

                .category-select option {
                    background-color: #333;
                    color: #fff;
                }

                /* Products Section */
                .products-section {
                    padding: 0 1rem;
                    margin-bottom: 2rem;
                }

                .products-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(min(350px, 100%), 1fr));
                    gap: clamp(1rem, 3vw, 2rem);
                }

                .no-products {
                    text-align: center;
                    padding: clamp(2rem, 5vw, 4rem) 1rem;
                    background: rgba(255,255,255,0.05);
                    border-radius: 16px;
                    border: 2px dashed rgba(255,255,255,0.2);
                }

                .no-products-icon {
                    font-size: 4rem;
                    margin-bottom: 1rem;
                }

                .no-products-title {
                    font-size: 1.5rem;
                    margin-bottom: 0.5rem;
                    color: #fff;
                }

                .no-products-message {
                    color: #ccc;
                    font-size: 1.1rem;
                }

                /* Pagination */
                .pagination-section {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    margin: 2rem 1rem;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                }

                .pagination-btn {
                    padding: 12px 18px;
                    background-color: rgba(255,255,255,0.1);
                    color: #fff;
                    border: 2px solid rgba(255,255,255,0.2);
                    border-radius: 12px;
                    cursor: pointer;
                    font-size: 1rem;
                    transition: all 0.3s ease;
                    backdrop-filter: blur(10px);
                    min-width: 50px;
                }

                .pagination-btn:hover:not(:disabled) {
                    background-color: rgba(255,255,255,0.2);
                    transform: translateY(-2px);
                }

                .pagination-btn.active {
                    background-color: #007bff;
                    border-color: #007bff;
                    font-weight: bold;
                    box-shadow: 0 0 20px rgba(0,123,255,0.4);
                    cursor: default;
                }

                .pagination-btn:disabled {
                    cursor: default;
                }

                .pagination-prev,
                .pagination-next {
                    padding: 12px 20px;
                }

                /* Responsive Design */
                @media (max-width: 768px) {
                    .filters-content {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .search-container,
                    .category-container {
                        width: 100%;
                    }

                    .products-grid {
                        grid-template-columns: 1fr;
                        gap: 1rem;
                    }

                    .pagination-section {
                        gap: 0.25rem;
                        margin: 1rem;
                    }

                    .pagination-btn {
                        padding: 10px 12px;
                        font-size: 0.9rem;
                        min-width: 40px;
                    }

                    .pagination-prev,
                    .pagination-next {
                        padding: 10px 16px;
                    }
                }

                @media (max-width: 480px) {
                    .hero-section {
                        margin: 0.5rem;
                        padding: 1.5rem 1rem;
                        border-radius: 12px;
                    }

                    .filters-section {
                        margin: 0.5rem;
                        padding: 1rem;
                        border-radius: 12px;
                    }

                    .products-section {
                        padding: 0 0.5rem;
                    }

                    .pagination-section {
                        margin: 1rem 0.5rem;
                    }
                }

                /* High DPI / Zoom adjustments */
                @media (min-resolution: 150dpi) and (max-width: 1200px) {
                    .hero-section {
                        padding: 2rem 1.5rem;
                    }
                    
                    .filters-section {
                        padding: 1.5rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default HomePage;
