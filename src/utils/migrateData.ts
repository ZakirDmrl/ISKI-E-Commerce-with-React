// src/utils/migrateData.ts
// Bu dosya, fake API'den ürün verilerini Supabase'e aktarmak için kullanılır.
import { supabase } from '../supabaseClient';
import type { Product } from '../types';

export const migrateProducts = async () => {
    try {
        // Fake API'den tüm ürünleri çek
        const response = await fetch('https://fakestoreapi.com/products');
        const data: Product[] = await response.json();

        // Her bir ürünü Supabase'deki 'products' tablosuna ekle
        const { error } = await supabase
            .from('products')
            .insert(data);

        if (error) {
            console.error('Veri aktarımında hata:', error.message);
            return;
        }

        console.log('Veriler Supabase\'e başarıyla aktarıldı!');
    } catch (error) {
        console.error('Beklenmedik bir hata oluştu:', error);
    }
};
