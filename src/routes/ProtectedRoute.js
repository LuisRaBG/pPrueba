// src/routes/ProtectedRoute.js
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js'; // Ajusta ruta si es necesario
import LoadingScreen from '../components/common/LoadingScreen.js'; // Ajusta ruta si es necesario

const ProtectedRoute = () => {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation(); // ¡Bien usado!

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (!isAuthenticated) {
        // Redirige a login guardando la ruta original
        console.log("ProtectedRoute: User not authenticated, redirecting to login from", location.pathname);
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    // Si está autenticado, renderiza la ruta hija correspondiente (gracias a <Outlet />)
    return <Outlet />;
};

export default ProtectedRoute;
