// src/components/EditProductModal.tsx
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useDispatch } from 'react-redux';
import { setNotification } from '../store/notificationSlice';
import type { AppDispatch } from '../store/store';
import type { ProductWithStock } from '../types';

interface EditProductModalProps {
    product: ProductWithStock;
    onClose: () => void;
    onProductUpdated: () => void;
}

const EditProductModal: React.FC<EditProductModalProps> = ({ product, onClose, onProductUpdated }) => {
    const dispatch = useDispatch<AppDispatch>();
    
    // Mevcut ürün verilerini state'lere aktar
    const [title, setTitle] = useState(product.title);
    const [description, setDescription] = useState(product.description || '');
    const [price, setPrice] = useState(String(product.price));
    const [image, setImage] = useState(product.image);
    const [category, setCategory] = useState(product.category);
    const [sku, setSku] = useState(product.sku || ''); // SKU alanı
    const [rating, setRating] = useState(String(product.rating || ''));
    const [ratingCount, setRatingCount] = useState(String(product.rating_count || ''));
    const [isActive, setIsActive] = useState(product.is_active ?? true); // Aktiflik durumu
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // SKU benzersizlik kontrolü (başka ürünlerde aynı SKU var mı)
            if (sku && sku !== product.sku) {
                const { data: existingSku } = await supabase
                    .from('products')
                    .select('id')
                    .eq('sku', sku)
                    .neq('id', product.id)
                    .single();

                if (existingSku) {
                    dispatch(setNotification({ 
                        message: 'Bu SKU zaten başka bir ürün tarafından kullanılıyor.', 
                        type: 'error' 
                    }));
                    setLoading(false);
                    return;
                }
            }

            // Ürünü güncelle
            const updateData = {
                title,
                description: description || null,
                price: parseFloat(price),
                image,
                category,
                sku: sku || null,
                rating: rating ? parseFloat(rating) : null,
                rating_count: ratingCount ? parseInt(ratingCount) : null,
                is_active: isActive,
                updated_at: new Date().toISOString()
            };

            const { error } = await supabase
                .from('products')
                .update(updateData)
                .eq('id', product.id);

            if (error) {
                throw new Error(error.message);
            }

            dispatch(setNotification({ 
                message: 'Ürün başarıyla güncellendi!', 
                type: 'success' 
            }));
            
            onProductUpdated(); // Tabloyu yeniden yükle
            onClose(); // Modal'ı kapat

        } catch (error ) {
            dispatch(setNotification({ 
                message: 'Ürün güncellenirken bir hata oluştu: ' + error.message, 
                type: 'error' 
            }));
        }

        setLoading(false);
    };

    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1} aria-modal="true" role="dialog">
            <div className="modal-dialog modal-lg">
                <div className="modal-content bg-dark text-white">
                    <div className="modal-header">
                        <h5 className="modal-title">Ürünü Düzenle</h5>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        <form onSubmit={handleSubmit}>
                            <div className="row">
                                {/* Sol Kolon */}
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label className="form-label">Ürün Adı *</label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            value={title} 
                                            onChange={(e) => setTitle(e.target.value)}
                                            required
                                        />
                                    </div>
                                    
                                    <div className="mb-3">
                                        <label className="form-label">Açıklama</label>
                                        <textarea 
                                            className="form-control" 
                                            rows={3}
                                            value={description} 
                                            onChange={(e) => setDescription(e.target.value)}
                                        />
                                    </div>
                                    
                                    <div className="mb-3">
                                        <label className="form-label">Kategori *</label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            value={category} 
                                            onChange={(e) => setCategory(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Resim URL *</label>
                                        <input 
                                            type="url" 
                                            className="form-control" 
                                            value={image} 
                                            onChange={(e) => setImage(e.target.value)}
                                            required
                                        />
                                        {image && (
                                            <div className="mt-2">
                                                <img 
                                                    src={image} 
                                                    alt="Önizleme" 
                                                    style={{ maxWidth: '150px', maxHeight: '100px', objectFit: 'contain' }}
                                                    className="img-thumbnail"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Sağ Kolon */}
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label className="form-label">SKU (Stok Kodu)</label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            value={sku} 
                                            onChange={(e) => setSku(e.target.value.toUpperCase())}
                                            placeholder="Örn: TEL-IPH-001"
                                        />
                                        <small className="form-text text-muted">
                                            Benzersiz stok kodu (opsiyonel)
                                        </small>
                                    </div>

                                    <div className="row">
                                        <div className="col-6">
                                            <label className="form-label">Fiyat (TL) *</label>
                                            <input 
                                                type="number" 
                                                step="0.01"
                                                className="form-control" 
                                                value={price} 
                                                onChange={(e) => setPrice(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="col-6">
                                            <label className="form-label">Puan (0-5)</label>
                                            <input 
                                                type="number" 
                                                step="0.1" 
                                                min="0"
                                                max="5"
                                                className="form-control" 
                                                value={rating} 
                                                onChange={(e) => setRating(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-3 mt-3">
                                        <label className="form-label">Değerlendirme Sayısı</label>
                                        <input 
                                            type="number" 
                                            min="0"
                                            className="form-control" 
                                            value={ratingCount} 
                                            onChange={(e) => setRatingCount(e.target.value)}
                                        />
                                    </div>

                                    <div className="mb-3">
                                        <div className="form-check">
                                            <input 
                                                className="form-check-input" 
                                                type="checkbox" 
                                                id="isActiveEdit"
                                                checked={isActive}
                                                onChange={(e) => setIsActive(e.target.checked)}
                                            />
                                            <label className="form-check-label" htmlFor="isActiveEdit">
                                                Ürün aktif (satışta)
                                            </label>
                                        </div>
                                        <small className="form-text text-muted">
                                            Pasif ürünler müşteriler tarafından görülemez
                                        </small>
                                    </div>

                                    {/* Mevcut stok bilgisi (sadece görüntüleme) */}
                                    {product.inventory && (
                                        <div className="alert alert-info">
                                            <h6 className="alert-heading">Mevcut Stok Bilgisi</h6>
                                            <p className="mb-1">
                                                <strong>Toplam:</strong> {product.inventory.quantity} adet
                                            </p>
                                            <p className="mb-1">
                                                <strong>Mevcut:</strong> {product.available_stock || 0} adet
                                            </p>
                                            {product.inventory.reserved_quantity > 0 && (
                                                <p className="mb-1">
                                                    <strong>Rezerve:</strong> {product.inventory.reserved_quantity} adet
                                                </p>
                                            )}
                                            <hr className="my-2" />
                                            <small>
                                                Stok miktarını değiştirmek için ürün tablosundaki "Stok" butonunu kullanın.
                                            </small>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="d-flex gap-2 justify-content-end mt-3">
                                <button type="button" className="btn btn-secondary" onClick={onClose}>
                                    İptal
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? 'Güncelleniyor...' : 'Güncelle'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditProductModal;
