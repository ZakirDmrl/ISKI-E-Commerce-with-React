// src/pages/CheckoutPage.tsx
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { type RootState } from '../store/store';
import { clearCart } from '../store/cartSlice';
import { useNavigate } from 'react-router-dom';

const CheckoutPage: React.FC = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { items, status } = useSelector((state: RootState) => state.cart);

    // Toplam tutarı hesaplama
    const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
    const tax = subtotal * 0.18; // %18 KDV
    const shipping = 20; // Sabit kargo ücreti
    const total = subtotal + tax + shipping;

    // Şu an için basit bir ödeme işlemi
    const handleCheckout = () => {
        if (items.length === 0) {
            alert('Sepetiniz boş!');
            return;
        }

        // Ödeme başarılı farz ediliyor
        alert('Ödeme başarıyla tamamlandı!');
        
        // Sepeti temizle
        dispatch(clearCart());
        
        // Ana sayfaya yönlendir
        navigate('/');
    };

    if (status === 'loading') {
        return <div className="text-center mt-5">Sepet yükleniyor...</div>;
    }

    if (items.length === 0) {
        return <div className="text-center mt-5">Sepetinizde ürün bulunmamaktadır.</div>;
    }

    return (
        <div className="container py-5">
            <h1 className="mb-4 text-white">Ödeme</h1>
            <div className="row">
                <div className="col-md-8">
                    <div className="card bg-dark text-white p-4">
                        <h2 className="mb-4">Sipariş Özeti</h2>
                        <ul className="list-group list-group-flush">
                            {items.map((item) => (
                                <li key={item.id} className="list-group-item d-flex justify-content-between align-items-center bg-dark text-white">
                                    <span>{item.title} ({item.quantity} adet)</span>
                                    <span className="fw-bold">{(item.price * item.quantity).toFixed(2)} TL</span>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-4">
                            <div className="d-flex justify-content-between fw-bold">
                                <span>Ara Toplam:</span>
                                <span>{subtotal.toFixed(2)} TL</span>
                            </div>
                            <div className="d-flex justify-content-between">
                                <span>KDV (%18):</span>
                                <span>{tax.toFixed(2)} TL</span>
                            </div>
                            <div className="d-flex justify-content-between">
                                <span>Kargo:</span>
                                <span>{shipping.toFixed(2)} TL</span>
                            </div>
                            <hr className="text-white-50" />
                            <div className="d-flex justify-content-between h4 fw-bold">
                                <span>Toplam:</span>
                                <span>{total.toFixed(2)} TL</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="card bg-dark text-white p-4">
                        <h2 className="mb-4">Ödeme Bilgileri</h2>
                        <form>
                            <div className="mb-3">
                                <label htmlFor="cardNumber" className="form-label">Kart Numarası</label>
                                <input type="text" className="form-control bg-secondary text-white border-secondary" id="cardNumber" placeholder="XXXX-XXXX-XXXX-XXXX" />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="cardName" className="form-label">Kart Üzerindeki İsim</label>
                                <input type="text" className="form-control bg-secondary text-white border-secondary" id="cardName" />
                            </div>
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label htmlFor="expiryDate" className="form-label">Son Kullanma Tarihi</label>
                                    <input type="text" className="form-control bg-secondary text-white border-secondary" id="expiryDate" placeholder="AA/YY" />
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label htmlFor="cvv" className="form-label">CVV</label>
                                    <input type="text" className="form-control bg-secondary text-white border-secondary" id="cvv" placeholder="123" />
                                </div>
                            </div>
                            <button type="button" onClick={handleCheckout} className="btn btn-success w-100 mt-3">
                                <i className="bi bi-credit-card me-2"></i> Ödemeyi Tamamla
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
