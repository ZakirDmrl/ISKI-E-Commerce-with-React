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
    const handleAddToCartClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        onAddToCart(product);
    };

    return (
        <Link to={`/product/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className={className} style={{ 
                border: '1px solid #ccc',
                padding: '15px',
                borderRadius: '5px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: '400px' // Sabit kutu yüksekliği
            }}>
                <img src={product.image} alt={product.title} style={{ width: '100%', height: '180px', objectFit: 'contain', marginBottom: '10px' }} />
                <h3 style={{ height: '40px', overflow: 'hidden' }}>{product.title}</h3>
                <p style={{ height: '60px', overflow: 'hidden' }}>{product.description.substring(0, 50)}...</p>
                <p><strong>{product.price} TL</strong></p>
                <button
                    onClick={handleAddToCartClick}
                    style={{ padding: '8px 12px', cursor: 'pointer', width: '100%', height: '40px', marginTop: 'auto' }}
                >
                    Sepete Ekle
                </button>
            </div>
        </Link>
    );
};

export default ProductCard;
