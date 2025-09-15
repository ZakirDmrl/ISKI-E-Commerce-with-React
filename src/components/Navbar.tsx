// src/components/Navbar.tsx
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { type RootState, type AppDispatch } from '../store/store';
import { setNotification, clearNotification } from '../store/notificationSlice';
import { signOut } from '../store/authSlice';
import { useState } from 'react';

const Navbar = () => {
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();
    const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
    const cartItems = useSelector((state: RootState) => state.cart.items);
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        setIsMobileMenuOpen(false);
    };

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    // Supabase'den gelen avatar_url'yi kullan, yoksa bir placeholder göster
    const avatarUrl = user?.avatarUrl || `https://ui-avatars.com/api/?name=${user?.email}&background=007bff&color=fff&rounded=true&bold=true`;

    return (
        <nav className="navbar">
            <div className="navbar-container">
                {/* Logo Section */}
                <Link to="/" className="navbar-brand">
                    <img 
                        src="https://upload.wikimedia.org/wikipedia/tr/e/e3/Iski-logo.png?20200604131947" 
                        alt="İSKİ E-Commerce Logo" 
                        className="navbar-logo"
                    />
                    <span className="navbar-title">İSKİ E-Commerce</span>
                </Link>

                {/* Mobile Menu Button */}
                <button 
                    className="mobile-menu-button"
                    onClick={toggleMobileMenu}
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>

                {/* Navigation Links */}
                <div className={`navbar-nav ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
                    {isAuthenticated ? (
                        <>
                           
                            {/* Admin Panel Link */}
                            {user?.isAdmin && (
                                <button
                                    onClick={() => {
                                        navigate('/admin');
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="nav-btn admin-btn"
                                >
                                    🛠 Admin Paneli
                                </button>
                            )}

                            {/* Profile Link */}
                            <Link 
                                to="/profile" 
                                className="nav-link"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {/* Doğrudan avatar_url'yi kullanıyoruz */}
                                <img src={avatarUrl} alt="User Avatar" className="user-avatar-img" />
                                    {user?.email}
                                <span className="user-email">
                                </span>
                            </Link>

                            {/* Cart Link */}
                            <Link 
                                to="/cart" 
                                className={`nav-link cart-link ${totalItems > 0 ? 'has-items' : ''}`}
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                🛒 Sepet
                                {totalItems > 0 && (
                                    <span className="cart-badge">
                                        {totalItems}
                                    </span>
                                )}
                            </Link>

                            {/* Sign Out Button */}
                            <button 
                                onClick={handleSignOut} 
                                className="nav-btn signout-btn"
                            >
                                Çıkış
                            </button>
                        </>
                    ) : (
                        <Link 
                            to="/auth" 
                            className="nav-link auth-link"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Giriş Yap
                        </Link>
                    )}
                </div>
            </div>

            <style>{`
                .navbar {
                    background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
                    padding: 15px 0;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    z-index: 1000;
                    backdrop-filter: blur(10px);
                }

                .navbar-container {
                    max-width: 1400px;
                    margin: 0 auto;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0 20px;
                    position: relative;
                }

                .navbar-brand {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    text-decoration: none;
                    color: white;
                }

                .navbar-logo {
                    height: 80px;
                    object-fit: contain;
                    transition: transform 0.3s ease;
                }

                .navbar-logo:hover {
                    transform: scale(1.05);
                }

                .navbar-title {
                    font-size: 2rem;
                    font-weight: 700;
                    background: linear-gradient(45deg, #fff, #e0e0e0);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    transition: all 0.3s ease;
                }

                .mobile-menu-button {
                    display: none;
                    flex-direction: column;
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 10px;
                    position: relative;
                    z-index: 1001;
                }

                .mobile-menu-button span {
                    width: 25px;
                    height: 3px;
                    background: white;
                    margin: 3px 0;
                    transition: 0.3s;
                    border-radius: 2px;
                }

                .mobile-menu-button.active span:nth-child(1) {
                    transform: rotate(-45deg) translate(-5px, 6px);
                }

                .mobile-menu-button.active span:nth-child(2) {
                    opacity: 0;
                }

                .mobile-menu-button.active span:nth-child(3) {
                    transform: rotate(45deg) translate(-5px, -6px);
                }

                .navbar-nav {
                    display: flex;
                    align-items: center;
                    gap: 25px;
                }

                .user-info {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                    background: rgba(255,255,255,0.1);
                    padding: 8px 16px;
                    border-radius: 25px;
                    backdrop-filter: blur(10px);
                }

                .user-avatar-img {
                    width: 35px;
                    height: 35px;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 2px solid white;
                }

                .user-email {
                    font-size: 0.95rem;
                    color: #e0e0e0;
                    max-width: 150px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .nav-btn {
                    padding: 10px 20px;
                    border-radius: 25px;
                    border: 1px solid rgba(255,255,255,0.2);
                    color: white;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-decoration: none;
                    display: inline-block;
                    font-size: 0.9rem;
                }

                .admin-btn {
                    background: linear-gradient(45deg, #00c6ff, #0072ff);
                }

                .signout-btn {
                    background: linear-gradient(45deg, #ff6b6b, #ee5a24);
                }

                .nav-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(0,0,0,0.3);
                }

                .nav-link {
                    color: white;
                    text-decoration: none;
                    padding: 10px 20px;
                    border-radius: 25px;
                    background: rgba(255,255,255,0.15);
                    font-weight: 500;
                    border: 1px solid rgba(255,255,255,0.2);
                    transition: all 0.3s ease;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 0.9rem;
                }

                .nav-link:hover {
                    background: rgba(255,255,255,0.25);
                    transform: translateY(-1px);
                }

                .cart-link.has-items {
                    background: linear-gradient(45deg, #f093fb 0%, #f5576c 100%);
                }

                .cart-badge {
                    background: rgba(255,255,255,0.3);
                    color: white;
                    border-radius: 50%;
                    padding: 4px 8px;
                    font-size: 0.8rem;
                    font-weight: bold;
                    min-width: 24px;
                    text-align: center;
                }

                .auth-link {
                    background: linear-gradient(45deg, #667eea, #764ba2);
                    padding: 12px 25px;
                    font-weight: 600;
                }

                /* Mobile Styles */
                @media (max-width: 1200px) {
                    .navbar-title {
                        font-size: 1.5rem;
                    }

                    .navbar-logo {
                        height: 60px;
                    }

                    .user-email {
                        max-width: 120px;
                    }
                }

                @media (max-width: 968px) {
                    .mobile-menu-button {
                        display: flex;
                    }

                    .navbar-nav {
                        position: fixed;
                        top: 0;
                        right: -100%;
                        height: 100vh;
                        width: 300px;
                        background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
                        flex-direction: column;
                        justify-content: flex-start;
                        align-items: stretch;
                        padding: 120px 20px 20px;
                        transition: right 0.3s ease;
                        box-shadow: -5px 0 20px rgba(0,0,0,0.3);
                        gap: 15px;
                    }

                    .navbar-nav.mobile-open {
                        right: 0;
                    }

                    .user-info {
                        flex-direction: column;
                        text-align: center;
                        padding: 15px;
                        background: rgba(255,255,255,0.15);
                    }

                    .user-email {
                        max-width: none;
                        text-align: center;
                    }

                    .nav-link,
                    .nav-btn {
                        width: 100%;
                        text-align: center;
                        justify-content: center;
                        margin: 0;
                    }

                    .cart-link {
                        position: relative;
                    }

                    .cart-badge {
                        position: absolute;
                        right: 15px;
                        top: 50%;
                        transform: translateY(-50%);
                    }
                }

                @media (max-width: 768px) {
                    .navbar-container {
                        padding: 0 15px;
                    }

                    .navbar-title {
                        font-size: 1.3rem;
                    }

                    .navbar-logo {
                        height: 50px;
                    }

                    .navbar-nav {
                        width: 280px;
                        padding: 100px 15px 15px;
                    }
                }

                @media (max-width: 480px) {
                    .navbar-container {
                        padding: 0 10px;
                    }

                    .navbar-title {
                        font-size: 1.1rem;
                    }

                    .navbar-logo {
                        height: 45px;
                    }

                    .navbar-nav {
                        width: 250px;
                    }

                    .user-info {
                        padding: 12px;
                    }

                    .nav-link,
                    .nav-btn {
                        padding: 12px 16px;
                        font-size: 0.85rem;
                    }
                }

                /* High DPI adjustments */
                @media (min-resolution: 150dpi) {
                    .navbar {
                        padding: 18px 0;
                    }

                    .navbar-logo {
                        height: 85px;
                    }
                }

                /* Overlay for mobile menu */
                @media (max-width: 968px) {
                    .navbar-nav.mobile-open::before {
                        content: '';
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100vw;
                        height: 100vh;
                        background: rgba(0,0,0,0.5);
                        z-index: -1;
                    }
                }
            `}</style>
        </nav>
    );
};

export default Navbar;
