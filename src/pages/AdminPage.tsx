// src/pages/AdminPage.tsx
import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../store/store';
import type { AppUser } from '../store/authSlice';
import AddProductForm from './AddProductForm';
import ProductTable from '../components/ProductTable';

const AdminPage: React.FC = () => {
	const navigate = useNavigate();
	const { user, isAuthenticated, status } = useSelector((state: RootState) => state.auth);

	useEffect(() => {
		if (status === 'succeeded' && (!isAuthenticated || !(user as AppUser)?.isAdmin)) {
			navigate('/');
		}
	}, [isAuthenticated, user, navigate, status]);

	if (status === 'loading' || !isAuthenticated) {
		return (
			<div style={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				minHeight: '60vh',
				flexDirection: 'column',
				gap: '20px'
			}}>
				<div style={{
					width: '50px',
					height: '50px',
					border: '4px solid #333',
					borderTop: '4px solid #007bff',
					borderRadius: '50%',
					animation: 'spin 1s linear infinite'
				}}></div>
				<p style={{ color: '#fff', fontSize: '1.2rem' }}>Erişim kontrol ediliyor...</p>
			</div>
		);
	}

	if (!(user as AppUser)?.isAdmin) {
		return null;
	}

	return (
		<div style={{ width: '100%', padding: '0 20px' }}>
			{/* Header */}
			<div style={{
				background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
				borderRadius: '16px',
				padding: '30px',
				marginBottom: '30px',
				marginTop: '1800px',
				textAlign: 'center',
				boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
			}}>
				<h1 style={{
					fontSize: '2rem',
					fontWeight: '700',
					margin: '0',
					background: 'linear-gradient(45deg, #fff, #e0e0e0)',
					WebkitBackgroundClip: 'text',
					WebkitTextFillColor: 'transparent',
					backgroundClip: 'text'
				}}>
					Admin Paneli
				</h1>
				<p style={{
					fontSize: '1rem',
					opacity: 0.9,
					margin: '8px 0 0 0',
					color: '#fff'
				}}>
					Hoş geldin, burada ürünleri yönetebilirsin
				</p>
			</div>

			{/* Add Product Form */}
			<div style={{
				background: 'rgba(255,255,255,0.05)',
				backdropFilter: 'blur(10px)',
				borderRadius: '16px',
				padding: '30px', // Değeri 30px olarak değiştirin
				marginBottom: '30px', // Değeri 30px olarak değiştirin
				border: '1px solid rgba(255,255,255,0.1)',
				boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
			}}>
				<AddProductForm />
			</div>

			{/* Products Table */}
			<div style={{
				background: 'rgba(255,255,255,0.05)',
				backdropFilter: 'blur(10px)',
				borderRadius: '16px',
				padding: '30px',
				border: '1px solid rgba(255,255,255,0.1)',
				boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
			}}>
				<h2 style={{
					fontSize: '1.5rem',
					fontWeight: '700',
					color: '#fff',
					margin: '0 0 25px 0'
				}}>
					Mevcut Ürünler
				</h2>
				<ProductTable />
			</div>
		</div>
	);
};

export default AdminPage;
