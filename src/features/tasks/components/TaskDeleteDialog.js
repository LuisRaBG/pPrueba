// src/features/tasks/components/TaskDeleteDialog.js
import React from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Typography, CircularProgress, Alert, Box // Added Box for potential future use
} from '@mui/material';
import { useTheme } from '@mui/material/styles'; // Import useTheme

const TaskDeleteDialog = ({
    open,
    onClose,
    onConfirm,
    taskTitle,
    loading, // operationLoading del hook
    error,   // operationError del hook
}) => {
    const theme = useTheme(); // Get theme

    return (
        <Dialog
            open={open}
            onClose={loading ? undefined : onClose} // Prevent closing while loading
            maxWidth="xs"
            fullWidth // Ensure it takes the full width of xs
            aria-labelledby="task-delete-dialog-title"
            PaperProps={{ sx: { borderRadius: theme.shape.borderRadius * 1.5 } }} // Consistent border radius
        >
            <DialogTitle id="task-delete-dialog-title">
                Confirmar Eliminación
            </DialogTitle>
            <DialogContent>
                 {/* Mostrar error de operación si existe */}
                 {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                 )}
                <Typography variant="body1"> {/* Use body1 for standard text */}
                    ¿Estás seguro de que deseas eliminar la tarea "{taskTitle || 'seleccionada'}"?
                </Typography>
            </DialogContent>
            <DialogActions sx={{ p: theme.spacing(2) }}> {/* Consistent padding */}
                <Button onClick={onClose} disabled={loading} color="inherit"> {/* Use inherit for cancel */}
                    Cancelar
                </Button>
                <Button
                    onClick={onConfirm}
                    color="error"
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                >
                    {loading ? 'Eliminando...' : 'Eliminar'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default TaskDeleteDialog;
