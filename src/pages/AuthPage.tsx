// src/pages/AuthPage.tsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { signIn, signUp } from '../store/authSlice';
import { type AppDispatch, type RootState } from '../store/store';
import { setNotification } from '../store/notificationSlice';
import { useNavigate } from 'react-router-dom';

const AuthPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    
    const { status, error, isAuthenticated } = useSelector((state: RootState) => state.auth);
    
    const dispatch = useDispatch<AppDispatch>();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            dispatch(setNotification({ message: 'Lütfen tüm alanları doldurun.', type: 'error' }));
            return;
        }

        if (isSignUp) {
            const resultAction = await dispatch(signUp({ email, password }));
            if (signUp.fulfilled.match(resultAction)) {
                dispatch(setNotification({ message: 'Kayıt başarılı! Lütfen e-postanızı kontrol edin.', type: 'success' }));
                setEmail('');
                setPassword('');
            } else if (signUp.rejected.match(resultAction)) {
                dispatch(setNotification({ message: `Kayıt başarısız: ${error}`, type: 'error' }));
            }
        } else {
            const resultAction = await dispatch(signIn({ email, password }));
            if (signIn.fulfilled.match(resultAction)) {
                dispatch(setNotification({ message: 'Giriş başarılı!', type: 'success' }));
                navigate('/');
            } else if (signIn.rejected.match(resultAction)) {
                dispatch(setNotification({ message: `Giriş başarısız: ${error}`, type: 'error' }));
            }
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '80vh',
            width: '100%'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '400px',
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                padding: '40px',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
            }}>
                {/* Header */}
                <div style={{
                    textAlign: 'center',
                    marginBottom: '30px'
                }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'linear-gradient(45deg, #667eea, #764ba2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px',
                        fontSize: '2rem',
                        color: 'white'
                    }}>
                        🔐
                    </div>
                    <h2 style={{
                        fontSize: '1.8rem',
                        fontWeight: '700',
                        margin: '0 0 8px 0',
                        color: '#fff'
                    }}>
                        {isSignUp ? 'Hesap Oluştur' : 'Giriş Yap'}
                    </h2>
                    <p style={{
                        color: '#ccc',
                        fontSize: '0.95rem',
                        margin: '0'
                    }}>
                        {isSignUp ? 'Yeni bir hesap oluşturun' : 'Hesabınıza giriş yapın'}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px'
                }}>
                    <div>
                        <label style={{
                            display: 'block',
                            color: '#fff',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            marginBottom: '8px'
                        }}>
                            E-posta
                        </label>
                        <input
                            type="email"
                            placeholder="ornek@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                fontSize: '1rem',
                                borderRadius: '12px',
                                border: '2px solid rgba(255,255,255,0.1)',
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                color: '#fff',
                                outline: 'none',
                                transition: 'all 0.3s ease',
                                backdropFilter: 'blur(10px)'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#007bff';
                                e.target.style.boxShadow = '0 0 20px rgba(0,123,255,0.3)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>

                    <div>
                        <label style={{
                            display: 'block',
                            color: '#fff',
                            fontSize: '0.9rem',
                            fontWeight: '600',
                            marginBottom: '8px'
                        }}>
                            Şifre
                        </label>
                        <input
                            type="password"
                            placeholder="Şifrenizi girin"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '12px 16px',
                                fontSize: '1rem',
                                borderRadius: '12px',
                                border: '2px solid rgba(255,255,255,0.1)',
                                backgroundColor: 'rgba(255,255,255,0.1)',
                                color: '#fff',
                                outline: 'none',
                                transition: 'all 0.3s ease',
                                backdropFilter: 'blur(10px)'
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#007bff';
                                e.target.style.boxShadow = '0 0 20px rgba(0,123,255,0.3)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = 'rgba(255,255,255,0.1)';
                                e.target.style.boxShadow = 'none';
                            }}
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={status === 'loading'}
                        style={{
                            width: '100%',
                            padding: '15px 20px',
                            background: status === 'loading' 
                                ? 'rgba(102, 126, 234, 0.6)' 
                                : 'linear-gradient(45deg, #667eea, #764ba2)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '1.1rem',
                            fontWeight: '600',
                            cursor: status === 'loading' ? 'not-allowed' : 'pointer',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
                        }}
                        onMouseEnter={(e) => {
                            if (status !== 'loading') {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.6)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (status !== 'loading') {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                            }
                        }}
                    >
                        {status === 'loading' ? (
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                <div style={{
                                    width: '20px',
                                    height: '20px',
                                    border: '2px solid rgba(255,255,255,0.3)',
                                    borderTop: '2px solid white',
                                    borderRadius: '50%',
                                    animation: 'spin 1s linear infinite'
                                }}></div>
                                İşleniyor...
                            </span>
                        ) : (
                            isSignUp ? 'Hesap Oluştur' : 'Giriş Yap'
                        )}
                    </button>
                </form>

                {/* Switch Mode */}
                <div style={{
                    marginTop: '25px',
                    textAlign: 'center',
                    padding: '20px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <p style={{
                        color: '#ccc',
                        fontSize: '0.9rem',
                        margin: '0 0 10px 0'
                    }}>
                        {isSignUp ? 'Zaten bir hesabınız var mı?' : 'Hesabınız yok mu?'}
                    </p>
                    <button
                        type="button"
                        onClick={() => setIsSignUp(!isSignUp)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#007bff',
                            fontSize: '0.95rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#4dabf7';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = '#007bff';
                        }}
                    >
                        {isSignUp ? 'Giriş Yap' : 'Hesap Oluştur'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;

