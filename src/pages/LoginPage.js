// src/pages/LoginPage.js
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Login from '../features/auth/components/Login.js'; // Asegúrate que la ruta sea correcta
import {
    Container,
    Box,
    Typography,
    Link as MuiLink,
    Stack,
    CssBaseline,
} from '@mui/material';

const LoginPage = () => {

    // *** AJUSTADO: Colores blanco y negro para máxima visibilidad ***
    const gradientCenterColor = '#FFFFFF'; // Blanco puro en el centro
    const gradientEdgeColor = '#1B396A';   // Negro puro en los bordes

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
                // --- FONDO RADIAL (Blanco a Negro) ---
                // Centrado horizontalmente ('center') y al 40% verticalmente ('40%')
                // Comienza blanco y se difumina rápidamente a negro
                // *** AJUSTADO: Stops para mayor contraste ***
                background: `radial-gradient(circle at center 10%, ${gradientCenterColor} 25%, ${gradientEdgeColor} 95%)`,
                // Asegura que el degradado cubra toda la pantalla
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                // *** IMPORTANTE: Asegúrate que el color de texto sea legible sobre negro ***
                // Si el texto principal se vuelve negro sobre fondo negro, necesitarás ajustar
                // los colores de Typography o MuiLink aquí o en el componente Login.
                // Por ejemplo, podrías forzar el color del texto del footer a blanco:
                // '& footer p': { color: 'white' } // (Esto es solo un ejemplo)
            }}
        >
            <CssBaseline />

            {/* Contenedor Principal del Login */}
            <Container
                component="main"
                maxWidth="xs"
                sx={{
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    px: 2.5,
                    py: 4,
                    zIndex: 1, // Asegura que el contenido esté sobre el fondo
                }}
            >
                {/* Stack para centrar logo y formulario */}
                <Stack spacing={4} alignItems="center" sx={{ width: '100%' }}>

                    {/* Logo y Título */}
                    <Stack
                        direction="column"
                        alignItems="center"
                        spacing={1}
                        component={RouterLink}
                        to="/"
                        sx={{ textDecoration: 'none', color: 'inherit' }}
                    >
                        <Box
                            component="img"
                            src="/logo ito.png"
                            alt="Logo InvestigApp"
                            sx={{
                                height: 60,
                                width: 'auto',
                                mb: 1,
                                // Opcional: Añadir un filtro si el logo se pierde en el fondo
                                // filter: 'drop-shadow(0 0 5px rgba(255, 255, 255, 0.7))'
                            }}
                        />
                    </Stack>

                    {/* Componente Login (sin su propio fondo de Paper) */}
                    {/* Los inputs blancos deberían resaltar bien sobre el fondo oscuro */}
                    <Login integrated />

                    {/* Enlace a Registro */}
                    <Box sx={{ textAlign: 'center', pt: 1 }}>
                        <Typography variant="body2" color="#FFFF"> {/* Podría necesitar ajuste */}
                            ¿Aún no tienes una cuenta?{' '}
                            <MuiLink
                                component={RouterLink}
                                to="/registro"
                                variant="body2"
                                sx={{
                                    fontWeight: 600,
                                    color: 'secondary.main', // Podría necesitar ajuste
                                    // color: 'secondary.main' // Amarillo podría resaltar bien
                                    '&:hover': {
                                        // color: 'secondary.light'
                                        color: 'secondary.dark', // Ajustar según el color base
                                    }
                                }}
                            >
                                Regístrate ahora
                            </MuiLink>
                        </Typography>
                    </Box>
                </Stack>
            </Container>

            {/* Footer (opcional) */}
            <Box
                component="footer"
                sx={{
                    py: 2,
                    px: 2,
                    bgcolor: 'transparent',
                    textAlign: 'center',
                    zIndex: 1, // Asegura que esté sobre el fondo
                }}
            >
                {/* *** AJUSTADO: Forzar color blanco para legibilidad sobre fondo negro *** */}
                <Typography variant="caption" sx={{ color: 'common.white' }}>
                    © {new Date().getFullYear()} Cronograma.
                </Typography>
            </Box>
        </Box>
    );
};

export default LoginPage;
