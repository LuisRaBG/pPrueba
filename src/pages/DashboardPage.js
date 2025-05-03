// src/pages/DashboardPage.js
import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Button, alpha, Fab, Divider, CircularProgress, Alert, Stack
} from '@mui/material';
// Quitar AddIcon si no se usa el FAB
// import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom'; // Solo useNavigate
import ProyectoFormulario from '../features/projects/components/ProyectoFormulario.js';
import ProyectoEliminarDialog from '../features/projects/components/ProyectoEliminarDialog.js';
import ProjectCompletionDialog from '../features/projects/components/ProjectCompletionDialog.js'; // Se mantiene si se dispara desde aquí
import EquipoManagementPanel from '../features/equipos/components/EquipoManagementPanel.js';
import GeneralView from '../features/schedule/components/GeneralView.js';
import ActivityLogDetailDialog from '../features/schedule/components/ActivityLogDetailDialog.js';
import UploadProofDialog from '../features/tasks/components/UploadProofDialog.js'; // <-- Importar el diálogo

// Hooks
import useProyectos from '../features/projects/hooks/useProjects.js';
// *** AÑADIDO (Opcional): Importar useTareas si necesitas su loading/error/handler para el diálogo ***
import { useTareas } from '../features/tasks/hooks/useTareas.js';
import { useActivityLog } from '../hooks/useActivityLog.js'; // Solo para log global
import { useAuth } from '../contexts/AuthContext.js';
import { useTheme } from '@mui/material';
import { useProject } from '../contexts/ProjectContext.js';


const DashboardPage = () => {
    // eslint-disable-next-line no-unused-vars
    const { user } = useAuth(); // Mantener por si se usa en el futuro
    const theme = useTheme();
    const navigate = useNavigate(); // Hook para navegación
    const {
        currentProjectId, // Aún necesario para saber si limpiar
        setActiveProject,
        isTeamPanelOpen, // Aún necesario si el panel se abre desde el layout/header
        closeTeamPanel   // Aún necesario si el panel se abre desde el layout/header
    } = useProject();

    // Limpiar el proyecto activo al montar el Dashboard principal
    useEffect(() => {
        if (currentProjectId !== null) {
            console.log("DashboardPage: Clearing active project on mount.");
            setActiveProject(null);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [setActiveProject]); // Solo depende de setActiveProject

    // --- Hooks ---
    const {
        proyectos,
        proyectoToDelete,
        formData: projectFormData,
        isFormOpen,
        isDeleteDialogOpen,
        operationLoading: projectOperationLoading,
        operationError: projectOperationError,
        handleInputChange: handleProjectInputChange,
        handleOpenForm: openProjectForm,
        handleCloseForm: closeProjectForm,
        handleOpenDeleteDialog: openProjectDeleteDialog,
        handleCloseDeleteDialog: closeProjectDeleteDialog,
        handleSubmit: handleProjectSubmit,
        handleDeleteConfirm,
        updateProjectStatus,
        handleAddNewProject,
        refreshProyectos
    } = useProyectos();

    // *** AÑADIDO (Opcional): Hook useTareas para manejar estado/operaciones del diálogo de prueba ***
    // Si UploadProofDialog/DocumentUpload manejan su propio estado de carga/error, puedes omitir esto.
    const {
        // tareas: globalTareas, // No necesariamente necesitamos la lista aquí
        // loading: tareasLoading, // No necesariamente necesitamos la carga aquí
        // error: tareasError, // No necesariamente necesitamos el error aquí
        operationLoading: taskOperationLoading, // Para el diálogo de prueba
        // *** AÑADIR HANDLERS QUE FALTABAN DEL HOOK ***
        openEditDialog: openTaskEditDialog,     // Para editar tarea global
        openDeleteConfirm: openTaskDeleteConfirm, // Para borrar tarea global
        operationError: taskOperationError,     // Para el diálogo de prueba
        // handleProofUploadSuccess, // Función que se pasa a onSuccess del diálogo (si existe en el hook)
        refreshTareas // O una función para refrescar si es necesario después de subir prueba
    } = useTareas(null); // null para tareas globales

    // Hook para log global
    const {
        logEntries: globalActivityLog,
        loading: loadingGlobalLog,
        error: errorGlobalLog,
        refreshLog: refreshGlobalLog
    } = useActivityLog(null, null);

    // Estados para diálogos
    const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);
    const [projectToCompleteId, setProjectToCompleteId] = useState(null);
    const [selectedLogEntry, setSelectedLogEntry] = useState(null);
    const [isLogDetailOpen, setIsLogDetailOpen] = useState(false);
    // *** AÑADIDO: Estados para el diálogo de subir prueba ***
    const [isUploadProofDialogOpen, setIsUploadProofDialogOpen] = useState(false);
    const [selectedTaskForProof, setSelectedTaskForProof] = useState(null);


    // --- Handlers ---
    const handleProjectSelection = useCallback((projectId) => {
        if (projectId) {
            console.log(`DashboardPage: Project selected - ID: ${projectId}. Navigating to project detail page...`);
            navigate(`/proyecto/${projectId}`);
        } else {
            console.log(`DashboardPage: Project deselected (should not happen from selection?). Staying on dashboard.`);
        }
    }, [navigate]);

    const handleOperationSuccess = useCallback(() => {
        if (typeof refreshGlobalLog === 'function') {
            refreshGlobalLog();
        }
        if (typeof refreshProyectos === 'function') {
             console.log("DashboardPage: Refreshing projects list after operation.");
             refreshProyectos();
        }
        // *** AÑADIDO (Opcional): Refrescar tareas si una operación las afecta ***
        if (typeof refreshTareas === 'function') {
            console.log("DashboardPage: Refreshing tasks list after operation.");
            refreshTareas();
        }
    }, [refreshGlobalLog, refreshProyectos, refreshTareas]); // Añadir refreshTareas

    // Handlers Log Global
    const handleLogItemClick = useCallback((logEntry) => {
        setSelectedLogEntry(logEntry);
        setIsLogDetailOpen(true);
    }, []);
    const handleCloseLogDetail = useCallback(() => {
        setIsLogDetailOpen(false);
        setTimeout(() => setSelectedLogEntry(null), theme.transitions.duration.leavingScreen);
    }, [theme.transitions.duration.leavingScreen]);

    // Handlers Diálogo Completado
    const handleCloseCompletionDialog = useCallback(() => { setIsCompletionDialogOpen(false); setProjectToCompleteId(null); }, []);
    const handleConfirmProjectCompletion = useCallback(async () => {
        if (!projectToCompleteId) return;
        try {
            await updateProjectStatus(projectToCompleteId, 'Completado');
            handleOperationSuccess();
        } catch (error) {
            console.error("Error al intentar marcar el proyecto como finalizado:", error);
        } finally {
            handleCloseCompletionDialog();
        }
    }, [projectToCompleteId, updateProjectStatus, handleCloseCompletionDialog, handleOperationSuccess]);
    const handleKeepActive = useCallback(() => { handleCloseCompletionDialog(); }, [handleCloseCompletionDialog]);
    const projectToCompleteName = useMemo(() => {
        if (!projectToCompleteId) return '';
        const proj = proyectos.find(p => p.id_proyecto === projectToCompleteId);
        return proj?.nombre || `Proyecto ID ${projectToCompleteId}`;
    }, [projectToCompleteId, proyectos]);

    // *** AÑADIDO: Handlers para el diálogo de subir prueba ***
    const handleOpenUploadProofDialog = useCallback((task) => {
        console.log("DashboardPage: Abriendo diálogo de subir prueba para tarea:", task);
        setSelectedTaskForProof(task);
        setIsUploadProofDialogOpen(true);
    }, []);

    const handleCloseUploadProofDialog = useCallback(() => {
        setSelectedTaskForProof(null);
        setIsUploadProofDialogOpen(false);
        // Opcional: Limpiar taskOperationError si lo usas desde useTareas
    }, []);

    // Este handler se pasa al Dialog -> DocumentUpload
    const handleProofSuccess = useCallback((updatedTask) => {
        console.log("DashboardPage: Prueba subida con éxito para:", updatedTask);
        handleCloseUploadProofDialog(); // Cierra el diálogo
        // Opcional: Refrescar tareas si es necesario (ej: llamar a refreshTareas() del hook)
        if (typeof refreshTareas === 'function') {
            refreshTareas();
        }
    }, [handleCloseUploadProofDialog, refreshTareas]); // Depende de los handlers

    console.log("DashboardPage rendering. Current Project ID (should be null):", currentProjectId);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

            {/* Contenedor para Vista General */}
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: 'background.paper' }}>
                {/* --- Renderizar SIEMPRE GeneralView --- */}
                <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 0,
                        '&::-webkit-scrollbar': { width: '6px' },
                        '&::-webkit-scrollbar-thumb': { backgroundColor: alpha(theme.palette.text.primary, 0.2), borderRadius: '3px' }
                }}>
                    <GeneralView
                        projectsData={proyectos} // Pasa la lista de proyectos
                        activityLog={{ entries: globalActivityLog, loading: loadingGlobalLog, error: errorGlobalLog }} // Pasa el log global
                        onLogItemClick={handleLogItemClick} // Handler para detalles del log
                        onProjectSelect={handleProjectSelection} // Handler para navegar al detalle
                        onAddNewProject={handleAddNewProject} // Handler para añadir proyecto
                        onEditProject={openProjectForm} // Handler para editar proyecto
                        onDeleteProject={openProjectDeleteDialog} // Handler para eliminar proyecto
                        // *** AÑADIDO: Pasar el handler para abrir el diálogo de prueba ***
                        // (Asegúrate que GeneralView acepte y pase esta prop a GlobalTaskListDisplay)
                        onUploadProof={handleOpenUploadProofDialog}
                    />
                </Box>
            </Box>

            {/* FAB para añadir proyecto (opcional) */}
            {/* <Fab color="primary" size="medium" aria-label="add project" onClick={handleAddNewProject} sx={{ position: 'fixed', bottom: theme.spacing(2.5), right: theme.spacing(2.5), zIndex: 1050 }}>
                <AddIcon />
            </Fab> */}

            {/* --- Diálogos Modales --- */}
            {isFormOpen && ( <ProyectoFormulario open={isFormOpen} onClose={closeProjectForm} onSubmit={(e) => handleProjectSubmit(e).then(handleOperationSuccess)} proyectoData={projectFormData} onInputChange={handleProjectInputChange} isCreating={!projectFormData?.id_proyecto} loading={projectOperationLoading} error={projectOperationError} /> )}
            {isDeleteDialogOpen && ( <ProyectoEliminarDialog open={isDeleteDialogOpen} onClose={closeProjectDeleteDialog} onConfirm={() => handleDeleteConfirm().then(handleOperationSuccess).catch(console.error)} proyectoNombre={proyectoToDelete?.nombre} loading={projectOperationLoading} error={projectOperationError} /> )}
            {isCompletionDialogOpen && ( <ProjectCompletionDialog open={isCompletionDialogOpen} onClose={handleCloseCompletionDialog} onConfirmCompletion={handleConfirmProjectCompletion} onKeepActive={handleKeepActive} projectName={projectToCompleteName} loading={projectOperationLoading} /> )}
            <EquipoManagementPanel open={isTeamPanelOpen} onClose={closeTeamPanel} projectId={currentProjectId} />
            <ActivityLogDetailDialog
                logEntry={selectedLogEntry}
                open={isLogDetailOpen}
                onClose={handleCloseLogDetail}
            />
            {/* *** AÑADIDO: Renderizar el diálogo de subir prueba *** */}
            <UploadProofDialog
                open={isUploadProofDialogOpen}
                onClose={handleCloseUploadProofDialog}
                task={selectedTaskForProof}
                onSuccess={handleProofSuccess} // Pasa el handler de éxito
                // Pasa loading/error si usas el hook useTareas para esto
                loading={taskOperationLoading}
                error={taskOperationError}
            />

        </Box>
    );
};

export default DashboardPage;
