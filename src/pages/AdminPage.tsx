// src/pages/AdminPage.tsx
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../store/store';
import type { AppUser } from '../store/authSlice'; // AppUser tipini import et
import AddProductForm from './AddProductForm';
// AppUser tipini import et

const AdminPage: React.FC = () => {
	const navigate = useNavigate();
	// user'ı AppUser tipinde al
	const { user, isAuthenticated, status } = useSelector((state: RootState) => state.auth);

	useEffect(() => {
		if (status === 'succeeded' && (!isAuthenticated || !(user as AppUser)?.isAdmin)) {
			navigate('/');
		}
	}, [isAuthenticated, user, navigate, status]);

	// Yetkilendirme kontrolü devam ederken yükleniyor mesajı göster
	if (status === 'loading' || !isAuthenticated) {
		return <p style={{ textAlign: 'center', marginTop: '50px' }}>Erişim kontrol ediliyor...</p>;
	}

	// Yetkilendirme kontrolü başarısız olduğunda boş dön, bu useEffect'in yönlendirmesini sağlar
	if (!(user as AppUser)?.isAdmin) {
		return null;
	}

	return (
		<div style={{ padding: '20px' }}>
			<h1>Admin Paneli</h1>
			<p>Burada ürünleri ve kategorileri yöneteceksiniz.</p>
			<AddProductForm />

		</div>
	);
};

export default AdminPage;
