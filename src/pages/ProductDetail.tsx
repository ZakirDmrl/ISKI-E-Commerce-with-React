// src/pages/ProductDetail.tsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { supabase } from '../supabaseClient';
import type { Product } from '../types';
import type { RootState, AppDispatch } from '../store/store';
import { addOrUpdateCartItem } from '../store/cartSlice';
import { setNotification } from '../store/notificationSlice';
import Comments from '../components/Comments';

const ProductDetail = () => {
    const { productId } = useParams<{ productId: string }>();
    const dispatch = useDispatch<AppDispatch>();
    const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
    
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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
                    .select('*')
                    .eq('id', idAsNumber)
                    .single();

                if (supabaseError) {
                    throw new Error(supabaseError.message);
                }

                if (!data) {
                    throw new Error('Ürün bulunamadı.');
                }
                
                setProduct(data as Product);
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

    const handleAddToCart = () => {
        if (!isAuthenticated || !user) {
            dispatch(setNotification({ message: 'Sepete ürün eklemek için giriş yapmalısınız.', type: 'error' }));
            return;
        }

        if (product) {
            dispatch(addOrUpdateCartItem({ product, userId: user.id }))
                .unwrap()
                .then(() => {
                    dispatch(setNotification({ message: `${product.title} sepete eklendi!`, type: 'success' }));
                })
                .catch((err) => {
                    dispatch(setNotification({ message: `Sepete eklenirken hata oluştu: ${err.message}`, type: 'error' }));
                });
        }
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
                        padding: '20px'
                    }}>
                        <img 
                            src={product.image} 
                            alt={product.title} 
                            style={{ 
                                maxWidth: '100%',
                                maxHeight: '400px', 
                                objectFit: 'contain',
                                borderRadius: '8px'
                            }}
                        />
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
                                ({product.rating_count} değerlendirme)
                            </span>
                        </div>
                        
                        <div style={{
                            fontSize: '2.5rem',
                            fontWeight: '700',
                            background: 'linear-gradient(45deg, #4CAF50, #45a049)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text'
                        }}>
                            {product.price.toFixed(2)} TL
                        </div>
                        
                        <button 
                            onClick={handleAddToCart} 
                            style={{
                                width: '100%',
                                padding: '15px 20px',
                                background: 'linear-gradient(45deg, #4CAF50, #45a049)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: '1.1rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 15px rgba(76, 175, 80, 0.4)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 8px 25px rgba(76, 175, 80, 0.6)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(76, 175, 80, 0.4)';
                            }}
                        >
                            🛒 Sepete Ekle
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
