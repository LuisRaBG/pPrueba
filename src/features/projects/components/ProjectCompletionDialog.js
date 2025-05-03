// src/features/projects/components/ProjectCompletionDialog.js
import React from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Typography, Box, CircularProgress, Stack
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

const ProjectCompletionDialog = ({
    open,
    onClose,
    onConfirmCompletion,
    onKeepActive,
    projectName,
    loading = false // Añadir prop de loading
}) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ pb: 1 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <CheckCircleOutlineIcon color="success" />
                    <Typography variant="h6">¡Todas las tareas completadas!</Typography>
                </Stack>
            </DialogTitle>
            <DialogContent>
                <Typography variant="body1" gutterBottom>
                    Todas las tareas del proyecto "<strong>{projectName || 'este proyecto'}</strong>" han sido marcadas como completadas.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    ¿Deseas marcar el proyecto como finalizado o mantenerlo activo por si necesitas añadir más tareas después?
                </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
                {/* Botón Mantener Activo */}
                <Button
                    onClick={onKeepActive}
                    variant="outlined"
                    color="secondary" // O 'inherit'
                    disabled={loading}
                    startIcon={<HelpOutlineIcon />}
                >
                    Mantener Activo
                </Button>
                {/* Botón Finalizar Proyecto */}
                <Box sx={{ position: 'relative', ml: 1 }}> {/* Wrapper para el spinner */}
                    <Button
                        onClick={onConfirmCompletion}
                        variant="contained"
                        color="primary" // O 'success'
                        disabled={loading}
                        startIcon={<CheckCircleOutlineIcon />}
                    >
                        Marcar como Finalizado
                    </Button>
                    {loading && (
                        <CircularProgress
                            size={24}
                            sx={{
                                color: 'primary.main',
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                marginTop: '-12px',
                                marginLeft: '-12px',
                            }}
                        />
                    )}
                </Box>
            </DialogActions>
        </Dialog>
    );
};

export default ProjectCompletionDialog;
