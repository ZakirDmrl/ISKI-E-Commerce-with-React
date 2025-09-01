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

    const clearForm = () => {
        setTitle(''); setDescription(''); setPrice(''); setImage(''); 
        setCategory(''); setSku(''); setRating(''); setRatingCount('');
        setIsActive(true); setInitialStock('0'); setMinStockLevel('5');
        setMaxStockLevel('100'); setCostPrice('');
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

                // İlk stok girişi için stok hareketi kaydet
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
            clearForm();

        } catch (error) {
            dispatch(setNotification({ message: 'Ürün eklenirken bir hata oluştu: ' + error.message, type: 'error' }));
        }

        setLoading(false);
    };

    return (
        <div className="add-product-form">
            <div className="form-header">
                <h3 className="form-title">Yeni Ürün Ekle</h3>
            </div>
            
            <form onSubmit={handleSubmit} className="product-form">
                <div className="form-grid">
                    {/* Sol Kolon - Temel Ürün Bilgileri */}
                    <div className="form-section">
                        <h5 className="section-title basic-info">Temel Ürün Bilgileri</h5>
                        
                        <div className="form-group">
                            <label className="form-label">Ürün Adı *</label>
                            <input 
                                type="text" 
                                className="form-input" 
                                value={title} 
                                onChange={(e) => setTitle(e.target.value)} 
                                required 
                                placeholder="Ürün adını girin"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Açıklama *</label>
                            <textarea 
                                className="form-textarea" 
                                rows={4}
                                value={description} 
                                onChange={(e) => setDescription(e.target.value)} 
                                required
                                placeholder="Ürün açıklamasını girin"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Fiyat (TL) *</label>
                            <input 
                                type="number" 
                                step="0.01"
                                className="form-input" 
                                value={price} 
                                onChange={(e) => setPrice(e.target.value)} 
                                required 
                                placeholder="0.00"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Resim URL *</label>
                            <input 
                                type="url" 
                                className="form-input" 
                                value={image} 
                                onChange={(e) => setImage(e.target.value)} 
                                required 
                                placeholder="https://example.com/image.jpg"
                            />
                            {image && (
                                <div className="image-preview">
                                    <img src={image} alt="Önizleme" />
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Kategori *</label>
                            <input 
                                type="text" 
                                className="form-input" 
                                value={category} 
                                onChange={(e) => setCategory(e.target.value)} 
                                required 
                                placeholder="Kategori adı"
                            />
                        </div>
                    </div>

                    {/* Sağ Kolon - SKU, Stok ve Ek Bilgiler */}
                    <div className="form-section">
                        <h5 className="section-title stock-info">SKU ve Stok Bilgileri</h5>
                        
                        <div className="form-group">
                            <label className="form-label">SKU (Stok Kodu)</label>
                            <div className="sku-input-group">
                                <input 
                                    type="text" 
                                    className="form-input" 
                                    value={sku} 
                                    onChange={(e) => setSku(e.target.value.toUpperCase())} 
                                    placeholder="Otomatik oluşturulacak"
                                />
                                <button 
                                    type="button" 
                                    className="generate-sku-btn"
                                    onClick={generateSku}
                                    disabled={!category || !title}
                                >
                                    Oluştur
                                </button>
                            </div>
                            <small className="form-help">Kategori ve ürün adından otomatik oluşturulabilir</small>
                        </div>

                        <div className="stock-inputs">
                            <div className="form-group">
                                <label className="form-label">Başlangıç Stoku</label>
                                <input 
                                    type="number" 
                                    className="form-input" 
                                    value={initialStock} 
                                    onChange={(e) => setInitialStock(e.target.value)} 
                                    min="0"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Min. Stok</label>
                                <input 
                                    type="number" 
                                    className="form-input" 
                                    value={minStockLevel} 
                                    onChange={(e) => setMinStockLevel(e.target.value)} 
                                    min="0"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Max. Stok</label>
                                <input 
                                    type="number" 
                                    className="form-input" 
                                    value={maxStockLevel} 
                                    onChange={(e) => setMaxStockLevel(e.target.value)} 
                                    min="1"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Maliyet Fiyatı (TL)</label>
                            <input 
                                type="number" 
                                step="0.01"
                                className="form-input" 
                                value={costPrice} 
                                onChange={(e) => setCostPrice(e.target.value)} 
                                placeholder="Opsiyonel"
                            />
                        </div>

                        <h5 className="section-title additional-info">Ek Bilgiler</h5>
                        
                        <div className="rating-inputs">
                            <div className="form-group">
                                <label className="form-label">Puan (0-5)</label>
                                <input 
                                    type="number" 
                                    step="0.1" 
                                    min="0"
                                    max="5"
                                    className="form-input" 
                                    value={rating} 
                                    onChange={(e) => setRating(e.target.value)} 
                                    placeholder="4.5"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Değerlendirme Sayısı</label>
                                <input 
                                    type="number" 
                                    min="0"
                                    className="form-input" 
                                    value={ratingCount} 
                                    onChange={(e) => setRatingCount(e.target.value)} 
                                    placeholder="125"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <div className="checkbox-group">
                                <input 
                                    type="checkbox" 
                                    id="isActive"
                                    checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                />
                                <label htmlFor="isActive">Ürün aktif (satışta)</label>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" className="clear-btn" onClick={clearForm}>
                        Temizle
                    </button>
                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? 'Ekleniyor...' : 'Ürünü Ekle'}
                    </button>
                </div>
            </form>

            <style>{`
                .add-product-form {
                    width: 100%;
                }

                .form-header {
                    margin-bottom: 2rem;
                }

                .form-title {
                    color: #fff;
                    font-size: clamp(1.2rem, 3vw, 1.5rem);
                    font-weight: 700;
                    margin: 0;
                    text-align: center;
                }

                .product-form {
                    width: 100%;
                }

                .form-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 2rem;
                    margin-bottom: 2rem;
                }

                .form-section {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }

                .section-title {
                    font-size: 1.1rem;
                    font-weight: 600;
                    margin: 0 0 0.5rem 0;
                    padding-bottom: 0.5rem;
                    border-bottom: 2px solid;
                }

                .section-title.basic-info {
                    color: #17a2b8;
                    border-color: #17a2b8;
                }

                .section-title.stock-info {
                    color: #ffc107;
                    border-color: #ffc107;
                }

                .section-title.additional-info {
                    color: #28a745;
                    border-color: #28a745;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                .form-label {
                    color: #e0e0e0;
                    font-size: 0.9rem;
                    font-weight: 500;
                }

                .form-input,
                .form-textarea {
                    padding: 0.75rem;
                    background: rgba(255,255,255,0.1);
                    border: 2px solid rgba(255,255,255,0.2);
                    border-radius: 8px;
                    color: #fff;
                    font-size: 0.9rem;
                    transition: all 0.3s ease;
                    backdrop-filter: blur(10px);
                }

                .form-input:focus,
                .form-textarea:focus {
                    outline: none;
                    border-color: #007bff;
                    box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
                }

                .form-input::placeholder,
                .form-textarea::placeholder {
                    color: rgba(255,255,255,0.5);
                }

                .form-textarea {
                    resize: vertical;
                    min-height: 100px;
                }

                .sku-input-group {
                    display: flex;
                    gap: 0.5rem;
                }

                .generate-sku-btn {
                    padding: 0.75rem 1rem;
                    background: rgba(23,162,184,0.8);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 0.85rem;
                    font-weight: 500;
                    transition: all 0.3s ease;
                    white-space: nowrap;
                }

                .generate-sku-btn:hover:not(:disabled) {
                    background: rgba(23,162,184,1);
                    transform: translateY(-1px);
                }

                .generate-sku-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .form-help {
                    color: #999;
                    font-size: 0.8rem;
                }

                .stock-inputs,
                .rating-inputs {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1rem;
                }

                .image-preview {
                    margin-top: 0.5rem;
                    display: flex;
                    justify-content: center;
                }

                .image-preview img {
                    max-width: 200px;
                    max-height: 150px;
                    object-fit: contain;
                    border-radius: 8px;
                    border: 2px solid rgba(255,255,255,0.2);
                }

                .checkbox-group {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-top: 0.5rem;
                }

                .checkbox-group input[type="checkbox"] {
                    width: 18px;
                    height: 18px;
                    accent-color: #007bff;
                }

                .checkbox-group label {
                    color: #e0e0e0;
                    font-size: 0.9rem;
                    cursor: pointer;
                }

                .form-actions {
                    display: flex;
                    gap: 1rem;
                    justify-content: flex-end;
                    padding-top: 1rem;
                    border-top: 1px solid rgba(255,255,255,0.1);
                }

                .clear-btn,
                .submit-btn {
                    padding: 0.75rem 1.5rem;
                    border: none;
                    border-radius: 8px;
                    font-size: 0.9rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    min-width: 120px;
                }

                .clear-btn {
                    background: rgba(108,117,125,0.8);
                    color: white;
                }

                .clear-btn:hover {
                    background: rgba(108,117,125,1);
                    transform: translateY(-1px);
                }

                .submit-btn {
                    background: linear-gradient(45deg, #28a745, #20c997);
                    color: white;
                }

                .submit-btn:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(40,167,69,0.3);
                }

                .submit-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                }

                /* Mobile Responsive */
                @media (max-width: 768px) {
                    .form-grid {
                        grid-template-columns: 1fr;
                        gap: 1.5rem;
                    }

                    .stock-inputs,
                    .rating-inputs {
                        grid-template-columns: 1fr;
                        gap: 0.75rem;
                    }

                    .sku-input-group {
                        flex-direction: column;
                    }

                    .generate-sku-btn {
                        align-self: flex-start;
                    }

                    .form-actions {
                        flex-direction: column;
                        align-items: stretch;
                    }

                    .clear-btn,
                    .submit-btn {
                        min-width: auto;
                    }
                }

                @media (max-width: 480px) {
                    .form-grid {
                        gap: 1rem;
                    }

                    .form-input,
                    .form-textarea {
                        padding: 0.6rem;
                        font-size: 0.85rem;
                    }

                    .generate-sku-btn {
                        padding: 0.6rem 0.8rem;
                        font-size: 0.8rem;
                    }

                    .image-preview img {
                        max-width: 150px;
                        max-height: 100px;
                    }
                }

                /* High DPI adjustments */
                @media (min-resolution: 150dpi) {
                    .form-input,
                    .form-textarea {
                        padding: 0.8rem;
                    }
                    
                    .generate-sku-btn {
                        padding: 0.8rem 1.2rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default AddProductForm;
