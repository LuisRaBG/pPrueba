// src/App.js
import React from 'react';
// Asegúrate que BrowserRouter solo esté aquí
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext.js';
import { ProjectProvider } from './contexts/ProjectContext.js';
import { NotificationProvider } from './contexts/NotificationContext.js'; // Ajusta la ruta si es necesario
import { theme } from './styles/theme.js';
import AppRoutes from './routes/AppRoutes.js'; // Asume que AppRoutes define <Routes>
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './styles/global.css';

// 1. Importa el componente Analytics de Vercel
import { Analytics } from "@vercel/analytics/react"

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* AuthProvider envuelve todo lo que necesita autenticación */}
      <AuthProvider>
        {/* ProjectProvider envuelve todo lo que necesita acceso al proyecto actual */}
        <ProjectProvider>
          {/* NotificationProvider envuelve lo que necesita notificaciones */}
          <NotificationProvider>
            {/* BrowserRouter envuelve toda la aplicación para el enrutamiento */}
            <BrowserRouter>
              {/* AppRoutes renderiza las diferentes rutas y layouts */}
              <AppRoutes />

              {/* 2. Añade el componente Analytics aquí */}
              {/* Se inyecta para que esté presente en toda la aplicación */}
              <Analytics />
            </BrowserRouter>
          </NotificationProvider>
        </ProjectProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
