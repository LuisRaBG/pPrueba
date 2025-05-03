// src/routes/PublicRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js'; // Ajusta ruta si es necesario
import LoadingScreen from '../components/common/LoadingScreen.js'; // Ajusta ruta si es necesario

const PublicRoute = () => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (isAuthenticated) {
        // Si ya está logueado, no debe ver login/register, redirige a dashboard
        console.log("PublicRoute: User already authenticated, redirecting to dashboard");
        return <Navigate to="/dashboard" replace />;
    }

    // Si no está autenticado, renderiza la ruta hija (ej. LoginPage)
    return <Outlet />;
};

export default PublicRoute;
