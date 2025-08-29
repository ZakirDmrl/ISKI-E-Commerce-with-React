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
        e.preventDefault(); // Link tıklamasını engelle
        e.stopPropagation();
        onAddToCart(product);
    };

    return (
        <Link 
            to={`/product/${product.id}`} 
            style={{ textDecoration: 'none', color: 'inherit' }}
        >
            <div
                style={{
                    border: '1px solid rgba(255,255,255,0.2)',
                    padding: '15px',
                    borderRadius: '10px',
                    display: 'flex',
                    gap: '15px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    height: '250px',
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                }}
            >
                {/* Resim */}
                <div
                    style={{
                        flexShrink: 0,
                        width: '150px',
                        height: '150px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        borderRadius: '8px',
                        background: 'rgba(0,0,0,0.1)',
                    }}
                >
                    <img
                        src={product.image}
                        alt={product.title}
                        style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain',
                        }}
                    />
                </div>

                {/* İçerik */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        flexGrow: 1,
                        overflow: 'hidden',
                    }}
                >
                    {/* Başlık */}
                    <h3
                        style={{
                            margin: '0 0 8px 0',
                            fontSize: '1.1em',
                            color: '#fff',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                        title={product.title}
                    >
                        {product.title}
                    </h3>

                    {/* Açıklama */}
                    <p
                        style={{
                            margin: '0 0 8px 0',
                            color: '#bbb',
                            fontSize: '0.9em',
                            flexGrow: 1,
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2, // max 2 satır
                            WebkitBoxOrient: 'vertical',
                        }}
                    >
                        {product.description}
                    </p>

                    {/* Fiyat + Sepete Ekle */}
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginTop: 'auto',
                        }}
                    >
                        <p
                            style={{
                                margin: 0,
                                fontWeight: 'bold',
                                fontSize: '1.1em',
                                color: '#fff',
                            }}
                        >
                            {product.price} TL
                        </p>
                        <button
                            onClick={handleAddToCartClick}
                            style={{
                                padding: '8px 14px',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                                border: 'none',
                                borderRadius: '8px',
                                backgroundColor: '#000',
                                color: '#fff',
                                transition: 'all 0.3s ease',
                            }}
                            onMouseEnter={(e) =>
                                (e.currentTarget.style.backgroundColor = '#007bff')
                            }
                            onMouseLeave={(e) =>
                                (e.currentTarget.style.backgroundColor = '#000')
                            }
                        >
                            Sepete Ekle
                        </button>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default ProductCard;
