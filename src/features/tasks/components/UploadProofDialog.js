// c:\Users\Prueb\Documents\projects\proyecto\src\features\tasks\components\UploadProofDialog.js
import React from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Typography, IconButton, Stack, Box, Alert, CircularProgress, useTheme, alpha, Link
} from '@mui/material';
import {
    Close as CloseIcon,
    FolderOpenOutlined as FolderIcon,
    AttachFile as AttachFileIcon,
    Link as LinkIcon
} from '@mui/icons-material';
import DocumentUpload from '../../schedule/components/DocumentUpload.js'; // Ajusta la ruta si es necesario

const UploadProofDialog = ({
    open,
    onClose,
    task, // La tarea para la cual se sube la prueba
    onSuccess, // Será handleProofUploadSuccess del hook useTareas
    loading, // operationLoading del hook useTareas
    error,   // operationError del hook useTareas
}) => {
    const theme = useTheme();

    if (!open || !task) {
        return null;
    }

    const handleDialogClose = (event, reason) => {
        // Prevenir cierre si está cargando (opcional, pero bueno)
        if (loading && reason === 'backdropClick') {
            return;
        }
        if (!loading) {
            onClose();
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleDialogClose}
            fullWidth
            maxWidth="sm" // Puede ser 'xs' si prefieres más pequeño
            aria-labelledby="upload-proof-dialog-title"
        >
            <DialogTitle
                sx={{
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    py: 1.5, px: 2.5
                }}
                id="upload-proof-dialog-title"
            >
                <Stack direction="row" spacing={1} alignItems="center">
                     <FolderIcon color="action" />
                     <Typography variant="h6" fontWeight="600">
                         Adjuntar Prueba de Entrega
                     </Typography>
                </Stack>
                <IconButton onClick={onClose} size="small" disabled={loading} aria-label="Cerrar diálogo">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ px: theme.spacing(3), py: theme.spacing(2) }}>
                {/* Mostrar error de operación si existe */}
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Typography variant="body1" sx={{ mb: 1 }}>
                    Para la tarea: <strong>{task.titulo || 'Tarea sin título'}</strong>
                </Typography>

                {/* Muestra si ya hay un archivo adjunto */}
                {task.ruta_prueba_entrega ? (
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2, p: 1, bgcolor: alpha(theme.palette.success.light, 0.1), borderRadius: 1 }}>
                        <AttachFileIcon color="success" fontSize="small" />
                        <Typography variant="body2" color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            Prueba actual: {task.ruta_prueba_entrega.split('/').pop()}
                        </Typography>
                        {/* Podrías añadir un enlace para verla si tienes esa funcionalidad */}
                        {/* <Link href={getViewUrl(task.ruta_prueba_entrega)} target="_blank" rel="noopener noreferrer"><LinkIcon fontSize="small" /></Link> */}
                    </Stack>
                ) : (
                     <Typography variant="caption" color="text.disabled" sx={{ mb: 2, display: 'block' }}>No se ha adjuntado ninguna prueba aún.</Typography>
                )}

                {/* Componente de subida */}
                <DocumentUpload
                    contextType="tarea" // Especifica que es para una tarea
                    contextId={task.id_tarea} // Pasa el ID de la tarea
                    onUploadSuccess={onSuccess} // Pasa el handler del hook
                    // Puedes pasar un handler de error específico si quieres manejarlo aquí también
                    onUploadError={(err) => console.error("Error subiendo prueba:", err)}
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {task.ruta_prueba_entrega ? 'Sube un nuevo archivo para reemplazar el existente.' : 'Sube un archivo (foto, PDF, etc.) como evidencia.'}
                </Typography>

            </DialogContent>
            <DialogActions sx={{ p: theme.spacing(2), borderTop: `1px solid ${theme.palette.divider}` }}>
                {/* Mostrar indicador de carga si la operación principal está en curso */}
                {loading && <CircularProgress size={24} sx={{ mr: 2 }} />}
                <Button onClick={onClose} disabled={loading} color="inherit">
                    Cerrar
                </Button>
                {/* No necesitamos un botón de "Guardar" aquí, DocumentUpload maneja la subida */}
            </DialogActions>
        </Dialog>
    );
};

export default UploadProofDialog;
