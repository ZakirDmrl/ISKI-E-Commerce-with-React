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
    const [isSignUp, setIsSignUp] = useState(false); // Kayıt modu için state
    
    const { status, error, isAuthenticated } = useSelector((state: RootState) => state.auth);
    
	// Redux dispatch fonksiyonunu kullanmak için useDispatch hook'unu çağır
	const dispatch = useDispatch<AppDispatch>();
	// useNavigate hook'unu kullanarak yönlendirme işlemlerini yapabilmek için çağır
    const navigate = useNavigate();

	useEffect(() =>{
		if(isAuthenticated){
			navigate('/'); // Kullanıcı zaten giriş yapmışsa ana sayfaya yönlendir
		}
	},[isAuthenticated, navigate]);

	// Form gönderildiğinde çalışacak fonksiyon
    const handleSubmit = async (e: React.FormEvent) => {
		// Formun varsayılan davranışını engelle
        e.preventDefault();

		// E-posta ve şifre alanlarının boş olup olmadığını kontrol et
        if (!email || !password) {
            dispatch(setNotification({ message: 'Lütfen tüm alanları doldurun.', type: 'error' }));
            return;
        }

		// Kayıt veya giriş işlemi için Redux Thunk'ı kullan
        if (isSignUp) {
            // Kayıt işlemi
			// signUp thunk'ını çağır ve e-posta ile şifreyi gönder
            const resultAction = await dispatch(signUp({ email, password }));
			// Thunk'ın başarılı veya başarısız olup olmadığını kontrol et
            if (signUp.fulfilled.match(resultAction)) {
                dispatch(setNotification({ message: 'Kayıt başarılı! Lütfen e-postanızı kontrol edin.', type: 'success' }));
                setEmail('');
                setPassword('');
            }
			// Eğer hata varsa, hata mesajını göster 
			else if (signUp.rejected.match(resultAction)) {
                dispatch(setNotification({ message: `Kayıt başarısız: ${error}`, type: 'error' }));
            }
        }
		// Eğer kayıt değilse, giriş işlemi yap
		 else {
            // Giriş işlemi
            const resultAction = await dispatch(signIn({ email, password }));
            if (signIn.fulfilled.match(resultAction)) {
                dispatch(setNotification({ message: 'Giriş başarılı!', type: 'success' }));
                navigate('/'); // Ana sayfaya yönlendir
            } else if (signIn.rejected.match(resultAction)) {
                dispatch(setNotification({ message: `Giriş başarısız: ${error}`, type: 'error' }));
            }
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', maxWidth: '400px', width: '100%', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                <h2>{isSignUp ? 'Kayıt Ol' : 'Giriş Yap'}</h2>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input
                        type="email"
                        placeholder="E-posta"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                    <input
                        type="password"
                        placeholder="Şifre"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                    <button type="submit" disabled={status === 'loading'} style={{ padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        {status === 'loading' ? 'İşleniyor...' : isSignUp ? 'Kayıt Ol' : 'Giriş Yap'}
                    </button>
                </form>
                <div style={{ marginTop: '15px', textAlign: 'center' }}>
                    <p>
                        {isSignUp ? 'Zaten bir hesabın var mı?' : 'Bir hesabın yok mu?'}
                        <span 
                            onClick={() => setIsSignUp(!isSignUp)}
                            style={{ color: '#007bff', cursor: 'pointer', marginLeft: '5px' }}
                        >
                            {isSignUp ? 'Giriş Yap' : 'Kayıt Ol'}
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
