// src/components/ProductCard.tsx
import React from 'react';
import type { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  return (
    <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '5px', textAlign: 'center' }}>
      <img src={product.image} alt={product.title} style={{ width: '100px', height: '100px', objectFit: 'cover' }} />
      <h3>{product.title}</h3>
      <p>{product.description.substring(0, 50)}...</p> {/* Açıklamanın ilk 50 karakterini göster */}
      <p><strong>{product.price} TL</strong></p>
      <button onClick={() => onAddToCart(product)} style={{ padding: '8px 12px', cursor: 'pointer' }}>
        Sepete Ekle
      </button>
    </div>
  );
};

export default ProductCard;
