// c:\Users\Prueb\Documents\projects\proyecto\src\features\projects\components\ProyectoEliminarDialog.js
import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    CircularProgress,
    Alert,
    Box,
} from '@mui/material';
import { useTheme } from '@mui/material/styles'; // Import useTheme

const ProyectoEliminarDialog = ({
    open,
    onClose,
    onConfirm,
    proyectoNombre,
    loading, // operationLoading del hook
    error,   // operationError del hook
}) => {
    const theme = useTheme(); // Get theme

    // Specific warning message check
    const isConflictError = error && error.toLowerCase().includes('tareas asociadas');

    return (
        <Dialog
            open={open}
            onClose={loading ? undefined : onClose} // Prevent closing while loading
            maxWidth="xs"
            fullWidth // Ensure it takes the full width of xs
            aria-labelledby="delete-confirm-dialog-title"
            PaperProps={{ sx: { borderRadius: theme.shape.borderRadius * 1.5 } }} // Consistent border radius
        >
            <DialogTitle id="delete-confirm-dialog-title">
                Confirmar Eliminación
            </DialogTitle>
            <DialogContent>
                 {/* Mostrar error de operación general si existe y NO es el de conflicto */}
                 {error && !isConflictError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                 )}
                <Typography variant="body1" sx={{ mb: isConflictError ? 2 : 0 }}> {/* Add margin bottom if conflict error follows */}
                    ¿Estás seguro de que deseas eliminar el proyecto "{proyectoNombre || 'seleccionado'}"?
                    <Typography component="span" fontWeight="bold" color="error"> Esta acción no se puede deshacer.</Typography>
                </Typography>
                 {/* Mostrar advertencia específica si el error es por conflicto */}
                 {isConflictError && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                        {/* Provide a more specific error message if possible */}
                        {error}. Primero debes eliminar o reasignar las tareas asociadas a este proyecto.
                    </Alert>
                 )}
            </DialogContent>
            <DialogActions sx={{ p: theme.spacing(2) }}> {/* Consistent padding */}
                <Button onClick={onClose} disabled={loading} color="inherit"> {/* Use inherit for cancel */}
                    Cancelar
                </Button>
                <Button
                    onClick={onConfirm}
                    color="error"
                    variant="contained"
                    disabled={loading || isConflictError} // Disable confirm also if it's a conflict error
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                >
                    {loading ? 'Eliminando...' : 'Eliminar'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ProyectoEliminarDialog;
