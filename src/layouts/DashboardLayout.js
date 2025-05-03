// src/layouts/DashboardLayout.js
import React, { useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import {
    Box,
    CssBaseline,
    styled,
    useTheme,
    alpha // Necesario para el scrollbar
} from '@mui/material';
import Sidebar from './Sidebar.js'; // Asegúrate que sea la versión mobile-focused
import Navbar from './Navbar.js';   // Asegúrate que sea la versión mobile-focused
// *** AÑADIDO: Importa el nuevo diálogo ***
import AcceptInvitationDialog from '../features/equipos/components/AcceptInvitationDialog.js'; // Ajusta la ruta si es necesario

// --- Constantes de Layout (Ajustadas para Móvil) ---
const APP_BAR_HEIGHT = 60; // Altura del Navbar móvil (ajusta si es diferente)

// --- Styled Components (Simplificados para Móvil) ---

// Contenedor principal del contenido (Main)
const MainContent = styled('main')(({ theme }) => ({
    flexGrow: 1,
    // Fondo (puedes ajustarlo o quitarlo si prefieres el default)
    backgroundColor: theme.palette.mode === 'dark'
        ? theme.palette.grey[900]
        : theme.palette.grey[100], // Fondo gris claro
    marginTop: `${APP_BAR_HEIGHT}px`, // Espacio para el Navbar fijo
    height: `calc(100vh - ${APP_BAR_HEIGHT}px)`, // Ocupa el resto de la altura
    width: '100%', // Siempre ocupa todo el ancho
    overflow: 'hidden', // El scroll lo maneja el Box interno
    display: 'flex',
    flexDirection: 'column',
    padding: theme.spacing(1.5), // Padding reducido y consistente para móvil
}));

// --- Layout Component (Mobile-Focused) ---
const DashboardLayout = () => {
    const theme = useTheme();
    const [mobileOpen, setMobileOpen] = useState(false); // Estado solo para el drawer móvil
    // *** AÑADIDO: Estado y handlers para el diálogo de invitación ***
    const [isAcceptInviteDialogOpen, setIsAcceptInviteDialogOpen] = useState(false);

    // Callback para abrir/cerrar el drawer móvil
    const handleDrawerToggle = useCallback(() => {
        setMobileOpen(prev => !prev);
    }, []);

    // Callback para cerrar el drawer móvil (cuando se hace clic fuera o en un item)
    const handleMobileDrawerClose = useCallback(() => {
        setMobileOpen(false);
    }, []);

    // *** AÑADIDO: Funciones para abrir/cerrar el diálogo ***
    const handleOpenAcceptInviteDialog = useCallback(() => {
        setMobileOpen(false); // Cierra el sidebar si está abierto
        setIsAcceptInviteDialogOpen(true);
    }, []);

    const handleCloseAcceptInviteDialog = useCallback(() => {
        setIsAcceptInviteDialogOpen(false);
    }, []);

    return (
        // Contenedor principal que ocupa toda la pantalla
        <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            <CssBaseline /> {/* Normaliza estilos */}

            {/* Navbar Fijo en la parte superior */}
            <Navbar
                handleDrawerToggle={handleDrawerToggle} // Pasa la función para abrir/cerrar el Sidebar
            />

            {/* Sidebar Temporal (Drawer) */}
            <Sidebar
                open={mobileOpen} // Controla si está visible
                onClose={handleMobileDrawerClose} // Función para cerrar
                // *** AÑADIDO: Pasa la función para abrir el diálogo ***
                onOpenAcceptInviteDialog={handleOpenAcceptInviteDialog}
            />

            {/* Área Principal del Contenido */}
            <MainContent component="main">
                {/* Contenedor interno que permite el scroll vertical del contenido */}
                 <Box sx={{
                     flex: 1, // Ocupa el espacio disponible dentro de MainContent
                     display: 'flex',
                     flexDirection: 'column',
                     overflowY: 'auto', // Habilita el scroll vertical si el contenido excede la altura
                     overflowX: 'hidden', // Oculta el scroll horizontal
                     minHeight: 0, // Necesario para que flexbox funcione correctamente con overflow
                     // Estilos opcionales para el scrollbar (más delgados para móvil)
                     '&::-webkit-scrollbar': { width: '6px' },
                     '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
                     '&::-webkit-scrollbar-thumb': {
                         backgroundColor: alpha(theme.palette.text.primary, 0.2), // Scrollbar sutil
                         borderRadius: '3px',
                         '&:hover': {
                              backgroundColor: alpha(theme.palette.text.primary, 0.35), // Un poco más visible al pasar el mouse (si aplica)
                         }
                     }
                 }}>
                     <Outlet /> {/* Aquí se renderiza la página actual definida por las rutas */}
                 </Box>
            </MainContent>

            {/* *** AÑADIDO: Renderiza el diálogo *** */}
            <AcceptInvitationDialog
                open={isAcceptInviteDialogOpen}
                onClose={handleCloseAcceptInviteDialog}
            />
        </Box>
    );
};

export default DashboardLayout;
