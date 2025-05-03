// src/features/auth/components/Login.js
import React, { useState } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { loginUser } from '../services/authService.js';
import {
    TextField,
    Button,
    Alert,
    Box,
    Typography,
    CircularProgress,
    // *** ELIMINADO: Avatar ya no se usa ***
    // Avatar,
    Link as MuiLink,
    Paper,
    Fade,
    useTheme,
    IconButton,
    InputAdornment,
    Stack,
    alpha,
} from '@mui/material';
import {
    // *** ELIMINADO: LockIcon ya no se usa ***
    // LockOutlined as LockIcon,
    Visibility, VisibilityOff,
    Login as LoginIcon
} from '@mui/icons-material';

// Añadimos la prop 'integrated'
const Login = ({ integrated = false }) => {
    const theme = useTheme();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || "/dashboard";

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (error) setError('');
    };

    const handleClickShowPassword = () => setShowPassword((show) => !show);
    const handleMouseDownPassword = (event) => event.preventDefault();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!formData.email || !formData.password) {
            setError('Por favor, completa el correo electrónico y la contraseña.');
            return;
        }
        setIsLoading(true);
        try {
            await loginUser(formData.email, formData.password);
            navigate(from, { replace: true });
        } catch (err) {
            console.error("Login Error:", err);
            setError(err.message || 'Credenciales incorrectas o error inesperado.');
        } finally {
            setIsLoading(false);
        }
    };

    // --- ESTILOS PARA EL CONTENEDOR PRINCIPAL ---
    const containerStyles = integrated ? {
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    } : {
        width: '100%',
        p: { xs: 3, sm: 4 },
        borderRadius: `${theme.shape.borderRadius * 1.66}px`,
        bgcolor: 'background.paper',
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: `0px 8px 24px ${alpha(theme.palette.grey[500], 0.12)}`,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        overflow: 'hidden',
        '&:before': {
            content: '""',
            position: 'absolute',
            top: -1, left: -1, right: -1, bottom: -1,
            borderRadius: `${theme.shape.borderRadius * 1.66}px`,
            border: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            zIndex: -1,
            pointerEvents: 'none',
        }
    };

    // --- ESTILOS PARA LOS INPUTS ---
    const inputStyles = {
        bgcolor: theme.palette.background.paper,
        borderRadius: theme.shape.borderRadius,
        boxShadow: `0px 2px 4px ${alpha(theme.palette.common.black, 0.05)}`,
        '&:hover': {
            bgcolor: alpha(theme.palette.background.paper, 0.95),
             boxShadow: `0px 3px 6px ${alpha(theme.palette.common.black, 0.08)}`,
        },
        '&.Mui-focused': {
            bgcolor: theme.palette.background.paper,
            boxShadow: `0px 3px 8px ${alpha(theme.palette.common.black, 0.1)}`,
        },
         '&:before, &:after': {
             display: 'none',
         },
    };

    const RootComponent = integrated ? Box : Paper;

    return (
        <Fade in={true} timeout={800}>
            <RootComponent
                elevation={integrated ? 0 : undefined}
                sx={containerStyles}
            >
                {/* *** ELIMINADO: Avatar con LockIcon *** */}
                {/* <Avatar sx={{ ... }}> <LockIcon /> </Avatar> */}

                {/* Título y Subtítulo */}
                {/* *** AJUSTADO: Aumentado margen inferior del título *** */}
                <Typography component="h1" variant="h5" sx={{
                    fontWeight: 600,
                    mb: 2, // Aumentado de 1 a 2
                    color: 'text.primary',
                    textAlign: 'center' // Asegura centrado si no hay Avatar
                }}>
                    ACCESO SEGURO
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{
                    mb: 3,
                    textAlign: 'center' // Asegura centrado
                }}>
                    
                </Typography>

                {/* Alerta de error */}
                {error && (
                    <Alert
                        severity="error"
                        sx={{ mb: 2.5, width: '100%' }}
                        onClose={() => setError('')}
                        aria-live="assertive"
                        variant="filled"
                    >
                        {error}
                    </Alert>
                )}

                {/* Formulario */}
                <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100%' }}>
                    <Stack spacing={2}>
                        {/* TextField Email */}
                        <TextField
                            fullWidth
                            required
                            id="email"
                            label="Correo Electrónico"
                            name="email"
                            type="email"
                            autoComplete="email"
                            autoFocus
                            value={formData.email}
                            onChange={handleChange}
                            disabled={isLoading}
                            variant="filled"
                            InputProps={{
                                disableUnderline: true,
                                sx: inputStyles
                            }}
                            InputLabelProps={{ sx: {} }}
                        />
                        {/* TextField Password */}
                        <TextField
                            fullWidth
                            required
                            id="password"
                            name="password"
                            label="Contraseña"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            value={formData.password}
                            onChange={handleChange}
                            disabled={isLoading}
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
                        />
                        {/* Enlace Olvidaste Contraseña */}
                        <Box sx={{ textAlign: 'right', mt: -1, mb: 1.5 }}>
                            <MuiLink
                                component={RouterLink}
                                to="/forgot-password"
                                variant="body2"
                                sx={{
                                    color: '#FFFF',
                                    fontWeight: 600,
                                    textDecoration: 'none',
                                    position: 'relative',
                                     '&:after': {
                                         content: '""',
                                         position: 'absolute',
                                         bottom: -2,
                                         left: 0,
                                         display: 'block',
                                         width: '0%',
                                         height: '2px',
                                         transition: 'width 0.3s ease'
                                     },
                                     '&:hover:after': {
                                         width: '100%'
                                     }
                                }}
                            >
                                Recuperar Acceso
                            </MuiLink>
                        </Box>

                        {/* Botón Principal */}
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            color="secondary"
                            size="large"
                            sx={{
                                py: 1.5,
                                fontWeight: 700,
                                fontSize: '0.95rem',
                                borderRadius: theme.shape.borderRadius * 1.5,
                                color: '#FFFF'
                            }}
                            disabled={isLoading || !formData.email || !formData.password}
                            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
                        >
                            {isLoading ? 'Accediendo...' : 'Acceder al Sistema'}
                        </Button>
                    </Stack>
                </Box>

            </RootComponent>
        </Fade>
    );
};

export default Login;
