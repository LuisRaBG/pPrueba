// src/pages/AcceptInvitationPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
    Container, Box, Typography, TextField, Button, CircularProgress, Alert, Paper, Stack, Link as MuiLink, useTheme, alpha
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import * as equiposService from '../features/equipos/services/equiposService.js'; // Ajusta ruta
import { useAuth } from '../contexts/AuthContext.js'; // Para verificar si está logueado

const AcceptInvitationPage = () => {
    const theme = useTheme();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth(); // Verifica si el usuario está logueado

    const initialCode = searchParams.get('code') || '';
    const [invitationCode, setInvitationCode] = useState(initialCode);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [invitationDetails, setInvitationDetails] = useState(null); // Opcional: para mostrar detalles

    // Opcional: Cargar detalles de la invitación si hay código inicial
    const fetchDetails = useCallback(async (code) => {
        if (!code) return;
        setLoading(true);
        setError(null);
        try {
            const details = await equiposService.getInvitationDetails(code);
            setInvitationDetails(details);
        } catch (err) {
            setError(err.message || 'No se pudieron cargar los detalles de la invitación.');
            setInvitationDetails(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (initialCode) {
            fetchDetails(initialCode);
        }
    }, [initialCode, fetchDetails]);

    const handleAccept = async () => {
        if (!invitationCode) {
            setError('Por favor, ingresa un código de invitación.');
            return;
        }
        if (!isAuthenticated) {
             setError('Debes iniciar sesión o registrarte para aceptar una invitación.');
             // Opcional: Redirigir al login guardando la intención
             // navigate('/login', { state: { from: location } });
             return;
        }

        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const result = await equiposService.acceptInvitation(invitationCode);
            setSuccessMessage(result.message || '¡Te has unido al proyecto exitosamente!');
            setInvitationDetails(null); // Limpiar detalles después de aceptar
            // Opcional: Redirigir al dashboard o al proyecto después de un delay
            setTimeout(() => {
                // Podrías intentar navegar al proyecto específico si la respuesta lo incluye
                // const projectId = result.projectId;
                // navigate(projectId ? `/dashboard?project=${projectId}` : '/dashboard');
                navigate('/dashboard');
            }, 3000);
        } catch (err) {
            setError(err.message || 'No se pudo aceptar la invitación.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container component="main" maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
            <Paper elevation={3} sx={{ p: { xs: 3, sm: 5 }, borderRadius: '16px' }}>
                <Stack alignItems="center" spacing={2} sx={{ mb: 4 }}>
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
                        Aceptar Invitación
                    </Typography>
                    {!isAuthenticated && (
                         <Alert severity="warning" sx={{width: '100%'}}>
                            Necesitas <MuiLink component={RouterLink} to="/login" sx={{fontWeight: 'bold'}}>iniciar sesión</MuiLink> o <MuiLink component={RouterLink} to="/registro" sx={{fontWeight: 'bold'}}>registrarte</MuiLink> para unirte a un proyecto.
                         </Alert>
                    )}
                </Stack>

                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
                {successMessage && <Alert severity="success" sx={{ mb: 3 }}>{successMessage}</Alert>}

                {!successMessage && ( // Ocultar formulario después del éxito
                    <Box component="form" onSubmit={(e) => { e.preventDefault(); handleAccept(); }} noValidate>
                        <TextField
                            fullWidth
                            label="Código de Invitación"
                            value={invitationCode}
                            onChange={(e) => {
                                setInvitationCode(e.target.value);
                                if (error) setError(null); // Limpiar error al escribir
                                if (invitationDetails) setInvitationDetails(null); // Limpiar detalles si cambia el código
                            }}
                            margin="normal"
                            disabled={loading || !isAuthenticated}
                            required
                            autoFocus={!initialCode} // Autofocus si no viene código en URL
                        />

                        {/* Opcional: Mostrar detalles de la invitación */}
                        {loading && !invitationDetails && <CircularProgress size={24} sx={{ display: 'block', mx: 'auto', my: 2 }} />}
                        {invitationDetails && !loading && (
                            <Alert severity="info" icon={false} sx={{ my: 2, bgcolor: alpha(theme.palette.info.light, 0.1) }}>
                                <Typography variant="body2">
                                    Has sido invitado a unirte al proyecto <strong>{invitationDetails.proyectos?.nombre || '(Nombre no disponible)'}</strong> como <strong>{invitationDetails.rol_invitado || '(Rol no especificado)'}</strong>.
                                </Typography>
                                {invitationDetails.usuarios && (
                                     <Typography variant="caption" display="block" sx={{mt: 0.5}}>
                                        Invitado por: {invitationDetails.usuarios.nombre || invitationDetails.usuarios.email}
                                     </Typography>
                                )}
                            </Alert>
                        )}

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, py: 1.5 }}
                            disabled={loading || !invitationCode || !isAuthenticated || !!successMessage}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Aceptar Invitación'}
                        </Button>
                    </Box>
                )}

                 <Box sx={{ mt: 4, textAlign: 'center' }}>
                    <MuiLink component={RouterLink} to="/dashboard" variant="body2">
                        Volver al Dashboard
                    </MuiLink>
                </Box>
            </Paper>
        </Container>
    );
};

export default AcceptInvitationPage;
