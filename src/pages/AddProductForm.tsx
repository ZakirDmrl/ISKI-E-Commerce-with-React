// src/pages/AddProductForm.tsx
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { supabase } from '../supabaseClient';
import { setNotification } from '../store/notificationSlice';

const AddProductForm: React.FC = () => {
    const dispatch = useDispatch();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [image, setImage] = useState('');
    const [category, setCategory] = useState('');
    const [rating, setRating] = useState(''); // Yeni: rating state'i
    const [ratingCount, setRatingCount] = useState(''); // Yeni: ratingCount state'i
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Alan kontrolü
        if (!title || !description || !price || !image || !category) {
            dispatch(setNotification({ message: 'Lütfen tüm alanları doldurun.', type: 'error' }));
            setLoading(false);
            return;
        }

        const { error } = await supabase
            .from('products')
            .insert([{ 
                title, 
                description, 
                price: parseFloat(price), 
                image, 
                category,
                rating: parseFloat(rating), // Yeni: rating'i sayıya dönüştür
                rating_count: parseInt(ratingCount) // Yeni: ratingCount'u sayıya dönüştür
            }]);

        setLoading(false);

        if (error) {
            dispatch(setNotification({ message: 'Ürün eklenirken bir hata oluştu: ' + error.message, type: 'error' }));
        } else {
            dispatch(setNotification({ message: 'Ürün başarıyla eklendi!', type: 'success' }));
            setTitle('');
            setDescription('');
            setPrice('');
            setImage('');
            setCategory('');
            setRating('');
            setRatingCount('');
        }
    };

    return (
        <div className="card my-4">
            <div className="card-header">
                <h3>Yeni Ürün Ekle</h3>
            </div>
            <div className="card-body">
                <form onSubmit={handleSubmit}>
                    {/* ... diğer form alanları aynı kalacak ... */}
                    <div className="mb-3">
                        <label htmlFor="title" className="form-label">Ürün Adı</label>
                        <input type="text" className="form-control" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
                    </div>
                    {/* ... description, price, image, category inputları ... */}
                    <div className="mb-3">
                        <label htmlFor="description" className="form-label">Açıklama</label>
                        <textarea className="form-control" id="description" value={description} onChange={(e) => setDescription(e.target.value)} required></textarea>
                    </div>
                    <div className="mb-3">
                        <label htmlFor="price" className="form-label">Fiyat (TL)</label>
                        <input type="number" className="form-control" id="price" value={price} onChange={(e) => setPrice(e.target.value)} required />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="image" className="form-label">Resim URL</label>
                        <input type="url" className="form-control" id="image" value={image} onChange={(e) => setImage(e.target.value)} required />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="category" className="form-label">Kategori</label>
                        <input type="text" className="form-control" id="category" value={category} onChange={(e) => setCategory(e.target.value)} required />
                    </div>
                    
                    {/* Yeni alanlar */}
                    <div className="mb-3">
                        <label htmlFor="rating" className="form-label">Puan (Örnek: 4.5)</label>
                        <input type="number" step="0.1" className="form-control" id="rating" value={rating} onChange={(e) => setRating(e.target.value)} />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="ratingCount" className="form-label">Puanlama Sayısı</label>
                        <input type="number" className="form-control" id="ratingCount" value={ratingCount} onChange={(e) => setRatingCount(e.target.value)} />
                    </div>
                    
                    <button type="submit" className="btn btn-success" disabled={loading}>
                        {loading ? 'Ekleniyor...' : 'Ürünü Ekle'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddProductForm;
