// src/pages/CartPage.tsx
import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState, AppDispatch } from '../store/store';
import { fetchCartItems, decrementCartItemQuantity, removeCartItem } from '../store/cartSlice';
import { setNotification, clearNotification } from '../store/notificationSlice';

const CartPage = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { items: cartItems, status } = useSelector((state: RootState) => state.cart);
    const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/auth');
        }
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        if (isAuthenticated && user && status === 'idle') {
            dispatch(fetchCartItems(user.id));
        }
    }, [isAuthenticated, user, status, dispatch]);

    const handleDecrement = (productId: number) => {
        const item = cartItems.find(item => item.product_id === productId);
        if (!item || !user) return;

        dispatch(decrementCartItemQuantity({ productId, userId: user.id }))
            .unwrap()
            .then(() => {
                const productTitle = item.product?.title || 'Ürün';
                if (item.quantity > 1) {
                    dispatch(setNotification({ message: `${productTitle} sayısı azaltıldı.`, type: 'info' }));
                } else {
                    dispatch(setNotification({ message: `${productTitle} sepetten kaldırıldı.`, type: 'error' }));
                }
                setTimeout(() => dispatch(clearNotification()), 3000);
            })
            .catch((err) => {
                dispatch(setNotification({ message: `Ürün miktarını azaltırken hata oluştu: ${err.message}`, type: 'error' }));
                setTimeout(() => dispatch(clearNotification()), 3000);
            });
    };

    const handleRemove = (productId: number) => {
        if (!user) return;
        
        dispatch(removeCartItem({ productId, userId: user.id }))
            .unwrap()
            .then(() => {
                dispatch(setNotification({ message: 'Ürün sepetten tamamen kaldırıldı.', type: 'error' }));
                setTimeout(() => dispatch(clearNotification()), 3000);
            })
            .catch((err) => {
                dispatch(setNotification({ message: `Ürün kaldırılırken hata oluştu: ${err.message}`, type: 'error' }));
                setTimeout(() => dispatch(clearNotification()), 3000);
            });
    };

    // Sepet toplam hesaplama - product bilgisini kullan
    const subtotal = cartItems.reduce((total, item) => {
        const productPrice = item.product?.price || 0;
        return total + productPrice * item.quantity;
    }, 0);
    
    const tax = subtotal * 0.18;
    const shipping = subtotal > 0 ? 20 : 0; // Sepet boşsa kargo ücreti yok
    const total = subtotal + tax + shipping;

    const handleCheckout = () => {
        navigate('/checkout');
    };

    if (status === 'loading') {
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
                <p style={{ color: '#fff', fontSize: '1.2rem' }}>Sepetiniz yükleniyor...</p>
            </div>
        );
    }

    if (cartItems.length === 0) {
        return (
            <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '16px',
                border: '2px dashed rgba(255,255,255,0.2)'
            }}>
                <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🛒</div>
                <h3 style={{ fontSize: '1.8rem', marginBottom: '15px', color: '#fff' }}>
                    Sepetiniz Boş
                </h3>
                <p style={{ color: '#ccc', fontSize: '1.1rem', marginBottom: '30px' }}>
                    Henüz sepetinizde ürün bulunmamaktadır.
                </p>
                <button 
                    onClick={() => navigate('/')}
                    style={{
                        padding: '12px 24px',
                        background: 'linear-gradient(45deg, #667eea, #764ba2)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontSize: '1rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                    }}
                >
                    Alışverişe Başla
                </button>
            </div>
        );
    }

    return (
        <div style={{ width: '100%', padding: '0' }}>
            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '16px',
                padding: '30px',
                marginBottom: '30px',
                textAlign: 'center',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
            }}>
                <h1 style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    margin: '0',
                    background: 'linear-gradient(45deg, #fff, #e0e0e0)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                }}>
                    Sepetim
                </h1>
                <p style={{
                    fontSize: '1rem',
                    opacity: 0.9,
                    margin: '8px 0 0 0',
                    color: '#fff'
                }}>
                    {cartItems.length} ürün sepetinizde
                </p>
            </div>

            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '2fr 1fr', 
                gap: '30px'
            }}>
                {/* Cart Items */}
                <div style={{
                    display: 'grid',
                    gap: '20px'
                }}>
                    {cartItems.map((item) => (
                        <div key={item.id} style={{
                            background: 'rgba(255,255,255,0.05)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: '16px',
                            padding: '20px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            display: 'grid',
                            gridTemplateColumns: '120px 1fr auto',
                            gap: '20px',
                            alignItems: 'center'
                        }}>
                            <div style={{
                                width: '120px',
                                height: '120px',
                                borderRadius: '12px',
                                background: 'rgba(255,255,255,0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden'
                            }}>
                                <img 
                                    src={item.product?.image || '/placeholder.jpg'} 
                                    alt={item.product?.title || 'Ürün'} 
                                    style={{ 
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'contain'
                                    }} 
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <h3 style={{
                                    color: '#fff',
                                    fontSize: '1.1rem',
                                    fontWeight: '600',
                                    margin: '0',
                                    lineHeight: '1.3'
                                }}>
                                    {item.product?.title || 'Ürün adı bulunamadı'}
                                </h3>
                                
                                {/* Ürün detayları */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '15px',
                                    color: '#ccc',
                                    fontSize: '0.9rem'
                                }}>
                                    <span>Birim Fiyat: {item.product?.price || 0} TL</span>
                                    <span>•</span>
                                    <span>Adet: {item.quantity}</span>
                                    {item.product?.sku && (
                                        <>
                                            <span>•</span>
                                            <span>SKU: {item.product.sku}</span>
                                        </>
                                    )}
                                </div>
                                
                                {/* Kategori */}
                                {item.product?.category && (
                                    <span style={{
                                        background: 'rgba(255,255,255,0.1)',
                                        color: '#ccc',
                                        padding: '2px 8px',
                                        borderRadius: '12px',
                                        fontSize: '0.8rem',
                                        width: 'fit-content'
                                    }}>
                                        {item.product.category}
                                    </span>
                                )}
                                
                                <div style={{
                                    fontSize: '1.2rem',
                                    fontWeight: '700',
                                    color: '#4CAF50'
                                }}>
                                    Toplam: {((item.product?.price || 0) * item.quantity).toFixed(2)} TL
                                </div>
                            </div>

                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px',
                                alignItems: 'center'
                            }}>
                                <button 
                                    onClick={() => handleDecrement(item.product_id)} 
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: 'rgba(255,255,255,0.1)',
                                        color: '#fff',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1.2rem',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                                    }}
                                >
                                    -
                                </button>
                                
                                <button 
                                    onClick={() => handleRemove(item.product_id)} 
                                    style={{
                                        padding: '8px 16px',
                                        background: 'linear-gradient(45deg, #ff6b6b, #ee5a24)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '0.85rem',
                                        fontWeight: '600',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    Kaldır
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Order Summary */}
                <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '16px',
                    padding: '25px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    height: 'fit-content',
                    position: 'sticky',
                    top: '20px'
                }}>
                    <h2 style={{
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        color: '#fff',
                        margin: '0 0 20px 0'
                    }}>
                        Sipariş Özeti
                    </h2>
                    
                    {/* Sepet detayları */}
                    <div style={{ marginBottom: '20px' }}>
                        {cartItems.map((item) => (
                            <div key={item.id} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '8px 0',
                                borderBottom: '1px solid rgba(255,255,255,0.1)',
                                fontSize: '0.9rem'
                            }}>
                                <div style={{ color: '#ccc' }}>
                                    <span>{item.product?.title || 'Ürün'}</span>
                                    <span style={{ marginLeft: '5px', color: '#888' }}>
                                        x{item.quantity}
                                    </span>
                                </div>
                                <span style={{ color: '#fff', fontWeight: '600' }}>
                                    {((item.product?.price || 0) * item.quantity).toFixed(2)} TL
                                </span>
                            </div>
                        ))}
                    </div>
                    
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        marginBottom: '20px'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            color: '#ccc'
                        }}>
                            <span>Ara Toplam:</span>
                            <span>{subtotal.toFixed(2)} TL</span>
                        </div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            color: '#ccc'
                        }}>
                            <span>KDV (%18):</span>
                            <span>{tax.toFixed(2)} TL</span>
                        </div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            color: '#ccc'
                        }}>
                            <span>Kargo:</span>
                            <span>{shipping.toFixed(2)} TL</span>
                        </div>
                        <hr style={{ 
                            border: 'none',
                            height: '1px',
                            background: 'rgba(255,255,255,0.2)',
                            margin: '15px 0'
                        }} />
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '1.3rem',
                            fontWeight: '700',
                            color: '#4CAF50'
                        }}>
                            <span>Toplam:</span>
                            <span>{total.toFixed(2)} TL</span>
                        </div>
                    </div>

                    {/* Stok uyarısı */}
                    {cartItems.some(item => !item.product) && (
                        <div style={{
                            background: 'rgba(255, 193, 7, 0.1)',
                            border: '1px solid rgba(255, 193, 7, 0.3)',
                            borderRadius: '8px',
                            padding: '10px',
                            marginBottom: '15px',
                            fontSize: '0.85rem',
                            color: '#FFC107'
                        }}>
                            ⚠️ Bazı ürünlerin bilgileri eksik. Lütfen sepetinizi kontrol edin.
                        </div>
                    )}
                    
                    <button
                        onClick={handleCheckout}
                        disabled={cartItems.length === 0}
                        style={{
                            width: '100%',
                            padding: '15px 20px',
                            background: cartItems.length === 0 
                                ? 'rgba(108, 117, 125, 0.5)'
                                : 'linear-gradient(45deg, #4CAF50, #45a049)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            cursor: cartItems.length === 0 ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: cartItems.length === 0 
                                ? 'none'
                                : '0 4px 15px rgba(76, 175, 80, 0.4)'
                        }}
                        onMouseEnter={(e) => {
                            if (cartItems.length > 0) {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 8px 25px rgba(76, 175, 80, 0.6)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (cartItems.length > 0) {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(76, 175, 80, 0.4)';
                            }
                        }}
                    >
                        {cartItems.length === 0 ? 'Sepet Boş' : 'Ödemeye Geç'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CartPage;
