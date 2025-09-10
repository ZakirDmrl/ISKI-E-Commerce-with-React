// src/config/api.ts
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

import axios from 'axios';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Her istekte token ekle
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('supabase.auth.token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Multipart form data için Content-Type'ı otomatik ayarla
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Token refresh handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token süresi dolmuş, refresh token dene
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { 
            refresh_token: refreshToken 
          });
          localStorage.setItem('supabase.auth.token', response.data.access_token);
          
          // Yeni token ile orijinal isteği tekrarla
          error.config.headers.Authorization = `Bearer ${response.data.access_token}`;
          return apiClient.request(error.config);
        } catch (refreshError) {
          // Refresh başarısız, kullanıcıyı çıkart
          localStorage.removeItem('supabase.auth.token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/auth';
          return Promise.reject(refreshError);
        }
      } else {
        // Refresh token yok, login sayfasına yönlendir
        localStorage.removeItem('supabase.auth.token');
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  }
);
