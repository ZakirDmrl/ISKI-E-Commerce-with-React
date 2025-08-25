// src/components/ProductTable.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useDispatch } from 'react-redux';
import { setNotification } from '../store/notificationSlice';
import EditProductModal from './EditProductModal'; // Yeni import

interface Product {
    id: number;
    title: string;
    price: number;
    category: string;
    image: string;
    description: string;
    rating: number;
    rating_count: number;
}

const ProductTable: React.FC = () => {
    const dispatch = useDispatch();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false); // Modal state'i
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null); // Seçilen ürün state'i

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        const { data, error } = await supabase
            .from('products')
            .select('*') // Tüm sütunları çek
            .order('id', { ascending: false });

        if (error) {
            dispatch(setNotification({ message: 'Ürünler yüklenirken hata oluştu: ' + error.message, type: 'error' }));
        } else {
            setProducts(data as Product[]);
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
                fetchProducts(); // Ürünleri yeniden çek
            }
        }
    };
    
    // Düzenle butonu tıklama olayı
    const handleEditClick = (product: Product) => {
        setSelectedProduct(product);
        setShowModal(true);
    };
    
    // Modal kapatma olayı
    const handleModalClose = () => {
        setShowModal(false);
        setSelectedProduct(null);
    };

    if (loading) {
        return <p>Ürünler yükleniyor...</p>;
    }
    
    return (
		
        <div className="table-responsive">
			     {showModal && selectedProduct && (
                <EditProductModal
                    product={selectedProduct}
                    onClose={handleModalClose}
                    onProductUpdated={fetchProducts}
                />
            )}
            <table className="table table-dark table-striped">
                <thead>
                    <tr>
                        <th>Resim</th>
                        <th>Başlık</th>
                        <th>Fiyat</th>
                        <th>Kategori</th>
                        <th>İşlemler</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map((product) => (
                        <tr key={product.id}>
                            <td>
                                <img src={product.image} alt={product.title} style={{ width: '50px', height: '50px', objectFit: 'cover' }} />
                            </td>
                            <td>{product.title}</td>
                            <td>{product.price} TL</td>
                            <td>{product.category}</td>
                            <td>
                                <button className="btn btn-warning btn-sm me-2" onClick={() => handleEditClick(product)}>
                                    Düzenle
                                </button>
                                <button 
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleDelete(product.id)}
                                >
                                    Sil
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

       
        </div>
    );
};

export default ProductTable;
