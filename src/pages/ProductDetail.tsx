// src/pages/ProductDetail.tsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { supabase } from '../supabaseClient';
import type { Product } from '../types';
import type { RootState, AppDispatch } from '../store/store';
import { addOrUpdateCartItem } from '../store/cartSlice';
import { setNotification } from '../store/notificationSlice';

const ProductDetail = () => {
    const { productId } = useParams<{ productId: string }>();
    const dispatch = useDispatch<AppDispatch>();
    const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
    
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProduct = async () => {
            setLoading(true);
            setError(null);
            
            // productId'yi number'a dönüştür
            const idAsNumber = Number(productId);
            if (isNaN(idAsNumber)) {
                setError('Geçersiz ürün kimliği.');
                setLoading(false);
                return;
            }
            
            try {
                const { data, error: supabaseError } = await supabase
                    .from('products')
                    .select('*')
                    .eq('id', idAsNumber) // Number'a dönüştürülmüş id'yi kullan
                    .single();

                if (supabaseError) {
                    throw new Error(supabaseError.message);
                }

                if (!data) {
                    throw new Error('Ürün bulunamadı.');
                }
                
                setProduct(data as Product);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (productId) {
            fetchProduct();
        }
    }, [productId]);

    const handleAddToCart = () => {
        if (!isAuthenticated || !user) {
            dispatch(setNotification({ message: 'Sepete ürün eklemek için giriş yapmalısınız.', type: 'error' }));
			
            return;
        }

        if (product) {
            dispatch(addOrUpdateCartItem({ product, userId: user.id }))
                .unwrap()
                .then(() => {
                    dispatch(setNotification({ message: `${product.title} sepete eklendi!`, type: 'success' }));
                })
                .catch((err) => {
                    dispatch(setNotification({ message: `Sepete eklenirken hata oluştu: ${err.message}`, type: 'error' }));
                });
        }
    };

    if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Ürün detayları yükleniyor...</div>;
    if (error) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Hata: {error}</div>;
    if (!product) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Ürün bulunamadı.</div>;

    return (
        <div style={{ maxWidth: '800px', margin: 'auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }}>
                <img 
                    src={product.image} 
                    alt={product.title} 
                    style={{ 
                        width: '300px', 
                        height: '300px', 
                        objectFit: 'contain', 
                        borderRadius: '8px'
                    }} 
                />
                <div style={{ flex: 1 }}>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>{product.title}</h1>
                    <p style={{ color: '#555', fontSize: '1.2rem', marginBottom: '15px' }}>{product.description}</p>
                    <p style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#007bff', marginBottom: '20px' }}>Fiyat: {product.price} TL</p>
                    <button 
                        onClick={handleAddToCart}
                        style={{
                            padding: '12px 24px',
                            fontSize: '1rem',
                            cursor: 'pointer',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px'
                        }}
                    >
                        Sepete Ekle
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;
