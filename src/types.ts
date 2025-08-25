// src/types.ts

// Mevcut Product tipi
export interface Product {
    id: number;
    title: string;
    price: number;
    category: string;
    image: string;
}

// Yeni ve eksiksiz Product tipi
export interface Product {
    id: number;
    title: string;
    description: string;
    price: number;
    image: string;
    category: string;
    rating: number;	
    rating_count: number;
}

// Bir sepet öğesini tanımlar
export interface CartItem extends Product {
    quantity: number;
}
