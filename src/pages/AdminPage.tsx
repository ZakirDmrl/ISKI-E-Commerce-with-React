// src/pages/AdminPage.tsx
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import type { RootState, AppDispatch } from '../store/store';
import type { AppUser } from '../store/authSlice';
import { fetchLowStockCount } from '../store/productSlice';
import { setNotification } from '../store/notificationSlice';
import AddProductForm from './AddProductForm';
import ProductTable from '../components/ProductTable';
import type { DashboardStats, LowStockProduct } from '../types';

const AdminPage: React.FC = () => {
	const navigate = useNavigate();
	const dispatch = useDispatch<AppDispatch>();
	const { user, isAuthenticated, status } = useSelector((state: RootState) => state.auth);
	
	const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
	const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
	const [loadingStats, setLoadingStats] = useState(true);
	const [activeTab, setActiveTab] = useState<'overview' | 'add-product' | 'products'>('overview');

	useEffect(() => {
		if (status === 'succeeded' && (!isAuthenticated || !(user as AppUser)?.isAdmin)) {
			navigate('/');
		}
	}, [isAuthenticated, user, navigate, status]);

	useEffect(() => {
		if (isAuthenticated && (user as AppUser)?.isAdmin) {
			fetchDashboardData();
			dispatch(fetchLowStockCount());
		}
	}, [isAuthenticated, user, dispatch]);

	const fetchDashboardData = async () => {
		try {
			setLoadingStats(true);
			
			// Paralel olarak verileri çek
			const [
				{ count: totalProducts },
				{ count: totalOrders },
				{ data: inventoryValue },
				{ data: lowStock }
			] = await Promise.all([
				supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
				supabase.from('orders').select('*', { count: 'exact', head: true }),
				supabase.from('inventory_value_report').select('*').single(),
				supabase.from('low_stock_products').select('*')
			]);

			// Toplam gelir hesapla
			const { data: orders } = await supabase
				.from('orders')
				.select('total_amount')
				.in('status', ['completed', 'paid']);
			
			const totalRevenue = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

			// Stok durumu sayıları
			const { data: stockData } = await supabase.from('stock_report').select('stock_status');
			const outOfStockCount = stockData?.filter(item => item.stock_status === 'OUT_OF_STOCK').length || 0;

			setDashboardStats({
				total_products: totalProducts || 0,
				total_orders: totalOrders || 0,
				total_revenue: totalRevenue,
				low_stock_count: lowStock?.length || 0,
				out_of_stock_count: outOfStockCount,
				inventory_value: inventoryValue?.total_retail_value || 0
			});

			setLowStockProducts(lowStock || []);

		} catch (error) {
			dispatch(setNotification({ 
				message: 'Dashboard verileri yüklenirken hata: ' + error.message, 
				type: 'error' 
			}));
		} finally {
			setLoadingStats(false);
		}
	};

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

	const StatCard: React.FC<{ title: string; value: string | number; icon: string; color: string; subtitle?: string }> = 
		({ title, value, icon, color, subtitle }) => (
		<div style={{
			background: 'rgba(255,255,255,0.05)',
			backdropFilter: 'blur(10px)',
			borderRadius: '12px',
			padding: '20px',
			border: '1px solid rgba(255,255,255,0.1)',
			textAlign: 'center',
			transition: 'transform 0.3s ease'
		}}>
			<div style={{ fontSize: '2rem', marginBottom: '10px' }}>{icon}</div>
			<h3 style={{ 
				color: color, 
				fontSize: '2rem', 
				fontWeight: '700', 
				margin: '0 0 5px 0' 
			}}>
				{typeof value === 'number' && title.includes('TL') ? 
					`${value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL` : 
					value.toLocaleString('tr-TR')}
			</h3>
			<p style={{ color: '#ccc', margin: '0', fontSize: '0.9rem' }}>{title}</p>
			{subtitle && (
				<p style={{ color: '#888', margin: '5px 0 0 0', fontSize: '0.8rem' }}>{subtitle}</p>
			)}
		</div>
	);

	return (
		<div style={{ width: '100%', padding: '0 20px' }}>
			{/* Header */}
			<div style={{
				background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
				borderRadius: '16px',
				padding: '30px',
				marginBottom: '30px',
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
					Admin Dashboard
				</h1>
				<p style={{
					fontSize: '1rem',
					opacity: 0.9,
					margin: '8px 0 0 0',
					color: '#fff'
				}}>
					Mağaza yönetimi ve stok takibi
				</p>
			</div>

			{/* Navigation Tabs */}
			<div style={{
				display: 'flex',
				gap: '10px',
				marginBottom: '30px',
				background: 'rgba(255,255,255,0.05)',
				borderRadius: '12px',
				padding: '5px'
			}}>
				{[
					{ id: 'overview', label: 'Genel Bakış', icon: '📊' },
					{ id: 'add-product', label: 'Ürün Ekle', icon: '➕' },
					{ id: 'products', label: 'Ürünler', icon: '📦' }
				].map((tab) => (
					<button
						key={tab.id}
						onClick={() => setActiveTab(tab.id as any)}
						style={{
							flex: 1,
							padding: '12px 20px',
							background: activeTab === tab.id ? 'rgba(255,255,255,0.2)' : 'transparent',
							color: '#fff',
							border: 'none',
							borderRadius: '8px',
							cursor: 'pointer',
							fontSize: '1rem',
							fontWeight: '600',
							transition: 'all 0.3s ease',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							gap: '8px'
						}}
					>
						<span>{tab.icon}</span>
						{tab.label}
					</button>
				))}
			</div>

			{/* Content based on active tab */}
			{activeTab === 'overview' && (
				<>
					{/* Dashboard Stats */}
					{loadingStats ? (
						<div style={{ textAlign: 'center', padding: '40px', color: '#fff' }}>
							Dashboard yükleniyor...
						</div>
					) : dashboardStats && (
						<div style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
							gap: '20px',
							marginBottom: '30px'
						}}>
							<StatCard
								title="Toplam Ürün"
								value={dashboardStats.total_products}
								icon="📦"
								color="#4CAF50"
							/>
							<StatCard
								title="Toplam Sipariş"
								value={dashboardStats.total_orders}
								icon="🛒"
								color="#2196F3"
							/>
							<StatCard
								title="Toplam Gelir"
								value={dashboardStats.total_revenue}
								icon="💰"
								color="#FF9800"
							/>
							<StatCard
								title="Düşük Stok"
								value={dashboardStats.low_stock_count}
								icon="⚠️"
								color="#FFC107"
								subtitle="Uyarı gerekli"
							/>
							<StatCard
								title="Tükenen Ürünler"
								value={dashboardStats.out_of_stock_count}
								icon="❌"
								color="#F44336"
								subtitle="Acil stok gerekli"
							/>
							<StatCard
								title="Stok Değeri"
								value={dashboardStats.inventory_value}
								icon="💎"
								color="#9C27B0"
							/>
						</div>
					)}

					{/* Low Stock Alert */}
					{lowStockProducts.length > 0 && (
						<div style={{
							background: 'rgba(255, 193, 7, 0.1)',
							borderRadius: '16px',
							padding: '25px',
							marginBottom: '30px',
							border: '1px solid rgba(255, 193, 7, 0.3)'
						}}>
							<h3 style={{
								color: '#FFC107',
								fontSize: '1.3rem',
								fontWeight: '700',
								margin: '0 0 15px 0',
								display: 'flex',
								alignItems: 'center',
								gap: '8px'
							}}>
								⚠️ Düşük Stok Uyarısı
							</h3>
							<div style={{
								display: 'grid',
								gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
								gap: '15px'
							}}>
								{lowStockProducts.slice(0, 6).map((product) => (
									<div
										key={product.id}
										style={{
											background: 'rgba(255,255,255,0.05)',
											borderRadius: '8px',
											padding: '12px',
											display: 'flex',
											justifyContent: 'space-between',
											alignItems: 'center'
										}}
									>
										<div>
											<p style={{ 
												color: '#fff', 
												margin: '0', 
												fontWeight: '600',
												fontSize: '0.9rem'
											}}>
												{product.name}
											</p>
											<p style={{ 
												color: '#ccc', 
												margin: '2px 0 0 0', 
												fontSize: '0.8rem'
											}}>
												SKU: {product.sku || 'N/A'}
											</p>
										</div>
										<div style={{ textAlign: 'right' }}>
											<span style={{
												background: '#FFC107',
												color: '#000',
												padding: '4px 8px',
												borderRadius: '12px',
												fontSize: '0.8rem',
												fontWeight: '600'
											}}>
												{product.available_stock} / {product.min_stock_level}
											</span>
										</div>
									</div>
								))}
							</div>
							{lowStockProducts.length > 6 && (
								<p style={{ 
									color: '#FFC107', 
									textAlign: 'center', 
									margin: '15px 0 0 0',
									fontSize: '0.9rem'
								}}>
									...ve {lowStockProducts.length - 6} ürün daha
								</p>
							)}
						</div>
					)}
				</>
			)}

			{activeTab === 'add-product' && (
				<div style={{
					background: 'rgba(255,255,255,0.05)',
					backdropFilter: 'blur(10px)',
					borderRadius: '16px',
					padding: '30px',
					border: '1px solid rgba(255,255,255,0.1)',
					boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
				}}>
					<AddProductForm />
				</div>
			)}

			{activeTab === 'products' && (
				<div style={{
					background: 'rgba(255,255,255,0.05)',
					backdropFilter: 'blur(10px)',
					borderRadius: '16px',
					padding: '30px',
					border: '1px solid rgba(255,255,255,0.1)',
					boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
				}}>
					<div style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						marginBottom: '25px'
					}}>
						<h2 style={{
							fontSize: '1.5rem',
							fontWeight: '700',
							color: '#fff',
							margin: '0'
						}}>
							Ürün Yönetimi
						</h2>
						<button
							onClick={fetchDashboardData}
							style={{
								padding: '8px 16px',
								background: 'rgba(255,255,255,0.1)',
								color: '#fff',
								border: '1px solid rgba(255,255,255,0.2)',
								borderRadius: '8px',
								cursor: 'pointer',
								fontSize: '0.9rem',
								transition: 'all 0.3s ease'
							}}
						>
							🔄 Yenile
						</button>
					</div>
					<ProductTable />
				</div>
			)}
		</div>
	);
};

export default AdminPage;
