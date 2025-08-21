// src/components/Navbar.tsx
// import { useCart } from '../context/useCard'; // eski useCart hook'u ile sepet verilerini alıyordum, şimdi Redux store'dan alıyorum
// src/components/Navbar.tsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { type RootState, type AppDispatch } from '../store/store';
import { signOut } from '../store/authSlice';
import { setNotification, clearNotification } from '../store/notificationSlice';

/*
Link: Uygulama içinde sayfalar arasında hızlı ve sorunsuz geçişler yapmak için kullanılır. Normal HTML <a> etiketi gibi çalışır, ancak sayfayı yeniden yüklemez.

useSelector, Redux store'dan state'i seçmek için kullanılır.

RootState: TypeScript ile tip güvenliği sağlamak için Redux store'unuzun tüm yapısını temsil eden RootState tipidir.
 */
const Navbar = () => {
	// useDispatch, Redux store'a eylem göndermek için kullanılır.
	// AppDispatch, Redux store'un tipini temsil eder ve tip güvenliği sağlar.
	const dispatch = useDispatch<AppDispatch>();
	// useNavigate, React Router'da programatik olarak gezinmek için kullanılır.
	const navigate = useNavigate();
	// isAuthenticated, Redux store'dan kullanıcı kimlik doğrulama durumunu almak için kullanılır.
	// useSelector, Redux store'dan state'i seçmek için kullanılır.
	const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
	// const { cartItems } = useCart();  // eskiden gelen useCart hook'u ile sepet verilerini alıyordum
	// şimdi ise useSelector hook'u ile Redux store'dan sepet verilerini alıyorum
	// useSelector, Redux store'dan state'i seçmek için kullanılır.
	// Redux store'dan sepet verisini çekin
	const cartItems = useSelector((state: RootState) => state.cart.items);
	//(state: RootState) => state.cart.items: Bu, bir seçici (selector) fonksiyonudur. Redux store'unun tamamını (state) alır
	//ve state.cart.items yolunu izleyerek sadece sepet öğeleri dizisini döndürür.
	//Bu, bileşenin sadece sepet verisi değiştiğinde yeniden render olmasını sağlar ve performansı artırır.
	// Sepetteki toplam ürün sayısını hesapla
	const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

	const handleSignOut = async () => {
        const resultAction = await dispatch(signOut());
		if (signOut.fulfilled.match(resultAction)) {
			dispatch(setNotification({
				message: 'Çıkış işlemi başarılı.',
				type: 'success'
			}));
			navigate('/auth'); // Çıkış yaptıktan sonra kullanıcıyı kimlik doğrulama sayfasına yönlendir
		} else if (signOut.rejected.match(resultAction)) {
			dispatch(setNotification({
				message: 'Çıkış işlemi başarısız.',
				type: 'error'
			}));
		}
		setTimeout(() => dispatch(clearNotification()), 3000); // 3 saniye sonra bildirimi temizle
	}
 return (
        <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', backgroundColor: '#333', color: 'white' }}>
            <Link to="/" style={{ color: 'white', textDecoration: 'none', fontSize: '1.5rem', fontWeight: 'bold' }}>
                E-Ticaret
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                {isAuthenticated ? (
                    <>
                        <span style={{ fontSize: '0.9rem' }}>Hoş geldin, {user?.email}</span>
                        <button onClick={handleSignOut} style={{ padding: '8px 12px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                            Çıkış Yap
                        </button>
                    </>
                ) : (
                    <>
                        <Link to="/auth" style={{ color: 'white', textDecoration: 'none', padding: '8px 12px', backgroundColor: '#007bff', borderRadius: '4px' }}>
                            Giriş Yap
                        </Link>
                    </>
                )}
                <Link to="/cart" style={{ color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                    Sepet ({totalItems})
                </Link>
            </div>
        </nav>
    );
};

export default Navbar;
