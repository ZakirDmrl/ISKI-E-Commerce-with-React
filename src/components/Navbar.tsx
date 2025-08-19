// src/components/Navbar.tsx
// import { useCart } from '../context/useCard'; // eski useCart hook'u ile sepet verilerini alıyordum, şimdi Redux store'dan alıyorum
import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store'; // RootState tipini import edin
/*
Link: Uygulama içinde sayfalar arasında hızlı ve sorunsuz geçişler yapmak için kullanılır. Normal HTML <a> etiketi gibi çalışır, ancak sayfayı yeniden yüklemez.

useSelector, Redux store'dan state'i seçmek için kullanılır.

RootState: TypeScript ile tip güvenliği sağlamak için Redux store'unuzun tüm yapısını temsil eden RootState tipidir.
 */
const Navbar = () => {
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


	return (
		<nav style={{
			display: 'flex',
			justifyContent: 'space-between',
			alignItems: 'center',
			padding: '1rem 2rem',
			backgroundColor: '#f0f0f0',
			boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
		}}>
			<div className="navbar-left">
				<Link to="/" style={{ textDecoration: 'none', color: '#333', fontSize: '1.5rem', fontWeight: 'bold' }}>
					E-Ticaret
				</Link>
			</div>

			<div className="navbar-right">
				<ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', gap: '20px' }}>
					<li>
						<Link to="/" style={{ textDecoration: 'none', color: '#555', fontSize: '1rem' }}>
							Anasayfa
						</Link>
					</li>
					<li>
						<Link to="/cart" style={{ textDecoration: 'none', color: '#555', fontSize: '1rem' }}>
							Sepetim ({totalItems})
						</Link>
					</li>
				</ul>
			</div>
		</nav>
	);
};

export default Navbar;
