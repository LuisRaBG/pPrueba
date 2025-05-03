// src/features/equipos/components/AcceptInvitationDialog.js
import React, { useState, useCallback } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    TextField, CircularProgress, Alert, Stack, Typography, Box, IconButton
} from '@mui/material';
import InputAdornment from '@mui/material/InputAdornment';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import { useNavigate } from 'react-router-dom';
import * as equiposService from '../services/equiposService.js'; // Ajusta la ruta
import { useAuth } from '../../../contexts/AuthContext.js'; // Ajusta la ruta

const AcceptInvitationDialog = ({ open, onClose }) => {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [invitationCode, setInvitationCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            setInvitationCode(text.trim());
            setError(null); // Limpiar error al pegar
        } catch (err) {
            console.error('Failed to read clipboard contents: ', err);
            setError('No se pudo pegar desde el portapapeles.');
        }
    };

    const handleAccept = useCallback(async () => {
        if (!invitationCode) {
            setError('Por favor, ingresa o pega un código de invitación.');
            return;
        }
        if (!isAuthenticated) {
            setError('Debes iniciar sesión para unirte a un proyecto.');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const result = await equiposService.acceptInvitation(invitationCode);
            setSuccessMessage(result.message || '¡Te has unido al proyecto exitosamente!');
            setInvitationCode(''); // Limpiar campo
            // Opcional: Cerrar diálogo y refrescar datos o navegar
            setTimeout(() => {
                onClose(); // Cierra el diálogo
                // Podrías querer refrescar la lista de proyectos aquí
                // navigate(0); // O simplemente recargar la página actual
                navigate('/dashboard'); // O navegar al dashboard
            }, 2500); // Tiempo para leer el mensaje de éxito
        } catch (err) {
            setError(err.message || 'No se pudo aceptar la invitación.');
        } finally {
            setLoading(false);
        }
    }, [invitationCode, isAuthenticated, navigate, onClose]);

    // Limpiar estado cuando se cierra el diálogo
    const handleCloseDialog = () => {
        setInvitationCode('');
        setError(null);
        setSuccessMessage(null);
        setLoading(false);
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleCloseDialog} maxWidth="xs" fullWidth>
            <DialogTitle>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <VpnKeyIcon />
                    <Typography variant="h6">Unirse a un Proyecto</Typography>
                </Stack>
            </DialogTitle>
            <DialogContent dividers>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    {!isAuthenticated && (
                        <Alert severity="warning">Debes iniciar sesión para usar un código.</Alert>
                    )}
                    {error && <Alert severity="error">{error}</Alert>}
                    {successMessage && <Alert severity="success">{successMessage}</Alert>}

                    <Typography variant="body2" color="text.secondary">
                        Ingresa el código de invitación que recibiste para unirte al equipo del proyecto.
                    </Typography>
                    <TextField
                        fullWidth
                        label="Código de Invitación"
                        value={invitationCode}
                        onChange={(e) => {
                            setInvitationCode(e.target.value.trim());
                            if (error) setError(null);
                        }}
                        margin="dense"
                        disabled={loading || !!successMessage || !isAuthenticated}
                        required
                        autoFocus
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="pegar código"
                                        onClick={handlePaste}
                                        edge="end"
                                        title="Pegar desde portapapeles"
                                        disabled={loading || !!successMessage || !isAuthenticated}
                                    >
                                        <ContentPasteIcon />
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={handleCloseDialog} disabled={loading}>Cancelar</Button>
                <Button
                    onClick={handleAccept}
                    variant="contained"
                    disabled={loading || !invitationCode || !!successMessage || !isAuthenticated}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                >
                    Unirme al Proyecto
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AcceptInvitationDialog;
