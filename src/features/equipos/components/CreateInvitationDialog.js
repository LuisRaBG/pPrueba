// src/features/equipos/components/CreateInvitationDialog.js
import React, { useState, useCallback } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    FormControl, InputLabel, Select, MenuItem, Box, Alert,
    CircularProgress, Typography, TextField, IconButton, Tooltip, Link as MuiLink
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LinkIcon from '@mui/icons-material/Link';
import * as equiposService from '../services/equiposService.js'; // Ajusta ruta

const rolesInvitables = ['colaborador', 'observador']; // Roles que se pueden invitar

const CreateInvitationDialog = ({ open, onClose, idProyecto }) => {
    const [rol, setRol] = useState('colaborador');
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState(null);
    const [generatedCode, setGeneratedCode] = useState(null);
    const [invitationLink, setInvitationLink] = useState(null);

    const handleClose = useCallback(() => {
        setRol('colaborador');
        setError(null);
        setGeneratedCode(null);
        setInvitationLink(null);
        setGenerating(false);
        onClose();
    }, [onClose]);

    const handleGenerate = useCallback(async () => {
        setError(null);
        setGeneratedCode(null);
        setInvitationLink(null);
        setGenerating(true);
        try {
            const result = await equiposService.createInvitation(idProyecto, rol);
            const code = result.invitation_code;
            setGeneratedCode(code);
            // Construye el enlace (ajusta la ruta base según tu app)
            const link = `${window.location.origin}/invitations/accept?code=${code}`;
            setInvitationLink(link);
        } catch (err) {
            setError(err.message || 'Error al generar la invitación.');
        } finally {
            setGenerating(false);
        }
    }, [idProyecto, rol]);

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            // Opcional: Mostrar feedback de copiado
            console.log('Copiado al portapapeles:', text);
        }).catch(err => {
            console.error('Error al copiar:', err);
        });
    };

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
            <DialogTitle>Generar Invitación para Proyecto</DialogTitle>
            <DialogContent>
                <Box component="form" noValidate autoComplete="off" sx={{ mt: 1 }}>
                    {!generatedCode ? (
                        <>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                                Selecciona el rol para el nuevo miembro que se unirá con esta invitación.
                            </Typography>
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel id="rol-invite-label">Rol del Invitado</InputLabel>
                                <Select
                                    labelId="rol-invite-label"
                                    value={rol}
                                    label="Rol del Invitado"
                                    onChange={(e) => setRol(e.target.value)}
                                    disabled={generating}
                                >
                                    {rolesInvitables.map((r) => (
                                        <MenuItem key={r} value={r}>
                                            {r.charAt(0).toUpperCase() + r.slice(1)}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </>
                    ) : (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="body1" sx={{ mb: 1 }}>
                                ¡Invitación generada! Comparte este código o enlace:
                            </Typography>
                            <TextField
                                label="Código de Invitación"
                                value={generatedCode}
                                fullWidth
                                InputProps={{
                                    readOnly: true,
                                    endAdornment: (
                                        <Tooltip title="Copiar Código">
                                            <IconButton onClick={() => copyToClipboard(generatedCode)} size="small">
                                                <ContentCopyIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    )
                                }}
                                sx={{ mb: 1.5 }}
                            />
                             <TextField
                                label="Enlace de Invitación"
                                value={invitationLink}
                                fullWidth
                                InputProps={{
                                    readOnly: true,
                                    endAdornment: (
                                        <Tooltip title="Copiar Enlace">
                                            <IconButton onClick={() => copyToClipboard(invitationLink)} size="small">
                                                <LinkIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    )
                                }}
                                sx={{ mb: 1 }}
                            />
                             <MuiLink href={invitationLink} target="_blank" rel="noopener noreferrer" variant="caption">
                                Abrir enlace para probar (nueva pestaña)
                             </MuiLink>
                        </Box>
                    )}

                    {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                </Box>
            </DialogContent>
            <DialogActions sx={{ pb: 2, px: 3 }}>
                <Button onClick={handleClose}>
                    {generatedCode ? 'Cerrar' : 'Cancelar'}
                </Button>
                {!generatedCode && (
                    <Button
                        onClick={handleGenerate}
                        variant="contained"
                        disabled={generating}
                        startIcon={generating ? <CircularProgress size={20} color="inherit" /> : null}
                    >
                        {generating ? 'Generando...' : 'Generar Invitación'}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default CreateInvitationDialog;
