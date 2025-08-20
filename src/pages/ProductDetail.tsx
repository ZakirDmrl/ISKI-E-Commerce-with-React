// src/pages/ProductDetail.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { type Product } from '../types';

const ProductDetail = () => {
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`https://fakestoreapi.com/products/${productId}`);
        if (!response.ok) {
          throw new Error('Ürün bilgileri çekilemedi!');
        }
        const data: Product = await response.json();
        setProduct(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  if (loading) return <div>Ürün detayları yükleniyor...</div>;
  if (error) return <div>Hata: {error}</div>;
  if (!product) return <div>Ürün bulunamadı.</div>;

  return (
    <div>
      <h1>{product.title}</h1>
      <img src={product.image} alt={product.title} style={{ maxWidth: '400px', height: 'auto' }} />
      <p>{product.description}</p>
      <p><strong>Fiyat: {product.price} TL</strong></p>
      {/* Sepete Ekle butonu ekleyebilirsin */}
    </div>
  );
};

export default ProductDetail;
