// src/pages/AdminPage.tsx
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState, AppDispatch } from '../store/store';
import type { AppUser } from '../store/authSlice';
import { fetchLowStockCount } from '../store/productSlice';
import { setNotification } from '../store/notificationSlice';
import AddProductForm from './AddProductForm';
import ProductTable from '../components/ProductTable';
import type { DashboardStats, LowStockProduct, Product } from '../types';
import { apiClient } from '../config/api';

// Sayfalama için sabitler
const ITEMS_PER_PAGE = 8;

const AdminPage: React.FC = () => {
	const navigate = useNavigate();
	const dispatch = useDispatch<AppDispatch>();
	const { user, isAuthenticated, status } = useSelector((state: RootState) => state.auth);

	const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
	const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
	const [loadingStats, setLoadingStats] = useState(true);
	const [activeTab, setActiveTab] = useState<'overview' | 'add-product' | 'products'>('overview');

	// Ürün listesi ve sayfalama için yeni state'ler
	const [products, setProducts] = useState<Product[]>([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalCount, setTotalCount] = useState(0);
	const [loadingProducts, setLoadingProducts] = useState(false);

	useEffect(() => {
		if (status === 'succeeded' && (!isAuthenticated || !(user as AppUser)?.isAdmin)) {
			navigate('/');
		}
	}, [isAuthenticated, user, navigate, status]);

	useEffect(() => {
		if (isAuthenticated && (user as AppUser)?.isAdmin) {
			if (activeTab === 'overview') {
				fetchDashboardData();
				dispatch(fetchLowStockCount());
			} else if (activeTab === 'products') {
				fetchProducts();
			}
		}
	}, [isAuthenticated, user, dispatch, activeTab, currentPage]);

	// fetchDashboardData ve fetchProducts fonksiyonları backend API'ye çevrilmeli:
const fetchDashboardData = async () => {
    try {
        setLoadingStats(true);

        const [dashboardResponse, lowStockResponse] = await Promise.all([
            apiClient.get('/admin/dashboard-stats'),
            apiClient.get('/products/low-stock')
        ]);

        setDashboardStats(dashboardResponse.data);
        setLowStockProducts(lowStockResponse.data.products || []);
    } catch (error) {
        dispatch(setNotification({
            message: 'Dashboard verileri yüklenirken hata: ' + error.response?.data?.error || error.message,
            type: 'error'
        }));
    } finally {
        setLoadingStats(false);
    }
};

	const fetchProducts = async () => {
    setLoadingProducts(true);
    
    try {
        const response = await apiClient.get(`/products?page=${currentPage}&limit=${ITEMS_PER_PAGE}&admin=true`);
        setProducts(response.data.products);
        setTotalCount(response.data.total_count || 0);
    } catch (error) {
        dispatch(setNotification({
            message: 'Ürünler yüklenirken hata oluştu: ' + error.response?.data?.error || error.message,
            type: 'error',
        }));
    } finally {
        setLoadingProducts(false);
    }
};

	const handlePageChange = (page: number) => {
		setCurrentPage(page);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	if (status === 'loading' || !isAuthenticated) {
		return (
			<div className="loading-container">
				<div className="loading-content">
					<div className="loading-spinner"></div>
					<p>Erişim kontrol ediliyor...</p>
				</div>
				<style>{`
					.loading-container {
						display: flex;
						justify-content: center;
						align-items: center;
						min-height: 60vh;
						flex-direction: column;
						gap: 20px;
					}
					.loading-content {
						display: flex;
						flex-direction: column;
						align-items: center;
						gap: 20px;
					}
					.loading-spinner {
						width: 50px;
						height: 50px;
						border: 4px solid #333;
						border-top: 4px solid #007bff;
						border-radius: 50%;
						animation: spin 1s linear infinite;
					}
					.loading-content p {
						color: #fff;
						font-size: 1.2rem;
						margin: 0;
					}
				`}</style>
			</div>
		);
	}

	if (!(user as AppUser)?.isAdmin) {
		return null;
	}

	const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

	const StatCard: React.FC<{ title: string; value: string | number; icon: string; color: string; subtitle?: string }> =
		({ title, value, icon, color, subtitle }) => (
			<div className="stat-card">
				<div className="stat-icon">{icon}</div>
				<h3 className="stat-value" style={{ color }}>
					{typeof value === 'number' && title.includes('TL') ?
						`${value.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL` :
						value.toLocaleString('tr-TR')}
				</h3>
				<p className="stat-title">{title}</p>
				{subtitle && <p className="stat-subtitle">{subtitle}</p>}
			</div>
		);

	return (
		<div className="admin-page">
			{/* Header */}
			<div className="admin-header">
				<h1 className="admin-title">Admin Dashboard</h1>
				<p className="admin-subtitle">Mağaza yönetimi ve stok takibi</p>
			</div>

			{/* Navigation Tabs */}
			<div className="admin-tabs">
				{[
					{ id: 'overview', label: 'Genel Bakış', icon: '📊' },
					{ id: 'add-product', label: 'Ürün Ekle', icon: '➕' },
					{ id: 'products', label: 'Ürünler', icon: '📦' }
				].map((tab) => (
					<button
						key={tab.id}
						onClick={() => {
							setActiveTab(tab.id as any);
							if (tab.id === 'products') {
								setCurrentPage(1);
							}
						}}
						className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
					>
						<span className="tab-icon">{tab.icon}</span>
						<span className="tab-label">{tab.label}</span>
					</button>
				))}
			</div>

			{/* Content based on active tab */}
			{activeTab === 'overview' && (
				<div className="overview-content">
					{/* Dashboard Stats */}
					{loadingStats ? (
						<div className="stats-loading">Dashboard yükleniyor...</div>
					) : dashboardStats && (
						<div className="stats-grid">
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
						<div className="low-stock-alert">
							<h3 className="alert-title">
								⚠️ Düşük Stok Uyarısı
							</h3>
							<div className="low-stock-grid">
								{lowStockProducts.slice(0, 6).map((product) => (
									<div key={product.id} className="low-stock-item">
										<div className="product-info">
											<p className="product-name">{product.name}</p>
											<p className="product-sku">SKU: {product.sku || 'N/A'}</p>
										</div>
										<div className="stock-badge">
											{product.available_stock} / {product.min_stock_level}
										</div>
									</div>
								))}
							</div>
							{lowStockProducts.length > 6 && (
								<p className="remaining-count">
									...ve {lowStockProducts.length - 6} ürün daha
								</p>
							)}
						</div>
					)}
				</div>
			)}

			{activeTab === 'add-product' && (
				<div className="add-product-content">
					<AddProductForm />
				</div>
			)}

			{activeTab === 'products' && (
				<div className="products-content">
					<div className="products-header">
						<h2 className="products-title">Ürün Yönetimi</h2>
						<button
							onClick={() => fetchProducts()}
							className="refresh-button"
							disabled={loadingProducts}
						>
							{loadingProducts ? 'Yükleniyor...' : '🔄 Yenile'}
						</button>
					</div>

					{loadingProducts ? (
						<div className="products-loading">Ürünler yükleniyor...</div>
					) : (
						<div className="table-container">
							<ProductTable products={products} onProductUpdated={fetchProducts} />
						</div>
					)}

					{/* Pagination Controls */}
					{totalCount > 0 && (
						<div className="pagination">
							<button
								onClick={() => handlePageChange(currentPage - 1)}
								disabled={currentPage === 1}
								className="pagination-btn"
							>
								Önceki
							</button>
							<span className="pagination-info">
								Sayfa {currentPage} / {totalPages}
							</span>
							<button
								onClick={() => handlePageChange(currentPage + 1)}
								disabled={currentPage === totalPages}
								className="pagination-btn"
							>
								Sonraki
							</button>
						</div>
					)}
				</div>
			)}

			<style>{`
				.admin-page {
					width: 100%;
					min-height: calc(100vh - 120px);
					padding: 0;
				}

				/* Header Styles */
				.admin-header {
					background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
					border-radius: 16px;
					padding: clamp(1.5rem, 4vw, 2rem);
					margin: 1rem;
					margin-bottom: 2rem;
					text-align: center;
					box-shadow: 0 20px 40px rgba(0,0,0,0.3);
				}

				.admin-title {
					font-size: clamp(1.5rem, 4vw, 2rem);
					font-weight: 700;
					margin: 0;
					background: linear-gradient(45deg, #fff, #e0e0e0);
					-webkit-background-clip: text;
					-webkit-text-fill-color: transparent;
					background-clip: text;
				}

				.admin-subtitle {
					font-size: clamp(0.9rem, 2vw, 1rem);
					opacity: 0.9;
					margin: 0.5rem 0 0 0;
					color: #fff;
				}

				/* Navigation Tabs */
				.admin-tabs {
					display: flex;
					gap: 0.5rem;
					margin: 1rem;
					margin-bottom: 2rem;
					background: rgba(255,255,255,0.05);
					border-radius: 12px;
					padding: 0.25rem;
					overflow-x: auto;
				}

				.tab-button {
					flex: 1;
					padding: clamp(0.75rem, 2vw, 1rem);
					background: transparent;
					color: #fff;
					border: none;
					border-radius: 8px;
					cursor: pointer;
					font-size: clamp(0.85rem, 2vw, 1rem);
					font-weight: 600;
					transition: all 0.3s ease;
					display: flex;
					align-items: center;
					justify-content: center;
					gap: 0.5rem;
					white-space: nowrap;
					min-width: fit-content;
				}

				.tab-button.active {
					background: rgba(255,255,255,0.2);
				}

				.tab-button:hover:not(.active) {
					background: rgba(255,255,255,0.1);
				}

				.tab-icon {
					font-size: 1.1em;
				}

				/* Overview Content */
				.overview-content {
					margin: 1rem;
				}

				.stats-loading {
					text-align: center;
					padding: 2rem;
					color: #fff;
					font-size: 1.1rem;
				}

				.stats-grid {
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(min(250px, 100%), 1fr));
					gap: clamp(1rem, 3vw, 1.5rem);
					margin-bottom: 2rem;
				}

				.stat-card {
					background: rgba(255,255,255,0.05);
					backdrop-filter: blur(10px);
					border-radius: 12px;
					padding: clamp(1rem, 3vw, 1.5rem);
					border: 1px solid rgba(255,255,255,0.1);
					text-align: center;
					transition: transform 0.3s ease, box-shadow 0.3s ease;
				}

				.stat-card:hover {
					transform: translateY(-2px);
					box-shadow: 0 10px 25px rgba(0,0,0,0.2);
				}

				.stat-icon {
					font-size: clamp(1.5rem, 4vw, 2rem);
					margin-bottom: 0.5rem;
				}

				.stat-value {
					font-size: clamp(1.5rem, 4vw, 2rem);
					font-weight: 700;
					margin: 0 0 0.25rem 0;
				}

				.stat-title {
					color: #ccc;
					margin: 0;
					font-size: clamp(0.85rem, 2vw, 0.9rem);
				}

				.stat-subtitle {
					color: #888;
					margin: 0.25rem 0 0 0;
					font-size: clamp(0.75rem, 1.5vw, 0.8rem);
				}

				/* Low Stock Alert */
				.low-stock-alert {
					background: rgba(255, 193, 7, 0.1);
					border-radius: 16px;
					padding: clamp(1rem, 3vw, 1.5rem);
					margin-bottom: 2rem;
					border: 1px solid rgba(255, 193, 7, 0.3);
				}

				.alert-title {
					color: #FFC107;
					font-size: clamp(1.1rem, 3vw, 1.3rem);
					font-weight: 700;
					margin: 0 0 1rem 0;
					display: flex;
					align-items: center;
					gap: 0.5rem;
				}

				.low-stock-grid {
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr));
					gap: 1rem;
				}

				.low-stock-item {
					background: rgba(255,255,255,0.05);
					border-radius: 8px;
					padding: 0.75rem;
					display: flex;
					justify-content: space-between;
					align-items: center;
					gap: 1rem;
				}

				.product-info {
					flex: 1;
				}

				.product-name {
					color: #fff;
					margin: 0;
					font-weight: 600;
					font-size: 0.9rem;
				}

				.product-sku {
					color: #ccc;
					margin: 0.25rem 0 0 0;
					font-size: 0.8rem;
				}

				.stock-badge {
					background: #FFC107;
					color: #000;
					padding: 0.25rem 0.5rem;
					border-radius: 12px;
					font-size: 0.8rem;
					font-weight: 600;
					white-space: nowrap;
				}

				.remaining-count {
					color: #FFC107;
					text-align: center;
					margin: 1rem 0 0 0;
					font-size: 0.9rem;
				}

				/* Add Product Content */
				.add-product-content {
					background: rgba(255,255,255,0.05);
					backdrop-filter: blur(10px);
					border-radius: 16px;
					padding: clamp(1rem, 3vw, 2rem);
					margin: 1rem;
					border: 1px solid rgba(255,255,255,0.1);
					box-shadow: 0 20px 40px rgba(0,0,0,0.2);
				}

				/* Products Content */
				.products-content {
					background: rgba(255,255,255,0.05);
					backdrop-filter: blur(10px);
					border-radius: 16px;
					padding: clamp(1rem, 3vw, 2rem);
					margin: 1rem;
					border: 1px solid rgba(255,255,255,0.1);
					box-shadow: 0 20px 40px rgba(0,0,0,0.2);
				}

				.products-header {
					display: flex;
					justify-content: space-between;
					align-items: center;
					margin-bottom: 1.5rem;
					gap: 1rem;
				}

				.products-title {
					font-size: clamp(1.2rem, 3vw, 1.5rem);
					font-weight: 700;
					color: #fff;
					margin: 0;
				}

				.refresh-button {
					padding: 0.5rem 1rem;
					background: rgba(255,255,255,0.1);
					color: #fff;
					border: 1px solid rgba(255,255,255,0.2);
					border-radius: 8px;
					cursor: pointer;
					font-size: 0.9rem;
					transition: all 0.3s ease;
					white-space: nowrap;
				}

				.refresh-button:hover:not(:disabled) {
					background: rgba(255,255,255,0.2);
				}

				.refresh-button:disabled {
					opacity: 0.6;
					cursor: not-allowed;
				}

				.products-loading {
					text-align: center;
					color: #fff;
					padding: 2rem;
					font-size: 1.1rem;
				}

				.table-container {
					overflow-x: auto;
					border-radius: 8px;
				}

				/* Pagination */
				.pagination {
					display: flex;
					justify-content: center;
					align-items: center;
					gap: 1rem;
					margin-top: 1.5rem;
					flex-wrap: wrap;
				}

				.pagination-btn {
					padding: 0.5rem 1rem;
					background: rgba(255,255,255,0.1);
					color: #fff;
					border: none;
					border-radius: 8px;
					cursor: pointer;
					transition: all 0.3s ease;
				}

				.pagination-btn:hover:not(:disabled) {
					background: rgba(255,255,255,0.2);
				}

				.pagination-btn:disabled {
					opacity: 0.5;
					cursor: not-allowed;
				}

				.pagination-info {
					color: #fff;
					font-size: 0.9rem;
				}

				/* Mobile Responsive */
				@media (max-width: 768px) {
					.admin-page {
						padding: 0;
					}

					.admin-header {
						margin: 0.5rem;
						border-radius: 12px;
					}

					.admin-tabs {
						margin: 0.5rem;
						padding: 0.25rem;
					}

					.tab-button {
						padding: 0.75rem 0.5rem;
						font-size: 0.85rem;
					}

					.tab-label {
						display: none;
					}

					.overview-content,
					.add-product-content,
					.products-content {
						margin: 0.5rem;
						padding: 1rem;
						border-radius: 12px;
					}

					.stats-grid {
						grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
						gap: 1rem;
					}

					.low-stock-grid {
						grid-template-columns: 1fr;
					}

					.products-header {
						flex-direction: column;
						align-items: stretch;
						gap: 1rem;
					}

					.refresh-button {
						align-self: center;
						width: fit-content;
					}
				}

				@media (max-width: 480px) {
					.admin-header {
						padding: 1rem;
					}

					.stats-grid {
						grid-template-columns: 1fr;
					}

					.low-stock-item {
						flex-direction: column;
						align-items: flex-start;
						gap: 0.5rem;
					}

					.stock-badge {
						align-self: flex-end;
					}
				}

				/* High DPI adjustments */
				@media (min-resolution: 150dpi) {
					.stat-card {
						padding: 1.5rem;
					}
					
					.admin-tabs {
						padding: 0.5rem;
					}
				}
			`}</style>
		</div>
	);
};

export default AdminPage;
