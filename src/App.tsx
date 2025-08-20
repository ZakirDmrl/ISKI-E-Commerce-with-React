// src/App.tsx
import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CartPage from './pages/CartPage';
import Navbar from './components/Navbar';
import Notification from './components/Notification';
import ProductDetail from './pages/ProductDetail'; // Ürün detay sayfasını import edin
// import { migrateProducts } from './utils/migrateData';

/*
App Bileşeni: Uygulamanın ana bileşenidir.
- <Navbar>: Uygulamanın üst kısmında bulunan navigasyon çubuğunu temsil eder.
- <Routes>: Uygulamanın yönlendirme yapısını tanımlar.
- <Route>: Belirli bir URL yoluna karşılık gelen bileşeni tanımlar
- <HomePage>: Ana sayfa bileşeni.
- <CartPage>: Sepet sayfası bileşeni.
<Routes>: Altındaki <Route> bileşenlerini gruplandırmak için kullanılır.
<Route>: Belirli bir URL yoluna (path) karşılık gelen bileşeni (element) eşleştirir.
*/
const App: React.FC = () => {
	useEffect(() => {
		// Sadece uygulama ilk yüklendiğinde çalışacak kodlar
		// Örneğin, başlangıçta bazı verileri yüklemek için kullanılabilir
		// migrateProducts(); // Fake API'den ürün verilerini Supabase'e aktarır
	},[]);
	return (
		<>
			<div style={{ backgroundColor: '#212121', color: '#fff', minHeight: '100vh', minWidth: '210vh' }}>
				<Navbar />
				<Notification />
				<div className="container" style={{ padding: '20px' }}>
					<Routes>
						<Route path="/" element={<HomePage />} />
						<Route path="/cart" element={<CartPage />} />
						<Route path="/product/:productId" element={<ProductDetail />} />

					</Routes>
				</div>
			</div>
		</>
	);
};

export default App;
