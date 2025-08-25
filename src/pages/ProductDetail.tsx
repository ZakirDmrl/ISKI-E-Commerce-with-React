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
                    .eq('id', idAsNumber)
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

    if (loading) return <div className="text-center mt-5">Ürün detayları yükleniyor...</div>;
    if (error) return <div className="text-center mt-5 text-danger">Hata: {error}</div>;
    if (!product) return <div className="text-center mt-5 text-warning">Ürün bulunamadı.</div>;

    return (
        <div className="container py-5">
            <div className="card product-detail-card bg-dark text-white p-4">
                <div className="row g-4">
                    <div className="col-md-5 d-flex align-items-center justify-content-center">
                        <img 
                            src={product.image} 
                            alt={product.title} 
                            className="img-fluid rounded" 
                            style={{ maxHeight: '400px', objectFit: 'contain' }}
                        />
                    </div>
                    <div className="col-md-7 d-flex flex-column justify-content-between">
                        <div>
                            <span className="badge bg-secondary mb-2">{product.category}</span>
                            <h1 className="display-5 fw-bold text-white">{product.title}</h1>
                            
                            <hr className="text-white-50" />
                            
                            <p className="lead text-white-50">{product.description}</p>
                            
                            <div className="my-3">
                                <span className="text-warning fs-4 me-2">
                                    {/* Basit bir yıldız gösterimi */}
                                    {Array(Math.round(product.rating)).fill('⭐').join('')}
                                </span>
                                <span className="text-white-50">({product.rating_count} oy)</span>
                            </div>
                            
                            <h2 className="text-success display-6 fw-bold my-4">{product.price.toFixed(2)} TL</h2>
                        </div>
                        
                        <div>
                            <button onClick={handleAddToCart} className="btn btn-lg btn-success w-100">
                                <i className="bi bi-cart-plus me-2"></i> Sepete Ekle
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;
