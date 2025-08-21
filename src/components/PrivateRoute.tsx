// src/components/PrivateRoute.tsx
import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';
import type { RootState } from '../store/store';

const PrivateRoute = () => {
	// Redux store'dan auth durumunu al
	const { isAuthenticated } = useSelector((state: RootState) => state.auth);

	// Kullanıcı giriş yapmışsa, istenen sayfayı (Outlet) render et.
	// Yapmamız gereken, eğer giriş yapılmamışsa AuthPage'e yönlendirmek.
	return isAuthenticated ? <Outlet /> : <Navigate to="/auth" />;
};

export default PrivateRoute;
