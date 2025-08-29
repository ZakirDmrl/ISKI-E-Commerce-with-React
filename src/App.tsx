// src/App.tsx
import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import HomePage from './pages/HomePage';
import CartPage from './pages/CartPage';
import ProfilePage from './pages/ProfilePage'; // Yeni eklenen
import Navbar from './components/Navbar';
import Notification from './components/Notification';
import { supabase } from './supabaseClient';
import { setUser, type AppUser } from './store/authSlice';
import ProductDetail from './pages/ProductDetail';
import AuthPage from './pages/AuthPage';
import PrivateRoute from './components/PrivateRoute';
import AdminPage from './pages/AdminPage';
import { clearNotification } from './store/notificationSlice';
import type { RootState } from './store/store';
import CheckoutPage from './pages/CheckoutPage';

const App: React.FC = () => {
    const dispatch = useDispatch();
    const notification = useSelector((state: RootState) => state.notification);
    
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            let user: AppUser | null = null;
            if (session?.user) {
                const isAdmin = session.user.app_metadata.is_admin === true;

                console.log('isAdmin:', isAdmin);
                console.log('session.user:', session.user);
                user = { ...session.user, isAdmin } as AppUser;
            }
            dispatch(setUser(user));
        });
        return () => subscription.unsubscribe();
    }, [dispatch]);

    useEffect(() => {
        if (notification.message) {
            const timer = setTimeout(() => {
                dispatch(clearNotification());
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [notification, dispatch]);

    return (
        <>
            <Navbar />
            <Notification />
            <div style={{ 
                backgroundColor: '#212121', 
                color: '#fff', 
                minHeight: '100vh',
                width: '100%',
                background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 25%, #212121 50%, #2d1b69 75%, #11998e 100%)'
            }}>
                {/* Ana içerik alanı - Full width */}
                <div style={{ 
                    width: '100%',
                    minHeight: '100vh',
                    maxWidth: '1400px',
                    margin: '0 auto',
                    padding: '20px'
                }}>
                    <Routes>
                        {/* Giriş sayfasına herkes erişebilsin */}
                        <Route path="/auth" element={<AuthPage />} />
                        
                        {/* Korumalı rotalar */}
                        <Route element={<PrivateRoute />}>
                            <Route path="/" element={<HomePage />} />
                            <Route path="/cart" element={<CartPage />} />
                            <Route path="/profile" element={<ProfilePage />} />
                            <Route path="/product/:productId" element={<ProductDetail />} />
                            <Route path="/checkout" element={<CheckoutPage />} />
                        </Route>
                        
                        {/* Admin rotaları */}
                        <Route element={<PrivateRoute isAdminRoute={true} />}>
                            <Route path="/admin" element={<AdminPage />} />
                        </Route>
                    </Routes>
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                
                html, body {
                    margin: 0;
                    padding: 0;
                    width: 100%;
                    height: 100%;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
                        'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
                        sans-serif;
                    -webkit-font-smoothing: antialiased;
                    -moz-osx-font-smoothing: grayscale;
                    background: linear-gradient(135deg, #1e3c72 0%, #2a5298 25%, #212121 50%, #2d1b69 75%, #11998e 100%);
                    background-attachment: fixed;
                }
                
                #root {
                    width: 100%;
                    min-height: 100vh;
                }
                
                * {
                    box-sizing: border-box;
                }

                /* Scrollbar styling */
                ::-webkit-scrollbar {
                    width: 8px;
                }
                
                ::-webkit-scrollbar-track {
                    background: rgba(255,255,255,0.1);
                }
                
                ::-webkit-scrollbar-thumb {
                    background: linear-gradient(45deg, #667eea, #764ba2);
                    border-radius: 4px;
                }
                
                ::-webkit-scrollbar-thumb:hover {
                    background: linear-gradient(45deg, #764ba2, #667eea);
                }

                @media (max-width: 1440px) {
                    .container {
                        padding: 0 40px;
                    }
                }

                @media (max-width: 768px) {
                    .container {
                        padding: 0 20px;
                    }
                }

                @media (max-width: 480px) {
                    .container {
                        padding: 0 15px;
                    }
                }
            `}</style>
        </>
    );
};

export default App;
