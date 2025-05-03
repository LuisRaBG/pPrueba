// src/features/equipos/components/EditRolDialog.js
import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Alert,
    CircularProgress,
    Typography
} from '@mui/material';

const rolesPermitidos = ['lider', 'colaborador', 'observador'];

const EditRolDialog = ({ open, onClose, onUpdate, miembro }) => {
    const [nuevoRol, setNuevoRol] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // Inicializa el rol cuando el miembro cambia o el diálogo se abre
    useEffect(() => {
        if (miembro) {
            setNuevoRol(miembro.rol);
            setError(null); // Limpia errores anteriores
        }
    }, [miembro]);

    // Solo cierra si no hay miembro o el diálogo no está abierto
    useEffect(() => {
        if (!open) {
            setSubmitting(false); // Asegura resetear submitting al cerrar
            setError(null);
        }
    }, [open]);


    const handleUpdateClick = async () => {
        if (!miembro || nuevoRol === miembro.rol) {
            onClose(); // No hay cambios, solo cierra
            return;
        }
        setError(null);
        setSubmitting(true);
        try {
            await onUpdate(miembro.id_proyecto, miembro.id_usuario, nuevoRol);
            onClose(); // Cierra si tiene éxito
        } catch (updateError) {
            setError(updateError.message || 'Error al actualizar el rol.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!miembro) return null; // No renderizar si no hay miembro

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
            <DialogTitle>Editar Rol</DialogTitle>
            <DialogContent>
                <Box component="form" noValidate autoComplete="off" sx={{ mt: 1 }}>
                    <Typography variant="subtitle1" gutterBottom>
                        Miembro: {miembro.nombre} ({miembro.email})
                    </Typography>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel id="edit-rol-select-label">Nuevo Rol</InputLabel>
                        <Select
                            labelId="edit-rol-select-label"
                            id="edit-rol-select"
                            value={nuevoRol}
                            label="Nuevo Rol"
                            onChange={(e) => setNuevoRol(e.target.value)}
                        >
                            {rolesPermitidos.map((r) => (
                                <MenuItem key={r} value={r}>
                                    {r.charAt(0).toUpperCase() + r.slice(1)}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={submitting}>Cancelar</Button>
                <Button
                    onClick={handleUpdateClick}
                    variant="contained"
                    disabled={nuevoRol === miembro.rol || submitting}
                    startIcon={submitting ? <CircularProgress size={20} /> : null}
                >
                    {submitting ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditRolDialog;
