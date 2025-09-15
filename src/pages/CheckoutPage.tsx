// src/pages/CheckoutPage.tsx
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { type RootState, type AppDispatch } from '../store/store';
import { createOrder } from '../store/cartSlice';
import { useNavigate } from 'react-router-dom';

const CheckoutPage: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { items, status } = useSelector((state: RootState) => state.cart);
    const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

    const subtotal = items.reduce((total, item) => {
        const price = item.product?.price || 0;
        return total + price * item.quantity;
    }, 0);
    const tax = subtotal * 0.18;
    const shipping = 20;
    const total = subtotal + tax + shipping;

    const handleCheckout = async () => {
        if (!isAuthenticated || !user) {
            alert('Lütfen ödeme için giriş yapın.');
            return;
        }

        if (items.length === 0) {
            alert('Sepetiniz boş!');
            return;
        }

        try {
            await dispatch(createOrder({
                userId: user.id,
                cartItems: items,
                totalAmount: total
            })).unwrap();

            alert('Ödeme başarıyla tamamlandı ve siparişiniz kaydedildi!');
            navigate('/');
        } catch (err ) {
            alert(`Ödeme sırasında bir hata oluştu: ${err.message}`);
        }
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
                <p style={{ color: '#fff', fontSize: '1.2rem' }}>Sepet yükleniyor...</p>
            </div>
        );
    }

    if (items.length === 0) {
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
                <p style={{ color: '#ccc', fontSize: '1.1rem' }}>
                    Ödeme yapabilmek için sepetinizde ürün bulunmalıdır.
                </p>
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
                    Ödeme
                </h1>
                <p style={{
                    fontSize: '1rem',
                    opacity: 0.9,
                    margin: '8px 0 0 0',
                    color: '#fff'
                }}>
                    Siparişinizi tamamlayın
                </p>
            </div>

            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '2fr 1fr', 
                gap: '30px'
            }}>
                {/* Order Summary */}
                <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '16px',
                    padding: '30px',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <h2 style={{
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        color: '#fff',
                        margin: '0 0 25px 0'
                    }}>
                        Sipariş Özeti
                    </h2>
                    
                    <div style={{ marginBottom: '25px' }}>
                        {items.map((item) => (
                            <div key={item.id} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '15px 0',
                                borderBottom: '1px solid rgba(255,255,255,0.1)',
                                color: '#e0e0e0'
                            }}>
                                <div>
                                    <span style={{ fontWeight: '600' }}>{item.product.title}</span>
                                    <span style={{ color: '#ccc', marginLeft: '10px' }}>
                                        ({item.quantity} adet)
                                    </span>
                                </div>
                                <span style={{ fontWeight: '700' }}>
                                    {(item.product?.price * item.quantity).toFixed(2)} TL
                                </span>
                            </div>
                        ))}
                    </div>
                    
                    <div style={{
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '12px',
                        padding: '20px'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: '8px',
                            color: '#ccc'
                        }}>
                            <span>Ara Toplam:</span>
                            <span>{subtotal.toFixed(2)} TL</span>
                        </div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: '8px',
                            color: '#ccc'
                        }}>
                            <span>KDV (%18):</span>
                            <span>{tax.toFixed(2)} TL</span>
                        </div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginBottom: '15px',
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
                            fontSize: '1.4rem',
                            fontWeight: '700',
                            color: '#4CAF50'
                        }}>
                            <span>Toplam:</span>
                            <span>{total.toFixed(2)} TL</span>
                        </div>
                    </div>
                </div>

                {/* Payment Form */}
                <div style={{
                    background: 'rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '16px',
                    padding: '30px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    height: 'fit-content'
                }}>
                    <h2 style={{
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        color: '#fff',
                        margin: '0 0 25px 0'
                    }}>
                        Ödeme Bilgileri
                    </h2>
                    
                    <form style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '20px'
                    }}>
                        <div>
                            <label style={{
                                display: 'block',
                                color: '#fff',
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                marginBottom: '8px'
                            }}>
                                Kart Numarası
                            </label>
                            <input
                                type="text"
                                placeholder="1234 5678 9012 3456"
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    fontSize: '1rem',
                                    borderRadius: '12px',
                                    border: '2px solid rgba(255,255,255,0.1)',
                                    backgroundColor: 'rgba(255,255,255,0.1)',
                                    color: '#fff',
                                    outline: 'none',
                                    transition: 'all 0.3s ease'
                                }}
                            />
                        </div>
                        
                        <div>
                            <label style={{
                                display: 'block',
                                color: '#fff',
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                marginBottom: '8px'
                            }}>
                                Kart Üzerindeki İsim
                            </label>
                            <input
                                type="text"
                                placeholder="Ad Soyad"
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    fontSize: '1rem',
                                    borderRadius: '12px',
                                    border: '2px solid rgba(255,255,255,0.1)',
                                    backgroundColor: 'rgba(255,255,255,0.1)',
                                    color: '#fff',
                                    outline: 'none',
                                    transition: 'all 0.3s ease'
                                }}
                            />
                        </div>
                        
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '15px'
                        }}>
                            <div>
                                <label style={{
                                    display: 'block',
                                    color: '#fff',
                                    fontSize: '0.9rem',
                                    fontWeight: '600',
                                    marginBottom: '8px'
                                }}>
                                    Son Kullanma
                                </label>
                                <input
                                    type="text"
                                    placeholder="MM/YY"
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        fontSize: '1rem',
                                        borderRadius: '12px',
                                        border: '2px solid rgba(255,255,255,0.1)',
                                        backgroundColor: 'rgba(255,255,255,0.1)',
                                        color: '#fff',
                                        outline: 'none',
                                        transition: 'all 0.3s ease'
                                    }}
                                />
                            </div>
                            
                            <div>
                                <label style={{
                                    display: 'block',
                                    color: '#fff',
                                    fontSize: '0.9rem',
                                    fontWeight: '600',
                                    marginBottom: '8px'
                                }}>
                                    CVV
                                </label>
                                <input
                                    type="text"
                                    placeholder="123"
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        fontSize: '1rem',
                                        borderRadius: '12px',
                                        border: '2px solid rgba(255,255,255,0.1)',
                                        backgroundColor: 'rgba(255,255,255,0.1)',
                                        color: '#fff',
                                        outline: 'none',
                                        transition: 'all 0.3s ease'
                                    }}
                                />
                            </div>
                        </div>
                        
                        <button 
                            type="button" 
                            onClick={handleCheckout}
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
                                boxShadow: '0 4px 15px rgba(76, 175, 80, 0.4)',
                                marginTop: '10px'
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
                            💳 Ödemeyi Tamamla
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
