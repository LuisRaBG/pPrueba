// src/pages/GestionEquiposPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
    Container,
    Typography,
    Box,
    Button,
    CircularProgress,
    Alert,
    Snackbar
} from '@mui/material';
// *** CAMBIADO: Icono para invitar ***
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import EquipoList from '../features/equipos/components/EquipoList.js';
// *** ELIMINADO: Ya no se usa AddMiembroDialog ***
// import AddMiembroDialog from '../features/equipos/components/AddMiembroDialog.js';
// *** AÑADIDO: Importa el nuevo diálogo de invitación ***
import CreateInvitationDialog from '../features/equipos/components/CreateInvitationDialog.js';
import EditRolDialog from '../features/equipos/components/EditRolDialog.js';
import * as equiposService from '../features/equipos/services/equiposService.js';
import { useProject } from '../contexts/ProjectContext.js';

const GestionEquiposPage = () => {
    const { idProyecto: idProyectoParam } = useParams();
    // *** IMPORTANTE: Asegúrate que idProyecto sea STRING (UUID) si usas UUIDs en Supabase ***
    // Si idProyectoParam es un UUID, no necesitas parseInt. Si es número, mantenlo.
    // const idProyecto = parseInt(idProyectoParam, 10); // Si usas IDs numéricos
    const idProyecto = idProyectoParam; // Si usas UUIDs (string)

    const { setCurrentProjectId, refreshMembers: refreshMembersFromContext } = useProject();

    const [miembros, setMiembros] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // *** CAMBIADO: Estado para el diálogo de invitación ***
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [miembroParaEditar, setMiembroParaEditar] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Efecto para actualizar el contexto del proyecto
    useEffect(() => {
        // *** Ajusta la validación si usas UUIDs ***
        // const isValidId = idProyecto && !isNaN(idProyecto); // Para IDs numéricos
        const isValidId = typeof idProyecto === 'string' && idProyecto.length > 0; // Para UUIDs (string)

        if (isValidId) {
            console.log(`GestionEquiposPage: Setting current project ID to ${idProyecto}`);
            setCurrentProjectId(idProyecto);
        } else {
             console.log("GestionEquiposPage: Invalid or missing project ID, clearing context.");
             setCurrentProjectId(null);
        }
        // No es necesario limpiar al desmontar si el contexto se maneja bien en otros lugares
        // return () => {
        //     console.log("GestionEquiposPage: Unmounting, clearing current project ID.");
        //     setCurrentProjectId(null);
        // };
    }, [idProyecto, setCurrentProjectId]);


    // Función para cargar miembros
    const cargarMiembros = useCallback(async () => {
        // *** Ajusta la validación si usas UUIDs ***
        // const isValidId = idProyecto && !isNaN(idProyecto); // Para IDs numéricos
        const isValidId = typeof idProyecto === 'string' && idProyecto.length > 0; // Para UUIDs (string)

        if (!isValidId) {
            setError("ID de proyecto inválido.");
            setLoading(false);
            setMiembros([]);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const data = await equiposService.fetchMiembrosProyecto(idProyecto);
            setMiembros(data);
            if (typeof refreshMembersFromContext === 'function') {
                refreshMembersFromContext();
            }
        } catch (err) {
            setError(err.message || 'Error al cargar los miembros del equipo.');
            setMiembros([]);
        } finally {
            setLoading(false);
        }
    }, [idProyecto, refreshMembersFromContext]);

    // Carga inicial
    useEffect(() => {
         // *** Ajusta la validación si usas UUIDs ***
        // const isValidId = idProyecto && !isNaN(idProyecto); // Para IDs numéricos
        const isValidId = typeof idProyecto === 'string' && idProyecto.length > 0; // Para UUIDs (string)
        if (isValidId) {
            cargarMiembros();
        }
    }, [cargarMiembros, idProyecto]);

    // --- Handlers para acciones CRUD ---

    // *** ELIMINADO: handleAddMiembro ya no se usa ***
    // const handleAddMiembro = useCallback(async (proyectoId, usuarioId, rol) => { ... });

    const handleUpdateRol = useCallback(async (proyectoId, usuarioId, nuevoRol) => {
        if (proyectoId !== idProyecto) {
            throw new Error("Discrepancia en el ID del proyecto.");
        }
        try {
            await equiposService.updateRolMiembro(proyectoId, usuarioId, nuevoRol);
            setSnackbar({ open: true, message: 'Rol actualizado exitosamente.', severity: 'success' });
            cargarMiembros();
        } catch (err) {
            console.error("Error en handleUpdateRol:", err);
            setSnackbar({ open: true, message: err.message || 'Error al actualizar rol.', severity: 'error' });
            throw err;
        }
    }, [idProyecto, cargarMiembros]);

    const handleRemoveMiembro = useCallback(async (proyectoId, usuarioId) => {
        if (proyectoId !== idProyecto) {
             console.error("Discrepancia en el ID del proyecto al intentar eliminar.");
             setSnackbar({ open: true, message: 'Error interno al intentar eliminar.', severity: 'error' });
             return;
        }
        try {
            // Considera añadir un diálogo de confirmación aquí si no está en EquipoListItem
             if (!window.confirm(`¿Estás seguro de que quieres eliminar a este miembro del equipo?`)) {
                 return;
             }
            await equiposService.removeMiembroEquipo(proyectoId, usuarioId);
            setSnackbar({ open: true, message: 'Miembro eliminado exitosamente.', severity: 'success' });
            cargarMiembros();
        } catch (err) {
            console.error("Error en handleRemoveMiembro:", err);
            setError(err.message || 'Error al eliminar miembro.');
            setSnackbar({ open: true, message: err.message || 'Error al eliminar miembro.', severity: 'error' });
        }
    }, [idProyecto, cargarMiembros]);

    // --- Handlers para Diálogos ---
    const openEditDialog = useCallback((miembro) => {
        setMiembroParaEditar(miembro);
        setIsEditDialogOpen(true);
    }, []);

    // *** CAMBIADO: Handler para cerrar diálogo de invitación ***
    const handleCloseInviteDialog = () => {
        setIsInviteDialogOpen(false);
    };
     const handleCloseEditDialog = () => {
        setIsEditDialogOpen(false);
        // Es buena práctica limpiar el estado al cerrar
        setTimeout(() => setMiembroParaEditar(null), 300); // Delay para transición
    };

    const handleCloseSnackbar = useCallback((event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setSnackbar(prev => ({ ...prev, open: false }));
    }, []);

    // --- Renderizado ---
     // *** Ajusta la validación si usas UUIDs ***
    // const isValidId = idProyecto && !isNaN(idProyecto); // Para IDs numéricos
    const isValidId = typeof idProyecto === 'string' && idProyecto.length > 0; // Para UUIDs (string)

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Gestión de Equipo del Proyecto {isValidId ? '' : '(Inválido)'}
                {/* Opcional: Mostrar nombre del proyecto si lo tienes */}
            </Typography>
             {isValidId && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>ID: {idProyecto}</Typography>}


            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                 {/* *** CAMBIADO: Botón para generar invitación *** */}
                <Button
                    variant="contained"
                    startIcon={<PersonAddAlt1Icon />}
                    onClick={() => setIsInviteDialogOpen(true)}
                    disabled={loading || !!error || !isValidId}
                >
                    Generar Invitación
                </Button>
            </Box>

            {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <CircularProgress />
                </Box>
            )}

            {error && !loading && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error} {isValidId && <Button onClick={cargarMiembros} size="small">Reintentar</Button>}
                </Alert>
            )}

            {!loading && !error && isValidId && (
                 miembros.length > 0 ? (
                    <EquipoList
                        miembros={miembros}
                        onEditMiembro={openEditDialog}
                        // Pasar idProyecto explícitamente si EquipoList lo necesita
                        onRemoveMiembro={(usuarioId) => handleRemoveMiembro(idProyecto, usuarioId)}
                    />
                 ) : (
                    <Typography sx={{ mt: 3, textAlign: 'center', color: 'text.secondary' }}>
                        Este proyecto aún no tiene miembros asignados. ¡Genera una invitación para añadir!
                    </Typography>
                 )
            )}
             {!loading && !error && !isValidId && (
                 <Typography sx={{ mt: 3, textAlign: 'center', color: 'text.secondary' }}>
                     No se ha especificado un ID de proyecto válido en la URL.
                 </Typography>
             )}


            {/* Diálogos */}
            {isValidId && (
                <>
                    {/* *** CAMBIADO: Renderiza CreateInvitationDialog *** */}
                    <CreateInvitationDialog
                        open={isInviteDialogOpen}
                        onClose={handleCloseInviteDialog}
                        idProyecto={idProyecto}
                    />
                    {/* Diálogo de Editar Rol */}
                    {miembroParaEditar && (
                        <EditRolDialog
                            open={isEditDialogOpen}
                            onClose={handleCloseEditDialog}
                            onUpdate={handleUpdateRol}
                            miembro={miembroParaEditar}
                        />
                    )}
                </>
            )}

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }} variant="filled">
                    {snackbar.message}
                </Alert>
            </Snackbar>

        </Container>
    );
};

export default GestionEquiposPage;
