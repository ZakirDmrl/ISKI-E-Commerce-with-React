// src/App.tsx
import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import HomePage from './pages/HomePage';
import CartPage from './pages/CartPage';
import ProfilePage from './pages/ProfilePage';
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
    
    // Kullanıcı kimlik doğrulama mantığı
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            let user: AppUser | null = null;
            if (session?.user) {
                const isAdmin = session.user.app_metadata.is_admin === true;
                user = { ...session.user, isAdmin } as AppUser;
            }
            dispatch(setUser(user));
        });
        return () => subscription.unsubscribe();
    }, [dispatch]);

    // Bildirim yönetimi
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
            <div className="app-container">
                <Navbar />
                <Notification />
                <div className="main-content">
                    <div className="content-wrapper">
                        <Routes>
                            <Route path="/auth" element={<AuthPage />} />
                            
                            <Route element={<PrivateRoute />}>
                                <Route path="/" element={<HomePage />} />
                                <Route path="/cart" element={<CartPage />} />
                                <Route path="/profile" element={<ProfilePage />} />
                                <Route path="/product/:productId" element={<ProductDetail />} />
                                <Route path="/checkout" element={<CheckoutPage />} />
                            </Route>
                            
                            <Route element={<PrivateRoute isAdminRoute={true} />}>
                                <Route path="/admin" element={<AdminPage />} />
                            </Route>
                        </Routes>
                    </div>
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
                    overflow-x: hidden; /* Yatay scroll'u engelle */
                }
                
                #root {
                    width: 100%;
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                }
                
                * {
                    box-sizing: border-box;
                }

                .app-container {
                    display: flex;
                    flex-direction: column;
                    min-height: 100vh;
                    width: 100%;
                }

                .main-content {
                    flex: 1;
                    width: 100%;
                    background: linear-gradient(135deg, #1e3c72 0%, #2a5298 25%, #212121 50%, #2d1b69 75%, #11998e 100%);
                    padding-top: 120px; /* Navbar için boşluk (logo 80px + padding 15px*2 + extra space) */
                }

                .content-wrapper {
                    width: 100%;
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 1rem;
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

                /* Responsive Design */
                @media (max-width: 1440px) {
                    .content-wrapper {
                        padding: 1rem 2rem;
                    }
                }

                @media (max-width: 768px) {
                    .main-content {
                        padding-top: 100px; /* Mobilde navbar daha küçük */
                    }
                    
                    .content-wrapper {
                        padding: 1rem;
                    }
                }

                @media (max-width: 480px) {
                    .main-content {
                        padding-top: 90px;
                    }
                    
                    .content-wrapper {
                        padding: 0.5rem;
                    }
                }

                /* Zoom responsive */
                @media (min-resolution: 150dpi), (min-resolution: 1.5dppx) {
                    .main-content {
                        padding-top: 130px;
                    }
                }

                @media (min-resolution: 200dpi), (min-resolution: 2dppx) {
                    .main-content {
                        padding-top: 140px;
                    }
                }
            `}</style>
        </>
    );
};

export default App;
