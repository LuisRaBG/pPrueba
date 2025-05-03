// src/routes/AppRoutes.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Importa Layouts y Componentes de Ruta
import DashboardLayout from '../layouts/DashboardLayout.js';
import ProtectedRoute from './ProtectedRoute.js';
import PublicRoute from './PublicRoute.js';

// Importa Páginas
import LoginPage from '../pages/LoginPage.js';
import RegistroPage from '../pages/Registro.js';
import DashboardPage from '../pages/DashboardPage.js';
import GestionEquiposPage from '../pages/GestionEquiposPage.js';
import ProjectDetailPage from '../pages/ProjectDetailPage.js'; // <-- Importar nueva página
import AcceptInvitationPage from '../pages/AcceptInvitationPage.js';
import SettingsPage from '../pages/SettingsPage.js';
// *** AÑADIDO: Importa la página de calendario ***
import CalendarPage from '../pages/CalendarPage.js'; // Ajusta la ruta si es necesario


const AppRoutes = () => {
  return (
    <Routes>

      {/* Rutas Públicas (Login, Registro) */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegistroPage />} />
      </Route>

      {/* Rutas Protegidas (Requieren autenticación) */}
      <Route element={<ProtectedRoute />}>

        {/* Ruta para aceptar invitaciones (AHORA PROTEGIDA) */}
        {/* El usuario debe estar logueado para llegar aquí */}
        <Route path="/invitations/accept" element={<AcceptInvitationPage />} />

        {/* Rutas que usan el DashboardLayout */}
        <Route element={<DashboardLayout />}>
          {/* Ruta del Dashboard (sin ID) */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/proyecto/:projectId" element={<ProjectDetailPage />} /> {/* <-- Nueva ruta */}
          <Route path="/gestion-equipos/:idProyecto" element={<GestionEquiposPage />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* *** AÑADIDO: Ruta para la página de calendario *** */}
          <Route path="/calendar" element={<CalendarPage />} />

          {/* Redirección por defecto dentro del layout protegido */}
          {/* Asegúrate que esta sea la ÚLTIMA ruta dentro de DashboardLayout */}
          {/* Redirige la raíz al dashboard sin ID */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

        </Route> { /* Fin de rutas con DashboardLayout */ }

        {/* Otras rutas protegidas sin DashboardLayout irían aquí */}

      </Route> { /* Fin de Rutas Protegidas */ }

      {/* Considera añadir una ruta 404 aquí si es necesario */}
      {/* <Route path="*" element={<NotFoundPage />} /> */}

    </Routes>
  );
};

export default AppRoutes;
