// src/components/Navbar.tsx
import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { type RootState, type AppDispatch } from '../store/store';
import { signOut, setUser, type AppUser } from '../store/authSlice';
import { setNotification, clearNotification } from '../store/notificationSlice';
import { supabase } from '../supabaseClient';

const Navbar = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
    const cartItems = useSelector((state: RootState) => state.cart.items);
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    // ✅ Supabase session'dan admin bilgisini al
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            let currentUser: AppUser | null = null;
            if (session?.user) {
                const isAdmin = session.user.app_metadata?.is_admin === true;

                currentUser = {
                    ...session.user,
                    isAdmin,
                } as AppUser;
            }
            dispatch(setUser(currentUser));
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [dispatch]);

    const handleSignOut = async () => {
        const resultAction = await dispatch(signOut());
        if (signOut.fulfilled.match(resultAction)) {
            dispatch(setNotification({
                message: 'Çıkış işlemi başarılı.',
                type: 'success'
            }));
            navigate('/auth');
        } else if (signOut.rejected.match(resultAction)) {
            dispatch(setNotification({
                message: 'Çıkış işlemi başarısız.',
                type: 'error'
            }));
        }
        setTimeout(() => dispatch(clearNotification()), 3000);
    };

    return (
        <nav style={{
            background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
            padding: '15px 0',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            backdropFilter: 'blur(10px)'
        }}>
            <div style={{
                maxWidth: '1400px',
                margin: '0 auto',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0 20px'
            }}>
                {/* Logo */}
                <Link
                    to="/"
                    style={{
                        color: 'white',
                        textDecoration: 'none',
                        fontSize: '2rem',
                        fontWeight: '700',
                        background: 'linear-gradient(45deg, #fff, #e0e0e0)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        transition: 'all 0.3s ease'
                    }}
                >
                    İSKİ E-Commerce
                </Link>

                {/* Navigation Links */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '25px' }}>
                    {isAuthenticated ? (
                        <>
                            {/* User Welcome */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '15px',
                                background: 'rgba(255,255,255,0.1)',
                                padding: '8px 16px',
                                borderRadius: '25px',
                                backdropFilter: 'blur(10px)'
                            }}>
                                <div style={{
                                    width: '35px',
                                    height: '35px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(45deg, #667eea, #764ba2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    fontSize: '0.9rem'
                                }}>
                                    {user?.email?.charAt(0).toUpperCase()}
                                </div>
                                <span style={{
                                    fontSize: '0.95rem',
                                    color: '#e0e0e0',
                                    maxWidth: '150px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {user?.email}
                                </span>
                            </div>

                            {/* ✅ Admin Panel Link (sadece admin görecek) */}
                            {user?.isAdmin && (
                                <button
                                    onClick={() => navigate('/admin')}
                                    style={{
                                        padding: '10px 20px',
                                        borderRadius: '25px',
                                        border: '1px solid rgba(255,255,255,0.2)',
                                        background: 'linear-gradient(45deg, #00c6ff, #0072ff)',
                                        color: 'white',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.3)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                >
                                    🛠 Admin Paneli
                                </button>
                            )}

                            {/* Profile Link */}
                            <Link to="/profile" style={{
                                color: 'white',
                                textDecoration: 'none',
                                padding: '10px 20px',
                                borderRadius: '25px',
                                background: 'rgba(255,255,255,0.15)',
                                fontWeight: '500',
                                border: '1px solid rgba(255,255,255,0.2)'
                            }}>
                                👤 Profil
                            </Link>

                            {/* Cart Link */}
                            <Link to="/cart" style={{
                                color: 'white',
                                textDecoration: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 20px',
                                borderRadius: '25px',
                                background: totalItems > 0 ? 'linear-gradient(45deg, #f093fb 0%, #f5576c 100%)' : 'rgba(255,255,255,0.15)',
                                fontWeight: '500',
                                border: '1px solid rgba(255,255,255,0.2)',
                                position: 'relative'
                            }}>
                                🛒 Sepet
                                {totalItems > 0 && (
                                    <span style={{
                                        background: 'rgba(255,255,255,0.3)',
                                        color: 'white',
                                        borderRadius: '50%',
                                        padding: '4px 8px',
                                        fontSize: '0.8rem',
                                        fontWeight: 'bold',
                                        minWidth: '24px',
                                        textAlign: 'center'
                                    }}>
                                        {totalItems}
                                    </span>
                                )}
                            </Link>

                            {/* Sign Out Button */}
                            <button onClick={handleSignOut} style={{
                                padding: '10px 20px',
                                background: 'linear-gradient(45deg, #ff6b6b, #ee5a24)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '25px',
                                cursor: 'pointer',
                                fontWeight: '500'
                            }}>
                                Çıkış
                            </button>
                        </>
                    ) : (
                        <Link to="/auth" style={{
                            color: 'white',
                            textDecoration: 'none',
                            padding: '12px 25px',
                            background: 'linear-gradient(45deg, #667eea, #764ba2)',
                            borderRadius: '25px',
                            fontWeight: '600'
                        }}>
                            Giriş Yap
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
