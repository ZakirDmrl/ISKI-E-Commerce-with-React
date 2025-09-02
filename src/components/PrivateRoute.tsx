// src/components/PrivateRoute.tsx
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { RootState } from '../store/store';
import type { AppUser } from '../store/authSlice';

interface PrivateRouteProps {
    isAdminRoute?: boolean;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ isAdminRoute }) => {
	// Store dan kullacının auth bilgisini al (kimliği doğrulanmış mı?)
    const { isAuthenticated, status, user } = useSelector((state: RootState) => state.auth);
	// Mevcut url yi içeren bir nesne döndürür.
    const location = useLocation();
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (status === 'succeeded' || status === 'failed') {
            setIsReady(true);
        }
    }, [status]);
    
    if (!isReady || status === 'loading') {
        return <p style={{ textAlign: 'center', marginTop: '50px' }}>Yükleniyor...</p>;
    }
    
    if (!isAuthenticated) {
        return <Navigate to="/auth" state={{ from: location }} replace />;
    }
    
    if (isAdminRoute && !(user as AppUser)?.isAdmin) {
        return <Navigate to="/" replace />;
    }
    return <Outlet />;
};

export default PrivateRoute;
