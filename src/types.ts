// src/types.ts

// Kullanıcı profili tipi (mevcut şemanıza uyarlanmış + gelecekteki özellikler)
export interface Profile {
    id: string; // UUID
    email: string;
    full_name?: string;
    username?: string; // Yeni eklenen
    avatar_url?: string; // Yeni eklenen
    created_at?: string;
    updated_at?: string;
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
    cart_id: number;
}

// Bir yorumun yapısını tanımlar
export interface Comment {
    id: number;
    created_at: string;
    content: string;
    user_id: string; // auth.users'daki UUID
    product_id: number;
    parent_comment_id?: number | null; // Yanıtlar için eklendi
    likes: number; // Beğenme sayısı
    user_has_liked?: boolean; // Kullanıcının beğenip beğenmediğini tutmak için (front-end state)
    user_name: string; // Yorumu yapan kullanıcının adı
    user_email?: string; // Kullanıcının email'i (opsiyonel)
}
