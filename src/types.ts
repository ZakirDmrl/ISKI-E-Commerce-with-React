// src/types.ts

// Kullanıcı profili tipi (mevcut şemanıza uyarlanmış + gelecekteki özellikler)
export interface Profile {
    id: string; // UUID
    email: string;
    full_name?: string;
    username?: string;
    avatar_url?: string;
    created_at?: string;
    updated_at?: string;
}

// Güncellenmiş Product tipi (mevcut veritabanı şemanıza göre)
export interface Product {
    id: number;
    title: string;
    description: string | null;
    price: number; // numeric tipinde
    image: string;
    category: string;
    rating?: number | null;
    rating_count?: number | null;
    sku?: string | null;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
}

// Stok bilgilerini içeren genişletilmiş ürün tipi
export interface ProductWithStock extends Product {
    inventory?: InventoryInfo;
    available_stock?: number;
    stock_status?: StockStatus;
}

// Stok durumu enum'u
export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

// Inventory bilgileri
export interface InventoryInfo {
    id: number;
    product_id: number;
    quantity: number;
    reserved_quantity: number;
    min_stock_level: number;
    max_stock_level: number;
    cost_price?: number;
    updated_at?: string;
}

// Stok hareketi tipi
export interface StockMovement {
    id: number;
    created_at: string;
    product_id: number;
    movement_type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'RESERVED' | 'RELEASED';
    quantity: number;
    reference_type?: 'ORDER' | 'PURCHASE' | 'ADJUSTMENT' | 'RETURN' | 'CART';
    reference_id?: number;
    reason?: string;
    user_id?: string;
    cost_price?: number;
    notes?: string;
}

// Güncellenmiş sepet öğesi (mevcut şemaya uygun)
export interface CartItem {
    id: number;
    created_at?: string;
    cart_id: number;
    product_id: number;
    quantity: number;
    product?: Product; // Join edilen ürün bilgisi
}

// Sepet tipi
export interface Cart {
    id: number;
    created_at?: string;
    user_id: string;
    items?: CartItem[];
}

// Sipariş tipi
export interface Order {
    id: number;
    created_at?: string;
    user_id: string;
    total_amount?: number;
    status?: string;
    items?: OrderItem[];
}

// Sipariş öğesi tipi
export interface OrderItem {
    id: number;
    created_at?: string;
    order_id: number;
    product_id: number;
    quantity: number;
    unit_price: number;
    total_price: number;
    product?: Product; // Join edilen ürün bilgisi
}

// Tedarikçi tipi
export interface Supplier {
    id: number;
    created_at?: string;
    name: string;
    contact_person?: string;
    email?: string;
    phone?: string;
    address?: string;
    is_active?: boolean;
}

// Satın alma siparişi tipi
export interface PurchaseOrder {
    id: number;
    created_at?: string;
    supplier_id: number;
    status: 'PENDING' | 'APPROVED' | 'RECEIVED' | 'CANCELLED';
    total_amount?: number;
    expected_delivery_date?: string;
    received_date?: string;
    notes?: string;
    created_by?: string;
    supplier?: Supplier; // Join edilen tedarikçi bilgisi
    items?: PurchaseOrderItem[];
}

// Satın alma sipariş öğesi tipi
export interface PurchaseOrderItem {
    id: number;
    purchase_order_id: number;
    product_id: number;
    quantity: number;
    unit_cost: number;
    received_quantity: number;
    product?: Product; // Join edilen ürün bilgisi
}

// Yorum tipi (mevcut şemaya uygun)
export interface Comment {
    id: number;
    created_at: string;
    content: string;
    user_id: string; // auth.users'daki UUID
    product_id: number;
    parent_comment_id?: number | null;
    likes?: number; // Frontend'de hesaplanacak
    user_has_liked?: boolean; // Frontend state'i
    user_name?: string; // Join edilen profile bilgisi
    user_email?: string; // Join edilen profile bilgisi
    replies?: Comment[]; // Alt yorumlar
}

// Yorum beğenisi tipi
export interface CommentLike {
    id: number;
    comment_id: number;
    user_id: string;
    created_at?: string;
}

// Stok raporu view'leri için tipler
export interface StockReport {
    id: number;
    name: string;
    sku?: string;
    price: number;
    category: string;
    quantity: number;
    reserved_quantity: number;
    available_stock: number;
    min_stock_level: number;
    max_stock_level: number;
    cost_price?: number;
    total_cost_value?: number;
    total_retail_value?: number;
    stock_status: StockStatus;
}

export interface LowStockProduct {
    id: number;
    name: string;
    sku?: string;
    quantity: number;
    reserved_quantity: number;
    available_stock: number;
    min_stock_level: number;
}

export interface DailySalesReport {
    sale_date: string;
    product_name: string;
    sku?: string;
    category: string;
    total_quantity_sold: number;
    total_revenue: number;
    avg_selling_price: number;
}

export interface TopSellingProduct {
    id: number;
    name: string;
    sku?: string;
    category: string;
    total_sold: number;
    total_revenue: number;
    order_count: number;
    avg_rating?: number;
}

export interface InventoryValueReport {
    total_products: number;
    total_items_in_stock: number;
    total_cost_value: number;
    total_retail_value: number;
    potential_profit: number;
}

// API response tipleri
export interface ApiResponse<T> {
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    count: number;
    page: number;
    limit: number;
    total_pages: number;
}

// Form tipleri
export interface ProductFormData {
    title: string;
    description?: string;
    price: number;
    image: string;
    category: string;
    sku?: string;
    is_active?: boolean;
    rating?: number;
    rating_count?: number;
}

export interface InventoryFormData {
    product_id: number;
    quantity: number;
    min_stock_level?: number;
    max_stock_level?: number;
    cost_price?: number;
}

export interface StockMovementFormData {
    product_id: number;
    movement_type: 'IN' | 'OUT' | 'ADJUSTMENT';
    quantity: number;
    reference_type?: string;
    reason?: string;
    cost_price?: number;
    notes?: string;
}

// Filtre tipleri
export interface ProductFilter {
    category?: string;
    min_price?: number;
    max_price?: number;
    stock_status?: StockStatus;
    search?: string;
    sort_by?: 'price' | 'rating' | 'created_at' | 'title';
    sort_order?: 'asc' | 'desc';
}

export interface StockFilter {
    stock_status?: StockStatus;
    category?: string;
    low_stock_only?: boolean;
    search?: string;
}

// Dashboard tipleri
export interface DashboardStats {
    total_products: number;
    total_orders: number;
    total_revenue: number;
    low_stock_count: number;
    out_of_stock_count: number;
    inventory_value: number;
}

// Hata tipleri
export interface AppError {
    code: string;
    message: string;
    details?;
}
