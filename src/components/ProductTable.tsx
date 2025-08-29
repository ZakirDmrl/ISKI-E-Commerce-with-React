// src/components/ProductTable.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useDispatch } from 'react-redux';
import { setNotification } from '../store/notificationSlice';
import EditProductModal from './EditProductModal';
import type { ProductWithStock, StockStatus } from '../types';

const ProductTable: React.FC = () => {
    const dispatch = useDispatch();
    const [products, setProducts] = useState<ProductWithStock[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<ProductWithStock | null>(null);
    const [showStockModal, setShowStockModal] = useState(false);
    const [selectedProductForStock, setSelectedProductForStock] = useState<ProductWithStock | null>(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('products')
                .select(`
                    *,
                    inventory:inventory(
                        id,
                        quantity,
                        reserved_quantity,
                        min_stock_level,
                        max_stock_level,
                        cost_price,
                        updated_at
                    )
                `)
                .order('id', { ascending: false });

            if (error) {
                dispatch(setNotification({ message: 'Ürünler yüklenirken hata oluştu: ' + error.message, type: 'error' }));
            } else {
                // Stok bilgilerini hesapla
                const productsWithStock: ProductWithStock[] = (data || []).map(product => {
                    const inventory = Array.isArray(product.inventory) ? product.inventory[0] : product.inventory;
                    const availableStock = inventory ? inventory.quantity - inventory.reserved_quantity : 0;
                    
                    let stockStatus: StockStatus = 'IN_STOCK';
                    if (availableStock <= 0) {
                        stockStatus = 'OUT_OF_STOCK';
                    } else if (inventory && availableStock <= inventory.min_stock_level) {
                        stockStatus = 'LOW_STOCK';
                    }

                    return {
                        ...product,
                        inventory,
                        available_stock: availableStock,
                        stock_status: stockStatus
                    };
                });

                setProducts(productsWithStock);
            }
        } catch (error) {
            dispatch(setNotification({ message: 'Beklenmedik hata: ' + error.message, type: 'error' }));
        }
        setLoading(false);
    };

    const handleDelete = async (productId: number) => {
        if (window.confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', productId);

            if (error) {
                dispatch(setNotification({ message: 'Ürün silinirken bir hata oluştu: ' + error.message, type: 'error' }));
            } else {
                dispatch(setNotification({ message: 'Ürün başarıyla silindi.', type: 'success' }));
                fetchProducts();
            }
        }
    };
    
    const handleEditClick = (product: ProductWithStock) => {
        setSelectedProduct(product);
        setShowModal(true);
    };

    const handleStockClick = (product: ProductWithStock) => {
        setSelectedProductForStock(product);
        setShowStockModal(true);
    };
    
    const handleModalClose = () => {
        setShowModal(false);
        setSelectedProduct(null);
    };

    const handleStockModalClose = () => {
        setShowStockModal(false);
        setSelectedProductForStock(null);
    };

    const getStockStatusBadge = (stockStatus: StockStatus, availableStock: number) => {
        const badgeStyles = {
            OUT_OF_STOCK: { bg: '#dc3545', color: 'white', text: 'Stokta Yok' },
            LOW_STOCK: { bg: '#ffc107', color: 'black', text: 'Düşük Stok' },
            IN_STOCK: { bg: '#28a745', color: 'white', text: 'Stokta Var' }
        };

        const style = badgeStyles[stockStatus];
        
        return (
            <span 
                className="badge" 
                style={{ 
                    backgroundColor: style.bg, 
                    color: style.color,
                    marginRight: '5px'
                }}
            >
                {style.text} ({availableStock})
            </span>
        );
    };

    const StockModal: React.FC<{ product: ProductWithStock; onClose: () => void }> = ({ product, onClose }) => {
        const [stockQuantity, setStockQuantity] = useState('');
        const [stockType, setStockType] = useState<'IN' | 'OUT' | 'ADJUSTMENT'>('IN');
        const [reason, setReason] = useState('');
        const [loading, setLoading] = useState(false);

        const handleStockUpdate = async (e: React.FormEvent) => {
            e.preventDefault();
            if (!stockQuantity || isNaN(Number(stockQuantity))) {
                dispatch(setNotification({ message: 'Geçerli bir miktar girin', type: 'error' }));
                return;
            }

            setLoading(true);
            try {
                const { error } = await supabase.rpc('add_stock', {
                    product_id_param: product.id,
                    quantity_param: stockType === 'OUT' ? -Number(stockQuantity) : Number(stockQuantity),
                    reference_type_param: stockType,
                    notes_param: reason || null
                });

                if (error) {
                    dispatch(setNotification({ message: 'Stok güncellenirken hata: ' + error.message, type: 'error' }));
                } else {
                    dispatch(setNotification({ message: 'Stok başarıyla güncellendi', type: 'success' }));
                    fetchProducts();
                    onClose();
                }
            } catch (error) {
                dispatch(setNotification({ message: 'Beklenmedik hata: ' + error.message, type: 'error' }));
            }
            setLoading(false);
        };

        return (
            <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
                <div className="modal-dialog">
                    <div className="modal-content bg-dark text-white">
                        <div className="modal-header">
                            <h5 className="modal-title">Stok Güncelle - {product.title}</h5>
                            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                        </div>
                        <div className="modal-body">
                            <div className="mb-3">
                                <strong>Mevcut Stok:</strong> {product.available_stock || 0} adet
                                {product.inventory?.reserved_quantity > 0 && (
                                    <div><small className="text-warning">Rezerve: {product.inventory.reserved_quantity} adet</small></div>
                                )}
                            </div>
                            <form onSubmit={handleStockUpdate}>
                                <div className="mb-3">
                                    <label className="form-label">İşlem Tipi</label>
                                    <select 
                                        className="form-select" 
                                        value={stockType} 
                                        onChange={(e) => setStockType(e.target.value as 'IN' | 'OUT' | 'ADJUSTMENT')}
                                    >
                                        <option value="ADJUSTMENT">Düzeltme</option>
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Miktar</label>
                                    <input 
                                        type="number" 
                                        className="form-control" 
                                        value={stockQuantity}
                                        onChange={(e) => setStockQuantity(e.target.value)}
                                        min="1"
                                        required
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Açıklama (Opsiyonel)</label>
                                    <textarea 
                                        className="form-control" 
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        rows={3}
                                        placeholder="İşlem sebebi..."
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? 'Güncelleniyor...' : 'Stok Güncelle'}
                                </button>
                                <button type="button" className="btn btn-secondary ms-2" onClick={onClose}>
                                    İptal
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return <p>Ürünler yükleniyor...</p>;
    }
    
    return (
        <div className="table-responsive">
            {showModal && selectedProduct && (
                <EditProductModal
                    product={selectedProduct as any}
                    onClose={handleModalClose}
                    onProductUpdated={fetchProducts}
                />
            )}
            
            {showStockModal && selectedProductForStock && (
                <StockModal
                    product={selectedProductForStock}
                    onClose={handleStockModalClose}
                />
            )}

            <table className="table table-dark table-striped">
                <thead>
                    <tr>
                        <th>Resim</th>
                        <th>Başlık</th>
                        <th>SKU</th>
                        <th>Fiyat</th>
                        <th>Kategori</th>
                        <th>Stok Durumu</th>
                        <th>İşlemler</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map((product) => (
                        <tr key={product.id}>
                            <td>
                                <img 
                                    src={product.image} 
                                    alt={product.title} 
                                    style={{ 
                                        width: '50px', 
                                        height: '50px', 
                                        objectFit: 'cover',
                                        borderRadius: '4px'
                                    }} 
                                />
                            </td>
                            <td>
                                <div>{product.title}</div>
                                {product.rating && product.rating > 0 && (
                                    <small className="text-muted">
                                        {Array(Math.round(product.rating)).fill('⭐').join('')} 
                                        ({product.rating_count || 0})
                                    </small>
                                )}
                            </td>
                            <td>
                                <code className="text-info">{product.sku || 'N/A'}</code>
                            </td>
                            <td>
                                <strong>{product.price} TL</strong>
                                {product.inventory?.cost_price && (
                                    <div>
                                        <small className="text-muted">
                                            Maliyet: {product.inventory.cost_price} TL
                                        </small>
                                    </div>
                                )}
                            </td>
                            <td>
                                <span className="badge bg-secondary">{product.category}</span>
                            </td>
                            <td>
                                {getStockStatusBadge(
                                    product.stock_status || 'OUT_OF_STOCK', 
                                    product.available_stock || 0
                                )}
                                {product.inventory?.reserved_quantity > 0 && (
                                    <div>
                                        <small className="text-warning">
                                            Rezerve: {product.inventory.reserved_quantity}
                                        </small>
                                    </div>
                                )}
                                {product.inventory && (
                                    <div>
                                        <small className="text-muted">
                                            Min: {product.inventory.min_stock_level} | 
                                            Max: {product.inventory.max_stock_level}
                                        </small>
                                    </div>
                                )}
                            </td>
                            <td>
                                <div className="btn-group-vertical btn-group-sm">
                                    <button 
                                        className="btn btn-warning btn-sm mb-1" 
                                        onClick={() => handleEditClick(product)}
                                    >
                                        Düzenle
                                    </button>
                                    <button 
                                        className="btn btn-info btn-sm mb-1" 
                                        onClick={() => handleStockClick(product)}
                                    >
                                        Stok
                                    </button>
                                    <button 
                                        className="btn btn-danger btn-sm"
                                        onClick={() => handleDelete(product.id)}
                                    >
                                        Sil
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ProductTable;
