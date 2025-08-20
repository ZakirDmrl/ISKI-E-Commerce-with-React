// src/App.tsx
import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import HomePage from './pages/HomePage';
import CartPage from './pages/CartPage';
import Navbar from './components/Navbar';
import Notification from './components/Notification';
import { supabase } from './supabaseClient'; // supabaseClient'ı içeri aktar
import { setUser } from './store/authSlice'; // setUser action'ını içeri aktar
import ProductDetail from './pages/ProductDetail';
import AuthPage from './pages/AuthPage';
import PrivateRoute from './components/PrivateRoute';
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
	const dispatch = useDispatch();
	useEffect(() => {
		// Sadece uygulama ilk yüklendiğinde çalışacak kodlar ya da [] içindeki değerler değiştiğinde bu kodda dispatch çalışacak kodlar
		// migrateProducts(); // Fake API'den ürün verilerini Supabase'e aktarır
		const {data: {subscription}} = supabase.auth.onAuthStateChange((_event, session) => {
			dispatch(setUser(session?.user ?? null)) // Kullanıcı oturum durumu değiştiğinde kullanıcıyı(state) güncelle
		});
		// Bileşen ayrıldığında listener'ı temizle
		return () => subscription.unsubscribe();
	}, [dispatch]);
	 return (
        <>
            <Navbar />
            <Notification />
            <div style={{ backgroundColor: '#212121', color: '#fff', minHeight: '100vh', minWidth: '210vh' }}>
                <div className="container" style={{ padding: '20px' }}>
                <Routes>
                        {/* Giriş sayfasına herkes erişebilsin */}
                        <Route path="/auth" element={<AuthPage />} />

                        {/* Korunan rotalar */}
                        <Route element={<PrivateRoute />}>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/cart" element={<CartPage />} />
                            <Route path="/product/:id" element={<ProductDetail />} />
                        </Route>
                    </Routes>
                </div>
            </div>
        </>
    );
};

export default App;
