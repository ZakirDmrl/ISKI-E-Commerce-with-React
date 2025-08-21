// src/components/ProductCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../types';

interface ProductCardProps {
    product: Product;
    onAddToCart: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
    const handleAddToCartClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        onAddToCart(product);
    };

    return (
        <Link to={`/product/${product.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{
                border: '1px solid #ccc',
                padding: '15px',
                borderRadius: '5px',
                display: 'flex',
                alignItems: 'center', // Öğeleri dikeyde ortala
                gap: '20px', // Öğeler arasına boşluk ekle
                boxSizing: 'border-box',
                backgroundColor: 'rgba(255, 255, 255, 0.05)', // Hafif bir arka plan rengi
                height: '250px' // Sabit kutu yüksekliği
            }}>
                <img 
                    src={product.image} 
                    alt={product.title} 
                    style={{ 
                        width: '150px', // Resim genişliği
                        height: '150px', // Resim yüksekliği
                        objectFit: 'contain' // Resmin kutuya sığmasını sağlar
                    }} 
                />
                <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, height: '100%', justifyContent: 'center' }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2em' }}>{product.title}</h3>
                    <p style={{ margin: '0 0 10px 0', color: '#bbb' }}>{product.description.substring(0, 100)}...</p>
                    <p style={{ margin: 0, fontWeight: 'bold', fontSize: '1.2em', color: '#fff' }}>{product.price} TL</p>
                </div>
                <button
                    onClick={handleAddToCartClick}
                    style={{ 
                        padding: '10px 20px', 
                        cursor: 'pointer',
                        whiteSpace: 'nowrap', // Buton metninin tek satırda kalmasını sağlar
                        flexShrink: 0 // Butonun küçülmesini engelle
                    }}
                >
                    Sepete Ekle
                </button>
            </div>
        </Link>
    );
};

export default ProductCard;	
