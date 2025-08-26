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
        const item = cartItems.find(item => item.id === productId);
        if (!item || !user) return;

        dispatch(decrementCartItemQuantity({ productId, userId: user.id }))
            .unwrap()
            .then(() => {
                if (item.quantity > 1) {
                    dispatch(setNotification({ message: `${item.title} sayısı azaltıldı.`, type: 'info' }));
                } else {
                    dispatch(setNotification({ message: `${item.title} sepetten kaldırıldı.`, type: 'error' }));
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

    // Ödeme butonunu eklemek için hesaplamalar
    const subtotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
    const tax = subtotal * 0.18; // %18 KDV
    const shipping = 20; // Sabit kargo ücreti
    const total = subtotal + tax + shipping;

    const handleCheckout = () => {
        navigate('/checkout');
    };

    if (status === 'loading') {
        return <p style={{ textAlign: 'center', marginTop: '50px' }}>Sepetiniz yükleniyor...</p>;
    }

    if (cartItems.length === 0) {
        return <p style={{ textAlign: 'center', marginTop: '50px' }}>Sepetinizde ürün bulunmamaktadır.</p>;
    }

    return (
        <div style={{ padding: '20px' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>Sepetim</h1>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', alignItems: 'flex-start' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                    {cartItems.map((item) => (
                        <div key={item.id} style={{ 
                            border: '1px solid #ccc',
                            padding: '15px',
                            borderRadius: '5px',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            height: '450px',
                            boxSizing: 'border-box'
                        }}>
                            <img 
                                src={item.image} 
                                alt={item.title} 
                                style={{ 
                                    width: '100%', 
                                    height: '200px', 
                                    objectFit: 'contain', 
                                    marginBottom: '10px' 
                                }} 
                            />
                            <h3 style={{ height: '40px', overflow: 'hidden' }}>{item.title}</h3>
                            <p>Fiyat: <strong>{item.price} TL</strong></p>
                            <p>Adet: {item.quantity}</p>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: 'auto' }}>
                                <button onClick={() => handleDecrement(item.id)} style={{ padding: '8px 12px', cursor: 'pointer', height: '40px' }}>-</button>
                                <button onClick={() => handleRemove(item.id)} style={{ padding: '8px 12px', cursor: 'pointer', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', height: '40px' }}>Tamamen Kaldır</button>
                            </div>
                        </div>
                    ))}
                </div>
                {/* Bu kısım sepete eklenmesi gereken yeni bölüm */}
                <div style={{
                    border: '1px solid #ccc',
                    padding: '20px',
                    borderRadius: '5px',
                    backgroundColor: '#333',
                    color: '#fff',
                }}>
                    <h2 style={{ marginBottom: '15px' }}>Sipariş Özeti</h2>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span>Ara Toplam:</span>
                        <span>{subtotal.toFixed(2)} TL</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span>KDV (%18):</span>
                        <span>{tax.toFixed(2)} TL</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                        <span>Kargo:</span>
                        <span>{shipping.toFixed(2)} TL</span>
                    </div>
                    <hr style={{ borderColor: '#666' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold' }}>
                        <span>Toplam:</span>
                        <span>{total.toFixed(2)} TL</span>
                    </div>
                    <button
                        onClick={handleCheckout}
                        style={{
                            width: '100%',
                            padding: '10px',
                            marginTop: '20px',
                            backgroundColor: '#198754',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                        }}
                    >
                        Ödemeye Geç
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CartPage;
