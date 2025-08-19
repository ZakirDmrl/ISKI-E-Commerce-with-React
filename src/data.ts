// Eski mock veri seti şuan API'den çekiliyor.
import type { Product } from './types';

export const products: Product[] = [
  { id: 1, name: 'Telefon', price: 15000, description: 'Son model akıllı telefon.' },
  { id: 2, name: 'Laptop', price: 25000, description: 'Yüksek performanslı dizüstü bilgisayar.' },
  { id: 3, name: 'Tablet', price: 8000, description: 'Hafif ve taşınabilir tablet.' },
];
