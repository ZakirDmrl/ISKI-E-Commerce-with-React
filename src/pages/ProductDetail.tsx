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
            } catch (err: any) {
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

        } catch (err: any) {
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
            <div style={{
                padding: '15px',
                background: isOutOfStock 
                    ? 'rgba(220, 53, 69, 0.1)' 
                    : isLowStock 
                        ? 'rgba(255, 193, 7, 0.1)'
                        : 'rgba(40, 167, 69, 0.1)',
                borderRadius: '12px',
                border: `1px solid ${isOutOfStock 
                    ? 'rgba(220, 53, 69, 0.3)' 
                    : isLowStock 
                        ? 'rgba(255, 193, 7, 0.3)'
                        : 'rgba(40, 167, 69, 0.3)'}`,
                marginBottom: '20px'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '8px'
                }}>
                    <span style={{ fontSize: '1.2rem' }}>
                        {isOutOfStock ? '❌' : isLowStock ? '⚠️' : '✅'}
                    </span>
                    <span style={{
                        color: isOutOfStock ? '#dc3545' : isLowStock ? '#ffc107' : '#28a745',
                        fontWeight: '600',
                        fontSize: '1rem'
                    }}>
                        {isOutOfStock 
                            ? 'Stokta Yok' 
                            : isLowStock 
                                ? `Az Stok Kaldı (${product.available_stock} adet)`
                                : `Stokta Var (${product.available_stock} adet)`}
                    </span>
                </div>
                
                {product.inventory?.reserved_quantity > 0 && (
                    <div style={{ fontSize: '0.9rem', color: '#ccc' }}>
                        Rezerve edilmiş: {product.inventory.reserved_quantity} adet
                    </div>
                )}

                {product.sku && (
                    <div style={{ fontSize: '0.9rem', color: '#aaa', marginTop: '5px' }}>
                        SKU: <code style={{ color: '#17a2b8' }}>{product.sku}</code>
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '60vh',
                flexDirection: 'column',
                gap: '20px'
            }}>
                <div style={{
                    width: '50px',
                    height: '50px',
                    border: '4px solid #333',
                    borderTop: '4px solid #007bff',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }}></div>
                <p style={{ color: '#fff', fontSize: '1.2rem' }}>Ürün detayları yükleniyor...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                textAlign: 'center',
                padding: '50px 20px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '16px',
                border: '2px dashed rgba(255,255,255,0.2)'
            }}>
                <div style={{ fontSize: '3rem', marginBottom: '15px' }}>⚠️</div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '10px', color: '#ff6b6b' }}>
                    Hata
                </h3>
                <p style={{ color: '#ccc', fontSize: '1rem' }}>
                    {error}
                </p>
            </div>
        );
    }

    if (!product) {
        return (
            <div style={{
                textAlign: 'center',
                padding: '50px 20px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '16px',
                border: '2px dashed rgba(255,255,255,0.2)'
            }}>
                <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🔍</div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '10px', color: '#fff' }}>
                    Ürün Bulunamadı
                </h3>
            </div>
        );
    }

    const isOutOfStock = product.stock_status === 'OUT_OF_STOCK';

    return (
        <div style={{ width: '100%', padding: '0' }}>
            {/* Product Detail Card */}
            <div style={{
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '30px',
                marginBottom: '30px',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '30px',
                    alignItems: 'start'
                }}>
                    {/* Product Image */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '20px',
                        position: 'relative'
                    }}>
                        <img 
                            src={product.image} 
                            alt={product.title} 
                            style={{ 
                                maxWidth: '100%',
                                maxHeight: '400px', 
                                objectFit: 'contain',
                                borderRadius: '8px',
                                filter: isOutOfStock ? 'grayscale(30%)' : 'none'
                            }}
                        />
                        {isOutOfStock && (
                            <div style={{
                                position: 'absolute',
                                top: '20px',
                                right: '20px',
                                background: 'rgba(220, 53, 69, 0.9)',
                                color: 'white',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                fontWeight: 'bold',
                                fontSize: '0.9rem'
                            }}>
                                STOKTA YOK
                            </div>
                        )}
                    </div>
                    
                    {/* Product Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <span style={{
                                background: 'linear-gradient(45deg, #667eea, #764ba2)',
                                color: 'white',
                                padding: '6px 12px',
                                borderRadius: '20px',
                                fontSize: '0.85rem',
                                fontWeight: '500'
                            }}>
                                {product.category}
                            </span>
                        </div>
                        
                        <h1 style={{
                            fontSize: '2rem',
                            fontWeight: '700',
                            color: '#fff',
                            margin: '0',
                            lineHeight: '1.2'
                        }}>
                            {product.title}
                        </h1>
                        
                        <div style={{
                            padding: '20px',
                            background: 'rgba(255,255,255,0.05)',
                            borderRadius: '12px',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <p style={{
                                color: '#e0e0e0',
                                fontSize: '1rem',
                                lineHeight: '1.6',
                                margin: '0'
                            }}>
                                {product.description}
                            </p>
                        </div>
                        
                        {product.rating && product.rating > 0 && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '15px',
                                padding: '15px',
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: '12px'
                            }}>
                                <div style={{ fontSize: '1.5rem' }}>
                                    {Array(Math.round(product.rating)).fill('⭐').join('')}
                                </div>
                                <span style={{ color: '#ccc', fontSize: '0.9rem' }}>
                                    {product.rating.toFixed(1)} ({product.rating_count || 0} değerlendirme)
                                </span>
                            </div>
                        )}

                        {/* Stok Durumu */}
                        {getStockStatusDisplay()}
                        
                        <div style={{
                            fontSize: '2.5rem',
                            fontWeight: '700',
                            background: 'linear-gradient(45deg, #4CAF50, #45a049)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                        }}>
                            {typeof product.price === 'number' ? product.price.toFixed(2) : product.price} TL
                        </div>
                        
                        <button 
                            onClick={handleAddToCart}
                            disabled={isOutOfStock || addingToCart}
                            style={{
                                width: '100%',
                                padding: '15px 20px',
                                background: isOutOfStock 
                                    ? 'linear-gradient(45deg, #6c757d, #5a6268)'
                                    : 'linear-gradient(45deg, #4CAF50, #45a049)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: '1.1rem',
                                fontWeight: '600',
                                cursor: isOutOfStock || addingToCart ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s ease',
                                boxShadow: isOutOfStock 
                                    ? 'none' 
                                    : '0 4px 15px rgba(76, 175, 80, 0.4)',
                                opacity: isOutOfStock ? 0.6 : 1
                            }}
                            onMouseEnter={(e) => {
                                if (!isOutOfStock && !addingToCart) {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 8px 25px rgba(76, 175, 80, 0.6)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isOutOfStock && !addingToCart) {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(76, 175, 80, 0.4)';
                                }
                            }}
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
            
            {/* Comments Section */}
            {product && <Comments productId={product.id} />}
        </div>
    );
};

export default ProductDetail;
