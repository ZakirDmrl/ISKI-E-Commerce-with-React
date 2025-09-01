// src/utils/migrateData.ts
import { supabase } from '../supabaseClient';

// Fake Store API'den ürünleri çekme ve Supabase'e aktarma fonksiyonu
export const migrateProducts = async () => {
    try {
        const response = await fetch('https://fakestoreapi.com/products');
        if (!response.ok) {
            throw new Error('API\'den veri alınamadı.');
        }
        const products = await response.json();

        const formattedProducts = products.map((product ) => ({
            // title, description, price, image ve category alanları aynı kalacak
            title: product.title,
            description: product.description,
            price: product.price,
            image: product.image,
            category: product.category,
            // Hata veren rating alanını düzeltiyoruz
            rating: product.rating.rate,       // Sadece 'rate' değerini al
            rating_count: product.rating.count // 'count' değerini al
        }));

        const { error } = await supabase
            .from('products')
            .insert(formattedProducts);

        if (error) {
            throw new Error(error.message);
        }

        console.log('Veri aktarımı başarıyla tamamlandı!');
    } catch (error ) {
        console.error('Veri aktarımında hata:', error.message);
    }
};
