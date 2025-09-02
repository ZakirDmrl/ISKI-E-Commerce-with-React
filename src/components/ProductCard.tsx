// src/components/ProductCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import type { ProductWithStock } from '../types';
import type { AppDispatch } from '../store/store';
import { checkProductStock } from '../store/productSlice';

interface ProductCardProps {
    product: ProductWithStock;
    onAddToCart: (product: ProductWithStock) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
    const dispatch = useDispatch<AppDispatch>();
    
    // Stok durumu kontrolü
    const isOutOfStock = product.available_stock !== undefined && product.available_stock <= 0;
    const isLowStock = product.stock_status === 'LOW_STOCK';
    //
    const handleAddToCartClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
		// Butonun varsayılan davranışını engeller (örneğin, bir <form> içindeyse submit olmasını önler).
        e.preventDefault();
		// Olayın parent componentlere taşmasını engeller. Yani sadece bu butonun tıklaması işlenir, üst komponentler tetiklenmez.
        e.stopPropagation();
        
        if (isOutOfStock) {
            return; // Stokta yoksa hiçbir şey yapma
        }

        try {
            // Stok durumunu kontrol et
            await dispatch(checkProductStock({ 
                productId: product.id, 
                quantity: 1 
            })).unwrap();
            
            onAddToCart(product);
        } catch (error) {
            console.error('Stok kontrolü hatası:', error);
            // Hata durumunda kullanıcıya bilgi ver (toast/notification ile)
        }
    };

    // Stok durumu badge'i
    const getStockBadge = () => {
        if (isOutOfStock) {
            return (
                <span style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: 'linear-gradient(45deg, #ff4757, #c44569)',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                }}>
                    Stokta Yok
                </span>
            );
        }
        
        if (isLowStock) {
            return (
                <span style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: 'linear-gradient(45deg, #ffa726, #ff9800)',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                }}>
                    Az Stok
                </span>
            );
        }
        
        return null;
    };

    // Stok miktarı gösterimi
    const getStockInfo = () => {
        if (product.available_stock === undefined) return null;
        
        return (
            <div style={{
                fontSize: '0.85rem',
                color: isOutOfStock ? '#ff6b6b' : isLowStock ? '#ffa726' : '#4CAF50',
                fontWeight: '500',
                marginBottom: '8px'
            }}>
                {isOutOfStock ? 'Stokta yok' : 
                 isLowStock ? `Sadece ${product.available_stock} adet kaldı` :
                 `${product.available_stock} adet mevcut`}
            </div>
        );
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
                    backgroundColor: isOutOfStock 
                        ? 'rgba(255, 75, 87, 0.05)' 
                        : 'rgba(255, 255, 255, 0.05)',
                    height: '280px', // Stok bilgisi için yükseklik artırıldı
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                    position: 'relative',
                    opacity: isOutOfStock ? 0.7 : 1,
                    transition: 'all 0.3s ease'
                }}
            >
                {/* Stok durumu badge'i */}
                {getStockBadge()}

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
                        position: 'relative'
                    }}
                >
                    <img
                        src={product.image}
                        alt={product.title}
                        style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain',
                            filter: isOutOfStock ? 'grayscale(50%)' : 'none'
                        }}
                    />
                    {isOutOfStock && (
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            background: 'rgba(0,0,0,0.8)',
                            color: 'white',
                            padding: '8px 12px',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            fontWeight: 'bold'
                        }}>
                            TÜKENDİ
                        </div>
                    )}
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

                    {/* SKU */}
                    {product.sku && (
                        <div style={{
                            fontSize: '0.8rem',
                            color: '#888',
                            marginBottom: '4px'
                        }}>
                            SKU: {product.sku}
                        </div>
                    )}

                    {/* Kategori */}
                    <div style={{
                        fontSize: '0.85rem',
                        color: '#666',
                        marginBottom: '8px',
                        background: 'rgba(255,255,255,0.1)',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        display: 'inline-block',
                        width: 'fit-content'
                    }}>
                        {product.category}
                    </div>

                    {/* Açıklama */}
                    <p
                        style={{
                            margin: '0 0 8px 0',
                            color: '#bbb',
                            fontSize: '0.9em',
                            flexGrow: 1,
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                        }}
                    >
                        {product.description}
                    </p>

                    {/* Stok bilgisi */}
                    {getStockInfo()}

                    {/* Rating */}
                    {product.rating && product.rating > 0 && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            marginBottom: '8px',
                            fontSize: '0.85rem'
                        }}>
                            <span>{Array(Math.round(product.rating)).fill('⭐').join('')}</span>
                            <span style={{ color: '#ccc' }}>
                                ({product.rating_count || 0})
                            </span>
                        </div>
                    )}

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
                            disabled={isOutOfStock}
                            style={{
                                padding: '8px 14px',
                                cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                                border: 'none',
                                borderRadius: '8px',
                                backgroundColor: isOutOfStock ? '#666' : '#000',
                                color: '#fff',
                                transition: 'all 0.3s ease',
                                opacity: isOutOfStock ? 0.6 : 1
                            }}
                            onMouseEnter={(e) => {
                                if (!isOutOfStock) {
                                    e.currentTarget.style.backgroundColor = '#007bff';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!isOutOfStock) {
                                    e.currentTarget.style.backgroundColor = '#000';
                                }
                            }}
                        >
                            {isOutOfStock ? 'Stokta Yok' : 'Sepete Ekle'}
                        </button>
                    </div>
                </div>
            </div>
        </Link>
    );
};

export default ProductCard;
