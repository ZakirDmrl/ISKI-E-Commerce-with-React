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

    if (status === 'loading') {
        return <p style={{ textAlign: 'center', marginTop: '50px' }}>Sepetiniz yükleniyor...</p>;
    }

    if (cartItems.length === 0) {
        return <p style={{ textAlign: 'center', marginTop: '50px' }}>Sepetinizde ürün bulunmamaktadır.</p>;
    }

    return (
        <div style={{ padding: '20px' }}>
            <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>Sepetim</h1>
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
                        height: '450px', // Sabit sepet kartı yüksekliği
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
        </div>
    );
};

export default CartPage;
