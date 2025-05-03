// src/features/equipos/components/EquipoManagementPanel.js
import React, { useState, useCallback } from 'react';
import {
    Drawer, Box, Typography, IconButton, Divider, CircularProgress, Alert, Button, Snackbar
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
// *** CAMBIADO: Icono para invitar ***
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import { useProject } from '../../../contexts/ProjectContext.js';
import * as equiposService from '../services/equiposService.js';
import EquipoList from './EquipoList.js';
// *** ELIMINADO: Ya no se usa AddMiembroDialog ***
// import AddMiembroDialog from './AddMiembroDialog.js';
// *** AÑADIDO: Importa el nuevo diálogo de invitación ***
import CreateInvitationDialog from './CreateInvitationDialog.js';
import EditRolDialog from './EditRolDialog.js';

const PANEL_WIDTH = 360;

const EquipoManagementPanel = ({ open, onClose, projectId }) => {
    const {
        currentProjectMembers,
        loadingMembers,
        errorMembers,
        refreshMembers
    } = useProject();

    // *** CAMBIADO: Estado para el diálogo de invitación ***
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [miembroParaEditar, setMiembroParaEditar] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    // operationLoading/Error ahora son más para Edit/Remove si se necesita feedback inmediato
    const [operationLoading, setOperationLoading] = useState(false);
    const [operationError, setOperationError] = useState(null);

    // --- Handlers para CRUD (Eliminado handleAddMiembro) ---
    const handleUpdateRol = async (proyectoId, usuarioId, nuevoRol) => {
        setOperationLoading(true);
        setOperationError(null);
        try {
            await equiposService.updateRolMiembro(proyectoId, usuarioId, nuevoRol);
            setSnackbar({ open: true, message: 'Rol actualizado.', severity: 'success' });
            refreshMembers();
        } catch (err) {
            console.error("Error en handleUpdateRol (Panel):", err);
            setOperationError(err.message || 'Error al actualizar rol.');
            setSnackbar({ open: true, message: err.message || 'Error al actualizar.', severity: 'error' });
            throw err;
        } finally {
            setOperationLoading(false);
        }
    };

    const handleRemoveMiembro = async (proyectoId, usuarioId) => {
        try {
            // Considera añadir confirmación aquí si no está en EquipoListItem
            await equiposService.removeMiembroEquipo(proyectoId, usuarioId);
            setSnackbar({ open: true, message: 'Miembro eliminado.', severity: 'success' });
            refreshMembers();
        } catch (err) {
            console.error("Error en handleRemoveMiembro (Panel):", err);
            setSnackbar({ open: true, message: err.message || 'Error al eliminar.', severity: 'error' });
        }
    };

    // --- Handlers para Diálogos ---
    const openEditDialog = (miembro) => {
        setMiembroParaEditar(miembro);
        setOperationError(null);
        setIsEditDialogOpen(true);
    };
    // *** CAMBIADO: Handler para cerrar diálogo de invitación ***
    const handleCloseInviteDialog = () => {
        setIsInviteDialogOpen(false);
    };
    const handleCloseEditDialog = () => {
        setOperationError(null);
        setIsEditDialogOpen(false);
        setMiembroParaEditar(null);
    };

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') return;
        setSnackbar({ ...snackbar, open: false });
    };

    return (
        <>
            <Drawer
                anchor="right"
                open={open}
                onClose={onClose}
                PaperProps={{
                    sx: {
                        width: PANEL_WIDTH,
                        boxSizing: 'border-box',
                        display: 'flex',
                        flexDirection: 'column',
                    }
                }}
            >
                {/* Header del Panel */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 2,
                        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                        flexShrink: 0,
                    }}
                >
                    <Typography variant="h6" component="div">
                        Gestionar Equipo
                    </Typography>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>

                {/* Contenido Principal del Panel */}
                <Box sx={{ p: 2, flexGrow: 1, overflowY: 'auto' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Proyecto ID: {projectId || 'N/A'}
                    </Typography>

                    {/* *** CAMBIADO: Botón para generar invitación *** */}
                    <Button
                        variant="contained"
                        startIcon={<PersonAddAlt1Icon />}
                        onClick={() => setIsInviteDialogOpen(true)}
                        disabled={loadingMembers || !projectId}
                        fullWidth
                        sx={{ mb: 2 }}
                    >
                        Generar Invitación
                    </Button>

                    {/* Resto del panel (Lista, errores, loading) sin cambios */}
                    {loadingMembers && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                            <CircularProgress />
                        </Box>
                    )}
                    {errorMembers && !loadingMembers && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {errorMembers}
                        </Alert>
                    )}
                    {!loadingMembers && !errorMembers && projectId && (
                        <EquipoList
                            miembros={currentProjectMembers}
                            onEditMiembro={openEditDialog}
                            onRemoveMiembro={handleRemoveMiembro}
                        />
                    )}
                     {!projectId && !loadingMembers && (
                         <Typography variant="body2" color="text.secondary" align="center" sx={{mt: 3}}>
                             Selecciona un proyecto para ver su equipo.
                         </Typography>
                     )}
                </Box>
            </Drawer>

            {/* Diálogos Modales */}
            {projectId && (
                <>
                    {/* *** CAMBIADO: Renderiza CreateInvitationDialog *** */}
                    <CreateInvitationDialog
                        open={isInviteDialogOpen}
                        onClose={handleCloseInviteDialog}
                        idProyecto={projectId}
                    />
                    {/* Diálogo de Editar Rol (sin cambios) */}
                    {miembroParaEditar && (
                        <EditRolDialog
                            open={isEditDialogOpen}
                            onClose={handleCloseEditDialog}
                            onUpdate={handleUpdateRol}
                            miembro={miembroParaEditar}
                            // Podrías pasar operationError si EditRolDialog lo maneja
                        />
                    )}
                </>
            )}

             {/* Snackbar (sin cambios) */}
             <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }} variant="filled">
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default EquipoManagementPanel;
