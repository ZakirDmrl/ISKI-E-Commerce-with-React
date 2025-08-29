// src/pages/AddProductForm.tsx
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { supabase } from '../supabaseClient';
import { setNotification } from '../store/notificationSlice';

const AddProductForm: React.FC = () => {
    const dispatch = useDispatch();
    
    // Mevcut alanlar
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [image, setImage] = useState('');
    const [category, setCategory] = useState('');
    const [rating, setRating] = useState('');
    const [ratingCount, setRatingCount] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Yeni stok yönetimi alanları
    const [sku, setSku] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [initialStock, setInitialStock] = useState('0');
    const [minStockLevel, setMinStockLevel] = useState('5');
    const [maxStockLevel, setMaxStockLevel] = useState('100');
    const [costPrice, setCostPrice] = useState('');

    // SKU otomatik oluşturma fonksiyonu
    const generateSku = () => {
        if (category && title) {
            const categoryPrefix = category.slice(0, 3).toUpperCase();
            const titlePrefix = title.slice(0, 3).toUpperCase();
            const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            const generatedSku = `${categoryPrefix}-${titlePrefix}-${randomNum}`;
            setSku(generatedSku);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Alan kontrolü
        if (!title || !description || !price || !image || !category) {
            dispatch(setNotification({ message: 'Lütfen tüm zorunlu alanları doldurun.', type: 'error' }));
            setLoading(false);
            return;
        }

        try {
            // SKU benzersizlik kontrolü
            if (sku) {
                const { data: existingSku } = await supabase
                    .from('products')
                    .select('id')
                    .eq('sku', sku)
                    .single();

                if (existingSku) {
                    dispatch(setNotification({ message: 'Bu SKU zaten kullanımda. Lütfen farklı bir SKU girin.', type: 'error' }));
                    setLoading(false);
                    return;
                }
            }

            // Önce ürünü ekle
            const { data: productData, error: productError } = await supabase
                .from('products')
                .insert([{ 
                    title, 
                    description, 
                    price: parseFloat(price), 
                    image, 
                    category,
                    sku: sku || null,
                    rating: rating ? parseFloat(rating) : null,
                    rating_count: ratingCount ? parseInt(ratingCount) : null,
                    is_active: isActive
                }])
                .select()
                .single();

            if (productError) {
                throw new Error(productError.message);
            }

            // Ürün başarıyla eklendiyse stok kaydını oluştur
            if (productData) {
                const { error: inventoryError } = await supabase
                    .from('inventory')
                    .insert([{
                        product_id: productData.id,
                        quantity: parseInt(initialStock),
                        reserved_quantity: 0,
                        min_stock_level: parseInt(minStockLevel),
                        max_stock_level: parseInt(maxStockLevel),
                        cost_price: costPrice ? parseFloat(costPrice) : null
                    }]);

                if (inventoryError) {
                    console.warn('Inventory kaydı oluşturulamadı:', inventoryError.message);
                }

                // İlk stok girişi için stok hareketi kaydet (eğer 0'dan fazla stok eklendiyse)
                if (parseInt(initialStock) > 0) {
                    const { error: stockMovementError } = await supabase
                        .from('stock_movements')
                        .insert([{
                            product_id: productData.id,
                            movement_type: 'IN',
                            quantity: parseInt(initialStock),
                            reference_type: 'ADJUSTMENT',
                            reason: 'Initial stock entry for new product',
                            cost_price: costPrice ? parseFloat(costPrice) : null
                        }]);

                    if (stockMovementError) {
                        console.warn('Stok hareketi kaydedilemedi:', stockMovementError.message);
                    }
                }
            }

            dispatch(setNotification({ message: 'Ürün ve stok bilgileri başarıyla eklendi!', type: 'success' }));
            
            // Formu temizle
            setTitle('');
            setDescription('');
            setPrice('');
            setImage('');
            setCategory('');
            setRating('');
            setRatingCount('');
            setSku('');
            setIsActive(true);
            setInitialStock('0');
            setMinStockLevel('5');
            setMaxStockLevel('100');
            setCostPrice('');

        } catch (error: any) {
            dispatch(setNotification({ message: 'Ürün eklenirken bir hata oluştu: ' + error.message, type: 'error' }));
        }

        setLoading(false);
    };

    return (
        <div className="card my-4">
            <div className="card-header">
                <h3>Yeni Ürün Ekle</h3>
            </div>
            <div className="card-body">
                <form onSubmit={handleSubmit}>
                    <div className="row">
                        {/* Sol Kolon - Temel Ürün Bilgileri */}
                        <div className="col-md-6">
                            <h5 className="mb-3 text-info">Temel Ürün Bilgileri</h5>
                            
                            <div className="mb-3">
                                <label htmlFor="title" className="form-label">Ürün Adı *</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    id="title" 
                                    value={title} 
                                    onChange={(e) => setTitle(e.target.value)} 
                                    required 
                                />
                            </div>

                            <div className="mb-3">
                                <label htmlFor="description" className="form-label">Açıklama *</label>
                                <textarea 
                                    className="form-control" 
                                    id="description" 
                                    rows={4}
                                    value={description} 
                                    onChange={(e) => setDescription(e.target.value)} 
                                    required
                                />
                            </div>

                            <div className="mb-3">
                                <label htmlFor="price" className="form-label">Fiyat (TL) *</label>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    className="form-control" 
                                    id="price" 
                                    value={price} 
                                    onChange={(e) => setPrice(e.target.value)} 
                                    required 
                                />
                            </div>

                            <div className="mb-3">
                                <label htmlFor="image" className="form-label">Resim URL *</label>
                                <input 
                                    type="url" 
                                    className="form-control" 
                                    id="image" 
                                    value={image} 
                                    onChange={(e) => setImage(e.target.value)} 
                                    required 
                                />
                                {image && (
                                    <div className="mt-2">
                                        <img 
                                            src={image} 
                                            alt="Önizleme" 
                                            style={{ maxWidth: '200px', maxHeight: '150px', objectFit: 'contain' }}
                                            className="img-thumbnail"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="mb-3">
                                <label htmlFor="category" className="form-label">Kategori *</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    id="category" 
                                    value={category} 
                                    onChange={(e) => setCategory(e.target.value)} 
                                    required 
                                />
                            </div>
                        </div>

                        {/* Sağ Kolon - SKU, Stok ve Ek Bilgiler */}
                        <div className="col-md-6">
                            <h5 className="mb-3 text-warning">SKU ve Stok Bilgileri</h5>
                            
                            <div className="mb-3">
                                <label htmlFor="sku" className="form-label">SKU (Stok Kodu)</label>
                                <div className="input-group">
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        id="sku" 
                                        value={sku} 
                                        onChange={(e) => setSku(e.target.value.toUpperCase())} 
                                        placeholder="Otomatik oluşturulacak"
                                    />
                                    <button 
                                        type="button" 
                                        className="btn btn-outline-info" 
                                        onClick={generateSku}
                                        disabled={!category || !title}
                                    >
                                        Oluştur
                                    </button>
                                </div>
                                <small className="form-text text-muted">
                                    Kategori ve ürün adından otomatik oluşturulabilir
                                </small>
                            </div>

                            <div className="row">
                                <div className="col-md-4">
                                    <label htmlFor="initialStock" className="form-label">Başlangıç Stoku</label>
                                    <input 
                                        type="number" 
                                        className="form-control" 
                                        id="initialStock" 
                                        value={initialStock} 
                                        onChange={(e) => setInitialStock(e.target.value)} 
                                        min="0"
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label htmlFor="minStockLevel" className="form-label">Min. Stok</label>
                                    <input 
                                        type="number" 
                                        className="form-control" 
                                        id="minStockLevel" 
                                        value={minStockLevel} 
                                        onChange={(e) => setMinStockLevel(e.target.value)} 
                                        min="0"
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label htmlFor="maxStockLevel" className="form-label">Max. Stok</label>
                                    <input 
                                        type="number" 
                                        className="form-control" 
                                        id="maxStockLevel" 
                                        value={maxStockLevel} 
                                        onChange={(e) => setMaxStockLevel(e.target.value)} 
                                        min="1"
                                    />
                                </div>
                            </div>

                            <div className="mb-3 mt-3">
                                <label htmlFor="costPrice" className="form-label">Maliyet Fiyatı (TL)</label>
                                <input 
                                    type="number" 
                                    step="0.01"
                                    className="form-control" 
                                    id="costPrice" 
                                    value={costPrice} 
                                    onChange={(e) => setCostPrice(e.target.value)} 
                                    placeholder="Opsiyonel"
                                />
                            </div>

                            <h5 className="mb-3 text-success">Ek Bilgiler</h5>
                            
                            <div className="row">
                                <div className="col-md-6">
                                    <label htmlFor="rating" className="form-label">Puan (0-5)</label>
                                    <input 
                                        type="number" 
                                        step="0.1" 
                                        min="0"
                                        max="5"
                                        className="form-control" 
                                        id="rating" 
                                        value={rating} 
                                        onChange={(e) => setRating(e.target.value)} 
                                        placeholder="4.5"
                                    />
                                </div>
                                <div className="col-md-6">
                                    <label htmlFor="ratingCount" className="form-label">Değerlendirme Sayısı</label>
                                    <input 
                                        type="number" 
                                        min="0"
                                        className="form-control" 
                                        id="ratingCount" 
                                        value={ratingCount} 
                                        onChange={(e) => setRatingCount(e.target.value)} 
                                        placeholder="125"
                                    />
                                </div>
                            </div>

                            <div className="mb-3 mt-3">
                                <div className="form-check">
                                    <input 
                                        className="form-check-input" 
                                        type="checkbox" 
                                        id="isActive"
                                        checked={isActive}
                                        onChange={(e) => setIsActive(e.target.checked)}
                                    />
                                    <label className="form-check-label" htmlFor="isActive">
                                        Ürün aktif (satışta)
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <hr />
                    
                    <div className="d-flex gap-2 justify-content-end">
                        <button 
                            type="button" 
                            className="btn btn-secondary"
                            onClick={() => {
                                setTitle(''); setDescription(''); setPrice(''); setImage(''); 
                                setCategory(''); setSku(''); setRating(''); setRatingCount('');
                                setIsActive(true); setInitialStock('0'); setMinStockLevel('5');
                                setMaxStockLevel('100'); setCostPrice('');
                            }}
                        >
                            Temizle
                        </button>
                        <button type="submit" className="btn btn-success" disabled={loading}>
                            {loading ? 'Ekleniyor...' : 'Ürünü Ekle'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddProductForm;
