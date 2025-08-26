// src/App.tsx
import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import HomePage from './pages/HomePage';
import CartPage from './pages/CartPage';
import Navbar from './components/Navbar';
import Notification from './components/Notification';
import { supabase } from './supabaseClient'; // supabaseClient'ı içeri aktar
import { setUser, type AppUser } from './store/authSlice'; // setUser action'ını içeri aktar
import ProductDetail from './pages/ProductDetail';
import AuthPage from './pages/AuthPage';
import PrivateRoute from './components/PrivateRoute';
import AdminPage from './pages/AdminPage'; // AdminPage bileşenini import et
import { clearNotification } from './store/notificationSlice';
import type { RootState } from './store/store';
import CheckoutPage from './pages/CheckoutPage';

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
	const notification = useSelector((state: RootState) => state.notification);
	useEffect(() => {
		const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
			let user: AppUser | null = null;
			if (session?.user) {
				const isAdmin = session.user.app_metadata.is_admin === true;

				console.log('isAdmin:', isAdmin);
				console.log('session.user:', session.user);
				// Tip atamasını burada yapıyoruz
				user = { ...session.user, isAdmin } as AppUser;
			}
			dispatch(setUser(user));
		});
		return () => subscription.unsubscribe();
	}, [dispatch]);


	useEffect(() => {

		if (notification.message) {
			const timer = setTimeout(() => {
				dispatch(clearNotification());
			}, 3000);
			return () => clearTimeout(timer);
		}
	}, [notification, dispatch]);

	return (
		<>
			<Navbar />
			<Notification />
			<div style={{ backgroundColor: '#212121', color: '#fff', minHeight: '100vh', minWidth: '210vh' }}>
				<div className="container" style={{ padding: '20px' }}>
					<Routes>
						{/* Giriş sayfasına herkes erişebilsin */}
						<Route path="/auth" element={<AuthPage />} />
						<Route element={<PrivateRoute />}>
							<Route path="/" element={<HomePage />} />
							<Route path="/cart" element={<CartPage />} />
							<Route path="/product/:productId" element={<ProductDetail />} />
							<Route path="/checkout" element={<CheckoutPage />} /> {/* Yeni eklenen satır */}

						</Route>
						<Route element={<PrivateRoute isAdminRoute={true} />}>
							<Route path="/admin" element={<AdminPage />} />
						</Route>
					</Routes>
				</div>
			</div>
		</>
	);
};

export default App;
