// src/pages/Registro.js
import React, { useState, useCallback } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
    Container,
    Box,
    Typography,
    TextField,
    Button,
    CircularProgress,
    Alert,
    Link as MuiLink,
    // AppBar, // Eliminado
    // Toolbar, // Eliminado
    Stack,
    CssBaseline,
    alpha,
    useTheme,
    // Avatar, // Eliminado
    IconButton,      // Añadido para el icono de contraseña
    InputAdornment, // Añadido para el icono de contraseña
} from '@mui/material';
// import PersonAddIcon from '@mui/icons-material/PersonAdd'; // Eliminado
import { Visibility, VisibilityOff } from '@mui/icons-material'; // Añadido
import AppRegistrationIcon from '@mui/icons-material/AppRegistration'; // Icono para el botón

import { registerUser } from '../features/auth/services/authService.js'; // Ajusta la ruta si es necesario

function RegistroPage() {
    const theme = useTheme(); // Necesitamos el tema para los estilos
    const [nombre, setNombre] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false); // Estado para mostrar/ocultar contraseña
    const [showConfirmPassword, setShowConfirmPassword] = useState(false); // Estado para mostrar/ocultar confirmación
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const navigate = useNavigate();

    // --- ESTILOS PARA LOS INPUTS (copiados de Login.js) ---
    // Asegúrate que estos estilos coincidan con los de Login.js
    const inputStyles = {
        bgcolor: theme.palette.background.paper, // Fondo blanco
        borderRadius: theme.shape.borderRadius,
        // Usaremos borde en lugar de sombra si el fondo es mayormente blanco
        // border: `1px solid ${theme.palette.divider}`,
        // O mantenemos la sombra si el fondo tiene partes oscuras donde resalte
        boxShadow: `0px 2px 4px ${alpha(theme.palette.common.black, 0.05)}`,
        '&:hover': {
            bgcolor: alpha(theme.palette.background.paper, 0.95),
            // borderColor: theme.palette.grey[400], // Si usas borde
            boxShadow: `0px 3px 6px ${alpha(theme.palette.common.black, 0.08)}`, // Si usas sombra
        },
        '&.Mui-focused': {
            bgcolor: theme.palette.background.paper,
            // borderColor: theme.palette.primary.main, // Si usas borde
            boxShadow: `0px 3px 8px ${alpha(theme.palette.common.black, 0.1)}`, // Si usas sombra
        },
         // Quitar líneas de 'filled'
         '&:before, &:after': {
             display: 'none',
         },
         // Si usas borde con 'filled'
        //  '.MuiFilledInput-root&:not(.Mui-focused):not(:hover)': {
        //      borderColor: theme.palette.divider,
        //  }
    };
    // --- FIN ESTILOS INPUTS ---

    // Handlers para mostrar/ocultar contraseñas
    const handleClickShowPassword = () => setShowPassword((show) => !show);
    const handleMouseDownPassword = (event) => event.preventDefault();
    const handleClickShowConfirmPassword = () => setShowConfirmPassword((show) => !show);
    const handleMouseDownConfirmPassword = (event) => event.preventDefault();


    const handleSubmit = useCallback(async (event) => {
        event.preventDefault();
        setError(null);
        setSuccess(null);

        if (!nombre || !email || !password || !confirmPassword) {
            setError('Todos los campos son obligatorios.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }
        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        setLoading(true);

        try {
            const additionalData = { nombre: nombre };
            const { user } = await registerUser(email, password, additionalData);
            const requiresConfirmation = !user.email_confirmed_at;

            if (requiresConfirmation) {
                setSuccess('¡Registro exitoso! Revisa tu correo electrónico para confirmar tu cuenta.');
                setTimeout(() => navigate('/login'), 5000);
            } else {
                setSuccess('¡Usuario registrado exitosamente! Redirigiendo al login...');
                setNombre(''); setEmail(''); setPassword(''); setConfirmPassword('');
                setTimeout(() => navigate('/login'), 2000);
            }
        } catch (err) {
            console.error("Error en el registro:", err);
            setError(err.message || 'No se pudo completar el registro. Inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    }, [nombre, email, password, confirmPassword, navigate]);

    // --- Colores del degradado (igual que LoginPage) ---
    const gradientCenterColor = '#FFFFFF'; // Blanco puro en el centro
    const gradientEdgeColor = '#1B396A';   // Azul oscuro en los bordes

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
                // --- FONDO RADIAL (igual que LoginPage) ---
                background: `radial-gradient(circle at center 10%, ${gradientCenterColor} 25%, ${gradientEdgeColor} 95%)`,
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
                backgroundColor: gradientEdgeColor, // Color de fallback
            }}
        >
            <CssBaseline />

            {/* Contenedor Principal (similar a LoginPage) */}
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
                    zIndex: 1,
                }}
            >
                {/* Stack para centrar logo y formulario */}
                <Stack spacing={4} alignItems="center" sx={{ width: '100%' }}>

                    {/* Logo y Título (igual que LoginPage) */}
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
                            src="/logo ito.png" // Asegúrate que la ruta sea correcta
                            alt="Logo InvestigApp"
                            sx={{
                                height: 60,
                                width: 'auto',
                                mb: 1,
                            }}
                        />
                        {/* Opcional: Puedes añadir el título "InvestigApp" si quieres */}
                        {/* <Typography variant="h5" noWrap sx={{...}}>InvestigApp</Typography> */}
                    </Stack>

                    {/* --- FORMULARIO DE REGISTRO INTEGRADO --- */}
                    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {/* Título del formulario */}
                        <Typography component="h1" variant="h5" sx={{ fontWeight: 600, mb: 3, color: 'common.white' /* Ajusta si es necesario */ }}>
                            Crear Nueva Cuenta
                        </Typography>

                        {/* Alertas */}
                        {error && (
                            <Alert severity="error" sx={{ width: '100%', mb: 2 }} onClose={() => setError(null)}>
                                {error}
                            </Alert>
                        )}
                        {success && (
                            <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
                                {success}
                            </Alert>
                        )}

                        {/* Formulario */}
                        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
                            <Stack spacing={2}> {/* Ajusta el espaciado si es necesario */}
                                <TextField
                                    required
                                    fullWidth
                                    id="nombre"
                                    label="Nombre Completo"
                                    name="nombre"
                                    autoComplete="name"
                                    autoFocus
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                    disabled={loading || !!success}
                                    variant="filled" // Usar filled para aplicar inputStyles
                                    InputProps={{
                                        disableUnderline: true,
                                        sx: inputStyles
                                    }}
                                    InputLabelProps={{ sx: {} }}
                                />
                                <TextField
                                    required
                                    fullWidth
                                    id="email"
                                    label="Correo Electrónico"
                                    name="email"
                                    autoComplete="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={loading || !!success}
                                    variant="filled"
                                    InputProps={{
                                        disableUnderline: true,
                                        sx: inputStyles
                                    }}
                                    InputLabelProps={{ sx: {} }}
                                />
                                <TextField
                                    required
                                    fullWidth
                                    name="password"
                                    label="Contraseña"
                                    type={showPassword ? 'text' : 'password'}
                                    id="password"
                                    autoComplete="new-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading || !!success}
                                    helperText="Mínimo 6 caracteres"
                                    variant="filled"
                                    InputProps={{
                                        disableUnderline: true,
                                        sx: inputStyles,
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    aria-label="toggle password visibility"
                                                    onClick={handleClickShowPassword}
                                                    onMouseDown={handleMouseDownPassword}
                                                    edge="end"
                                                    size="medium"
                                                    sx={{ mr: 0.5, color: 'text.secondary' }}
                                                >
                                                    {showPassword ? <VisibilityOff fontSize="inherit"/> : <Visibility fontSize="inherit"/>}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                    InputLabelProps={{ sx: {} }}
                                    FormHelperTextProps={{ sx: { color: 'grey.400' } }} // Ajusta color del helper text
                                />
                                <TextField
                                    required
                                    fullWidth
                                    name="confirmPassword"
                                    label="Confirmar Contraseña"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    id="confirmPassword"
                                    autoComplete="new-password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={loading || !!success}
                                    error={!!confirmPassword && password !== confirmPassword}
                                    helperText={!!confirmPassword && password !== confirmPassword ? "Las contraseñas no coinciden" : ""}
                                    variant="filled"
                                    InputProps={{
                                        disableUnderline: true,
                                        sx: inputStyles,
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    aria-label="toggle confirm password visibility"
                                                    onClick={handleClickShowConfirmPassword}
                                                    onMouseDown={handleMouseDownConfirmPassword}
                                                    edge="end"
                                                    size="medium"
                                                    sx={{ mr: 0.5, color: 'text.secondary' }}
                                                >
                                                    {showConfirmPassword ? <VisibilityOff fontSize="inherit"/> : <Visibility fontSize="inherit"/>}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                    InputLabelProps={{ sx: {} }}
                                    FormHelperTextProps={{ sx: { color: password !== confirmPassword ? 'error.light' : 'grey.400' } }} // Ajusta color del helper text
                                />
                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    color="secondary" // Mismo color que el botón de Login
                                    sx={{
                                        mt: 1, // Ajusta margen superior
                                        py: 1.5, // Mismo padding que Login
                                        fontWeight: 700, // Mismo peso
                                        fontSize: '0.95rem', // Mismo tamaño
                                        borderRadius: theme.shape.borderRadius * 1.5, // Mismo borde
                                        color: '#FFF' // Asegura contraste
                                    }}
                                    disabled={loading || !!success}
                                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AppRegistrationIcon />}
                                >
                                    {loading ? 'Registrando...' : 'Registrarme'}
                                </Button>
                            </Stack>
                        </Box>
                    </Box>
                    {/* --- FIN FORMULARIO INTEGRADO --- */}

                    {/* Enlace a Login (igual que LoginPage) */}
                    <Box sx={{ textAlign: 'center', pt: 1 }}>
                        <Typography variant="body2" sx={{ color: 'common.white' }}> {/* Ajustado a blanco */}
                            ¿Ya tienes una cuenta?{' '}
                            <MuiLink
                                component={RouterLink}
                                to="/login"
                                variant="body2"
                                sx={{
                                    fontWeight: 600,
                                    color: 'secondary.main', // Amarillo resalta bien
                                    '&:hover': {
                                        color: 'secondary.light', // Amarillo más claro en hover
                                    }
                                }}
                            >
                                Inicia Sesión
                            </MuiLink>
                        </Typography>
                    </Box>
                </Stack>
            </Container>

            {/* Footer (igual que LoginPage) */}
            <Box
                component="footer"
                sx={{
                    py: 2,
                    px: 2,
                    bgcolor: 'transparent',
                    textAlign: 'center',
                    zIndex: 1,
                }}
            >
                <Typography variant="caption" sx={{ color: 'common.white' }}>
                    © {new Date().getFullYear()} Cronograma.
                </Typography>
                {/* Puedes añadir los enlaces de privacidad/términos si quieres, ajustando el color */}
                {/* <MuiLink ... sx={{ color: 'grey.400', ... }}>Privacidad</MuiLink> */}
            </Box>
        </Box>
    );
}

export default RegistroPage;
