// src/pages/ProductDetail.tsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { supabase } from '../supabaseClient';
import type { ProductWithStock, StockStatus } from '../types';
import type { RootState, AppDispatch } from '../store/store';
import { addOrUpdateCartItem } from '../store/cartSlice';
import { setNotification } from '../store/notificationSlice';
import { checkProductStock } from '../store/productSlice';
import Comments from '../components/Comments';

const ProductDetail = () => {
    const { productId } = useParams<{ productId: string }>();
    const dispatch = useDispatch<AppDispatch>();
    const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
    
    const [product, setProduct] = useState<ProductWithStock | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [addingToCart, setAddingToCart] = useState(false);

    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            setError(null);
            
            const idAsNumber = Number(productId);
            if (isNaN(idAsNumber)) {
                setError('Geçersiz ürün kimliği.');
                setLoading(false);
                return;
            }
            
            try {
                const { data, error: supabaseError } = await supabase
                    .from('products')
                    .select(`
                        *,
                        inventory:inventory(
                            id,
                            quantity,
                            reserved_quantity,
                            min_stock_level,
                            max_stock_level,
                            cost_price,
                            updated_at
                        )
                    `)
                    .eq('id', idAsNumber)
                    .single();

                if (supabaseError) {
                    throw new Error(supabaseError.message);
                }

                if (!data) {
                    throw new Error('Ürün bulunamadı.');
                }

                // Stok bilgilerini hesapla
                const inventory = Array.isArray(data.inventory) ? data.inventory[0] : data.inventory;
                const availableStock = inventory ? inventory.quantity - inventory.reserved_quantity : 0;
                
                let stockStatus: StockStatus = 'IN_STOCK';
                if (availableStock <= 0) {
                    stockStatus = 'OUT_OF_STOCK';
                } else if (inventory && availableStock <= inventory.min_stock_level) {
                    stockStatus = 'LOW_STOCK';
                }

                const productWithStock: ProductWithStock = {
                    ...data,
                    inventory,
                    available_stock: availableStock,
                    stock_status: stockStatus
                };
                
                setProduct(productWithStock);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (productId) {
            fetchProduct();
        }
    }, [productId]);

    const handleAddToCart = async () => {
        if (!isAuthenticated || !user) {
            dispatch(setNotification({ message: 'Sepete ürün eklemek için giriş yapmalısınız.', type: 'error' }));
            return;
        }

        if (!product) return;

        // Stokta yoksa işlemi durdur
        if (product.stock_status === 'OUT_OF_STOCK') {
            dispatch(setNotification({ message: 'Bu ürün şu anda stokta bulunmuyor.', type: 'error' }));
            return;
        }

        setAddingToCart(true);
        
        try {
            // Stok durumunu kontrol et
            await dispatch(checkProductStock({ 
                productId: product.id, 
                quantity: 1 
            })).unwrap();

            // Stok kontrolü başarılıysa sepete ekle
            await dispatch(addOrUpdateCartItem({ product, userId: user.id })).unwrap();
            
            dispatch(setNotification({ 
                message: `${product.title} sepete eklendi!`, 
                type: 'success' 
            }));

            // Stok bilgilerini yenile
            const { data } = await supabase
                .from('products')
                .select('*, inventory:inventory(*)')
                .eq('id', product.id)
                .single();

            if (data) {
                const inventory = Array.isArray(data.inventory) ? data.inventory[0] : data.inventory;
                const availableStock = inventory ? inventory.quantity - inventory.reserved_quantity : 0;
                
                setProduct(prev => prev ? {
                    ...prev,
                    inventory,
                    available_stock: availableStock
                } : null);
            }

        } catch (err) {
            dispatch(setNotification({ 
                message: `Sepete eklenirken hata oluştu: ${err.message}`, 
                type: 'error' 
            }));
        } finally {
            setAddingToCart(false);
        }
    };

    const getStockStatusDisplay = () => {
        if (!product || product.available_stock === undefined) return null;

        const isOutOfStock = product.stock_status === 'OUT_OF_STOCK';
        const isLowStock = product.stock_status === 'LOW_STOCK';

        return (
            <div className={`stock-status ${isOutOfStock ? 'out-of-stock' : isLowStock ? 'low-stock' : 'in-stock'}`}>
                <div className="stock-header">
                    <span className="stock-icon">
                        {isOutOfStock ? '❌' : isLowStock ? '⚠️' : '✅'}
                    </span>
                    <span className="stock-text">
                        {isOutOfStock 
                            ? 'Stokta Yok' 
                            : isLowStock 
                                ? `Az Stok Kaldı (${product.available_stock} adet)`
                                : `Stokta Var (${product.available_stock} adet)`}
                    </span>
                </div>
                
                {product.inventory?.reserved_quantity > 0 && (
                    <div className="reserved-info">
                        Rezerve edilmiş: {product.inventory.reserved_quantity} adet
                    </div>
                )}

                {product.sku && (
                    <div className="sku-info">
                        SKU: <code className="sku-code">{product.sku}</code>
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-content">
                    <div className="loading-spinner"></div>
                    <p>Ürün detayları yükleniyor...</p>
                </div>
                <style>{`
                    .loading-container {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 60vh;
                        flex-direction: column;
                        gap: 20px;
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
                    .loading-content p {
                        color: #fff;
                        font-size: 1.2rem;
                        margin: 0;
                    }
                `}</style>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-state">
                <div className="error-icon">⚠️</div>
                <h3 className="error-title">Hata</h3>
                <p className="error-message">{error}</p>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="not-found-state">
                <div className="not-found-icon">🔍</div>
                <h3 className="not-found-title">Ürün Bulunamadı</h3>
            </div>
        );
    }

    const isOutOfStock = product.stock_status === 'OUT_OF_STOCK';

    return (
        <div className="product-detail-page">
            {/* Ana Container - İki kolon layout */}
            <div className="product-layout-container">
                
                {/* Sol Taraf - Product Detail Card (Sabit) */}
                <div className="product-detail-section">
                    <div className="product-detail-card">
                        <div className="product-content">
                            {/* Product Image */}
                            <div className="product-image-section">
                                <div className="image-container">
                                    <img 
                                        src={product.image} 
                                        alt={product.title} 
                                        className={`product-image ${isOutOfStock ? 'out-of-stock' : ''}`}
                                    />
                                    {isOutOfStock && (
                                        <div className="out-of-stock-badge">
                                            STOKTA YOK
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Product Info */}
                            <div className="product-info-section">
                                <div className="category-badge">
                                    {product.category}
                                </div>
                                
                                <h1 className="product-title">
                                    {product.title}
                                </h1>
                                
                                <div className="product-description">
                                    <p>{product.description}</p>
                                </div>
                                
                                {product.rating && product.rating > 0 && (
                                    <div className="product-rating">
                                        <div className="rating-stars">
                                            {Array(Math.round(product.rating)).fill('⭐').join('')}
                                        </div>
                                        <span className="rating-text">
                                            {product.rating.toFixed(1)} ({product.rating_count || 0} değerlendirme)
                                        </span>
                                    </div>
                                )}

                                {/* Stok Durumu */}
                                {getStockStatusDisplay()}
                                
                                <div className="product-price">
                                    {typeof product.price === 'number' ? product.price.toFixed(2) : product.price} TL
                                </div>
                                
                                <button 
                                    onClick={handleAddToCart}
                                    disabled={isOutOfStock || addingToCart}
                                    className={`add-to-cart-btn ${isOutOfStock ? 'disabled' : ''} ${addingToCart ? 'loading' : ''}`}
                                >
                                    {addingToCart 
                                        ? '🔄 Ekleniyor...' 
                                        : isOutOfStock 
                                            ? '❌ Stokta Yok' 
                                            : '🛒 Sepete Ekle'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sağ Taraf - Comments Section (Scrollable) */}
                <div className="comments-section-container">
                    {product && <Comments productId={product.id} />}
                </div>

            </div>

            <style>{`
                .product-detail-page {
                    width: 100%;
                    min-height: calc(100vh - 120px);
                    padding: 0;
                }

                /* Ana Layout Container */
                .product-layout-container {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 2rem;
                    height: calc(100vh - 140px); /* Navbar için boşluk bırak */
                    padding: 1rem;
                    overflow: hidden;
                }

                /* Sol Taraf - Product Detail Section */
                .product-detail-section {
                    display: flex;
                    flex-direction: column;
                    overflow-y: auto;
                    padding-right: 1rem;
                    /* Custom scrollbar */
                    scrollbar-width: thin;
                    scrollbar-color: rgba(102,126,234,0.6) rgba(255,255,255,0.1);
                }

                .product-detail-section::-webkit-scrollbar {
                    width: 6px;
                }

                .product-detail-section::-webkit-scrollbar-track {
                    background: rgba(255,255,255,0.1);
                    border-radius: 3px;
                }

                .product-detail-section::-webkit-scrollbar-thumb {
                    background: rgba(102,126,234,0.6);
                    border-radius: 3px;
                }

                .product-detail-section::-webkit-scrollbar-thumb:hover {
                    background: rgba(102,126,234,0.8);
                }

                .product-detail-card {
                    background: rgba(255,255,255,0.05);
                    backdrop-filter: blur(10px);
                    border-radius: 16px;
                    padding: clamp(1rem, 3vw, 2rem);
                    border: 1px solid rgba(255,255,255,0.1);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.2);
                    flex-shrink: 0;
                }

                .product-content {
                    display: flex;
                    flex-direction: column;
                    gap: clamp(1.5rem, 4vw, 2rem);
                }

                /* Sağ Taraf - Comments Section */
                .comments-section-container {
                    display: flex;
                    flex-direction: column;
                    overflow-y: auto;
                    padding-left: 1rem;
                    /* Custom scrollbar */
                    scrollbar-width: thin;
                    scrollbar-color: rgba(102,126,234,0.6) rgba(255,255,255,0.1);
                }

                .comments-section-container::-webkit-scrollbar {
                    width: 6px;
                }

                .comments-section-container::-webkit-scrollbar-track {
                    background: rgba(255,255,255,0.1);
                    border-radius: 3px;
                }

                .comments-section-container::-webkit-scrollbar-thumb {
                    background: rgba(102,126,234,0.6);
                    border-radius: 3px;
                }

                .comments-section-container::-webkit-scrollbar-thumb:hover {
                    background: rgba(102,126,234,0.8);
                }

                /* Product Image Section */
                .product-image-section {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }

                .image-container {
                    background: rgba(255,255,255,0.05);
                    border-radius: 12px;
                    padding: clamp(1rem, 3vw, 1.5rem);
                    position: relative;
                    width: 100%;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 250px;
                }

                .product-image {
                    max-width: 100%;
                    max-height: clamp(250px, 40vh, 350px);
                    object-fit: contain;
                    border-radius: 8px;
                    transition: filter 0.3s ease;
                }

                .product-image.out-of-stock {
                    filter: grayscale(30%);
                }

                .out-of-stock-badge {
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    background: rgba(220, 53, 69, 0.9);
                    color: white;
                    padding: 0.5rem 0.75rem;
                    border-radius: 8px;
                    font-weight: bold;
                    font-size: 0.85rem;
                    backdrop-filter: blur(10px);
                }

                /* Product Info Section */
                .product-info-section {
                    display: flex;
                    flex-direction: column;
                    gap: clamp(1rem, 3vw, 1.5rem);
                }

                .category-badge {
                    background: linear-gradient(45deg, #667eea, #764ba2);
                    color: white;
                    padding: 0.5rem 0.75rem;
                    border-radius: 20px;
                    font-size: 0.85rem;
                    font-weight: 500;
                    align-self: flex-start;
                    white-space: nowrap;
                }

                .product-title {
                    font-size: clamp(1.3rem, 3vw, 1.8rem);
                    font-weight: 700;
                    color: #fff;
                    margin: 0;
                    line-height: 1.2;
                }

                .product-description {
                    padding: clamp(1rem, 3vw, 1.5rem);
                    background: rgba(255,255,255,0.05);
                    border-radius: 12px;
                    border: 1px solid rgba(255,255,255,0.1);
                }

                .product-description p {
                    color: #e0e0e0;
                    font-size: clamp(0.9rem, 2vw, 1rem);
                    line-height: 1.6;
                    margin: 0;
                }

                .product-rating {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem;
                    background: rgba(255,255,255,0.05);
                    border-radius: 12px;
                    flex-wrap: wrap;
                }

                .rating-stars {
                    font-size: clamp(1.1rem, 2.5vw, 1.3rem);
                }

                .rating-text {
                    color: #ccc;
                    font-size: clamp(0.8rem, 1.8vw, 0.9rem);
                }

                /* Stock Status Styles */
                .stock-status {
                    padding: 1rem;
                    border-radius: 12px;
                    border: 1px solid;
                }

                .stock-status.out-of-stock {
                    background: rgba(220, 53, 69, 0.1);
                    border-color: rgba(220, 53, 69, 0.3);
                }

                .stock-status.low-stock {
                    background: rgba(255, 193, 7, 0.1);
                    border-color: rgba(255, 193, 7, 0.3);
                }

                .stock-status.in-stock {
                    background: rgba(40, 167, 69, 0.1);
                    border-color: rgba(40, 167, 69, 0.3);
                }

                .stock-header {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    margin-bottom: 0.5rem;
                }

                .stock-icon {
                    font-size: 1.2rem;
                }

                .stock-text {
                    font-weight: 600;
                    font-size: clamp(0.85rem, 1.8vw, 0.95rem);
                }

                .stock-status.out-of-stock .stock-text {
                    color: #dc3545;
                }

                .stock-status.low-stock .stock-text {
                    color: #ffc107;
                }

                .stock-status.in-stock .stock-text {
                    color: #28a745;
                }

                .reserved-info {
                    font-size: 0.8rem;
                    color: #ccc;
                    margin-bottom: 0.25rem;
                }

                .sku-info {
                    font-size: 0.8rem;
                    color: #aaa;
                }

                .sku-code {
                    color: #17a2b8;
                    background: rgba(23,162,184,0.1);
                    padding: 0.2rem 0.4rem;
                    border-radius: 4px;
                }

                /* Product Price */
                .product-price {
                    font-size: clamp(1.8rem, 4vw, 2.2rem);
                    font-weight: 700;
                    background: linear-gradient(45deg, #4CAF50, #45a049);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                /* Add to Cart Button */
                .add-to-cart-btn {
                    width: 100%;
                    padding: clamp(0.75rem, 2vw, 1rem);
                    background: linear-gradient(45deg, #4CAF50, #45a049);
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-size: clamp(0.95rem, 2vw, 1.1rem);
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 4px 15px rgba(76, 175, 80, 0.4);
                }

                .add-to-cart-btn:hover:not(.disabled):not(.loading) {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(76, 175, 80, 0.6);
                }

                .add-to-cart-btn.disabled {
                    background: linear-gradient(45deg, #6c757d, #5a6268);
                    cursor: not-allowed;
                    box-shadow: none;
                    opacity: 0.6;
                }

                .add-to-cart-btn.loading {
                    cursor: not-allowed;
                }

                /* Error and Not Found States */
                .error-state,
                .not-found-state {
                    text-align: center;
                    padding: clamp(2rem, 5vw, 3rem);
                    background: rgba(255,255,255,0.05);
                    border-radius: 16px;
                    border: 2px dashed rgba(255,255,255,0.2);
                    margin: 1rem;
                }

                .error-icon,
                .not-found-icon {
                    font-size: 3rem;
                    margin-bottom: 1rem;
                }

                .error-title {
                    font-size: clamp(1.2rem, 3vw, 1.5rem);
                    margin-bottom: 0.75rem;
                    color: #ff6b6b;
                }

                .not-found-title {
                    font-size: clamp(1.2rem, 3vw, 1.5rem);
                    margin-bottom: 0.75rem;
                    color: #fff;
                }

                .error-message {
                    color: #ccc;
                    font-size: clamp(0.9rem, 2vw, 1rem);
                    margin: 0;
                }

                /* Mobile Responsive - Tek kolon layout */
                @media (max-width: 968px) {
                    .product-layout-container {
                        grid-template-columns: 1fr;
                        height: auto;
                        gap: 1rem;
                        overflow: visible;
                    }

                    .product-detail-section,
                    .comments-section-container {
                        overflow-y: visible;
                        padding: 0;
                        height: auto;
                    }

                    .product-detail-card {
                        margin-bottom: 1rem;
                    }
                }

                @media (max-width: 768px) {
                    .product-layout-container {
                        padding: 0.5rem;
                        gap: 0.5rem;
                    }

                    .product-detail-card {
                        padding: 1rem;
                        border-radius: 12px;
                    }

                    .image-container {
                        min-height: 200px;
                        padding: 1rem;
                    }

                    .out-of-stock-badge {
                        top: 0.5rem;
                        right: 0.5rem;
                        padding: 0.4rem 0.6rem;
                        font-size: 0.75rem;
                    }
                }

                @media (max-width: 480px) {
                    .product-content {
                        gap: 1rem;
                    }

                    .product-info-section {
                        gap: 1rem;
                    }

                    .category-badge {
                        padding: 0.4rem 0.6rem;
                        font-size: 0.8rem;
                    }

                    .product-description {
                        padding: 0.75rem;
                    }

                    .product-rating {
                        padding: 0.75rem;
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 0.5rem;
                    }

                    .stock-status {
                        padding: 0.75rem;
                    }
                }

                /* Tablet landscape için özel düzenleme */
                @media (min-width: 769px) and (max-width: 1024px) and (orientation: landscape) {
                    .product-layout-container {
                        height: calc(100vh - 120px);
                    }
                }

                /* Geniş ekranlar için optimizasyon */
                @media (min-width: 1400px) {
                    .product-layout-container {
                        max-width: 1400px;
                        margin: 0 auto;
                    }
                }
            `}</style>
        </div>
    );
};

export default ProductDetail;
