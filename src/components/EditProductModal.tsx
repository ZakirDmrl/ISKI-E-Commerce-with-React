// src/components/EditProductModal.tsx
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useDispatch } from 'react-redux';
import { setNotification } from '../store/notificationSlice';

interface Product {
    id: number;
    title: string;
    description: string;
    price: number;
    image: string;
    category: string;
    rating: number;
    rating_count: number;
}

interface EditProductModalProps {
    product: Product;
    onClose: () => void;
    onProductUpdated: () => void;
}

const EditProductModal: React.FC<EditProductModalProps> = ({ product, onClose, onProductUpdated }) => {
    const dispatch = useDispatch();
    const [title, setTitle] = useState(product.title);
    const [description, setDescription] = useState(product.description);
    const [price, setPrice] = useState(String(product.price));
    const [image, setImage] = useState(product.image);
    const [category, setCategory] = useState(product.category);
    const [rating, setRating] = useState(String(product.rating));
    const [ratingCount, setRatingCount] = useState(String(product.rating_count));
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase
            .from('products')
            .update({
                title,
                description,
                price: parseFloat(price),
                image,
                category,
                rating: parseFloat(rating),
                rating_count: parseInt(ratingCount)
            })
            .eq('id', product.id);

        setLoading(false);

        if (error) {
            dispatch(setNotification({ message: 'Ürün güncellenirken bir hata oluştu: ' + error.message, type: 'error' }));
        } else {
            dispatch(setNotification({ message: 'Ürün başarıyla güncellendi!', type: 'success' }));
            onProductUpdated(); // Tabloyu yeniden yüklemek için callback'i çağır
            onClose(); // Modal'ı kapat
        }
    };

    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1} aria-modal="true" role="dialog">
            <div className="modal-dialog">
                <div className="modal-content bg-dark text-white">
                    <div className="modal-header">
                        <h5 className="modal-title">Ürünü Düzenle</h5>
                        <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label">Ürün Adı</label>
                                <input type="text" className="form-control" value={title} onChange={(e) => setTitle(e.target.value)} />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Açıklama</label>
                                <textarea className="form-control" value={description} onChange={(e) => setDescription(e.target.value)}></textarea>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Fiyat (TL)</label>
                                <input type="number" className="form-control" value={price} onChange={(e) => setPrice(e.target.value)} />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Resim URL</label>
                                <input type="text" className="form-control" value={image} onChange={(e) => setImage(e.target.value)} />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Kategori</label>
                                <input type="text" className="form-control" value={category} onChange={(e) => setCategory(e.target.value)} />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Puan</label>
                                <input type="number" step="0.1" className="form-control" value={rating} onChange={(e) => setRating(e.target.value)} />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Puanlama Sayısı</label>
                                <input type="number" className="form-control" value={ratingCount} onChange={(e) => setRatingCount(e.target.value)} />
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? 'Güncelleniyor...' : 'Güncelle'}
                            </button>
                            <button type="button" className="btn btn-secondary ms-2" onClick={onClose}>
                                Kapat
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditProductModal;
