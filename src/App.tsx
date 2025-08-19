// src/App.tsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CartPage from './pages/CartPage';
import Navbar from './components/Navbar';
import Notification from './components/Notification';

/*
App Bileşeni: Uygulamanın ana bileşenidir.
- <Navbar>: Uygulamanın üst kısmında bulunan navigasyon çubuğunu temsil eder.
- <Routes>: Uygulamanın yönlendirme yapısını tanımlar.
- <Route>: Belirli bir URL yoluna karşılık gelen bileşeni tanımlar
- <HomePage>: Ana sayfa bileşeni.
- <CartPage>: Sepet sayfası bileşeni.
<Routes>: Altındaki <Route> bileşenlerini gruplandırmak için kullanılır.
<Route>: Belirli bir URL yoluna (path) karşılık gelen bileşeni (element) eşleştirir.
*/
const App: React.FC = () => {
  return (
    <>
      <div style={{ backgroundColor: '#212121', color: '#fff', minHeight: '100vh' ,  minWidth: '210vh' }}>
        <Navbar />
        <Notification />
        <div className="container" style={{ padding: '20px' }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/cart" element={<CartPage />} />
          </Routes>
        </div>
      </div>
    </>
  );
};

export default App;
