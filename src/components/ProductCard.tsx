// src/components/ProductCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../types';

interface ProductCardProps {
    product: Product;
    onAddToCart: (product: Product) => void;
    className?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, className }) => {
    // Sepete Ekle butonu için tıklama olayını yöneten fonksiyon
    const handleAddToCartClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        // 1. Tıklama olayının varsayılan davranışını (Link'in çalışmasını) engelle
        e.preventDefault();
        // 2. Tıklama olayının bir üst bileşene (Link'i saran div'e) yayılmasını engelle
        e.stopPropagation();

        // 3. Sepete ekleme işlevini çağır
        onAddToCart(product);
    };

    return (
        <Link to={`/product/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className={className} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '5px', textAlign: 'center' }}>
                <img src={product.image} alt={product.title} style={{ width: '100px', height: '100px', objectFit: 'cover' }} />
                <h3>{product.title}</h3>
                <p>{product.description.substring(0, 50)}...</p>
                <p><strong>{product.price} TL</strong></p>
                <button
                    onClick={handleAddToCartClick}
                    style={{ padding: '8px 12px', cursor: 'pointer' }}
                >
                    Sepete Ekle
                </button>
            </div>
        </Link>
    );
};

export default ProductCard;
