// src/pages/ProjectDetailPage.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
    Container, Box, Typography, Paper, Button, alpha, Fab, Divider, CircularProgress, Alert, Tabs, Tab, Stack, IconButton, Link as MuiLink
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import TimelineIcon from '@mui/icons-material/Timeline';
import AddIcon from '@mui/icons-material/Add'; // Para el FAB

// Componentes específicos del proyecto
import ProjectDetailsPanel from '../features/schedule/components/ProjectDetailsPanel.js';
import Cronograma from '../features/schedule/components/Cronograma.js';
import TaskDialog from '../features/tasks/components/TaskDialog.js';
import TaskDeleteDialog from '../features/tasks/components/TaskDeleteDialog.js';
import ProjectCompletionDialog from '../features/projects/components/ProjectCompletionDialog.js';
import EquipoManagementPanel from '../features/equipos/components/EquipoManagementPanel.js'; // Si lo necesitas aquí
import ActivityLogDetailDialog from '../features/schedule/components/ActivityLogDetailDialog.js';
import UploadProofDialog from '../features/tasks/components/UploadProofDialog.js'; // <-- AÑADIR: Importar diálogo de prueba

// Hooks y Contexto
import { useProject } from '../contexts/ProjectContext.js';
import useProyectos from '../features/projects/hooks/useProjects.js'; // Para obtener detalles del proyecto
import { useTareas } from '../features/tasks/hooks/useTareas.js';
import { useActivityLog } from '../hooks/useActivityLog.js';
import { useTheme } from '@mui/material';

// Componente TabPanel (igual que en DashboardPage)
function TabPanel(props) {
    const { children, value, index, hidden, ...other } = props;
    const theme = useTheme();
    return (
        <div role="tabpanel" hidden={hidden} id={`project-detail-tabpanel-${index}`} aria-labelledby={`project-detail-tab-${index}`} {...other} style={{ height: '100%', overflow: 'hidden', display: hidden ? 'none' : 'flex', flexDirection: 'column' }}>
            <Box sx={{ flexGrow: 1, overflowY: 'auto', pt: 1.5, px: 1.5, pb: 1.5, display: value !== index ? 'none' : 'flex', flexDirection: 'column', '&::-webkit-scrollbar': { width: '6px' }, '&::-webkit-scrollbar-thumb': { backgroundColor: alpha(theme.palette.text.primary, 0.2), borderRadius: '3px' } }}>
                {children}
            </Box>
        </div>
    );
}

// Helper a11yProps (igual que en DashboardPage)
function a11yProps(index) { return { id: `project-detail-tab-${index}`, 'aria-controls': `project-detail-tabpanel-${index}` }; }

const ProjectDetailPage = () => {
    const theme = useTheme();
    const navigate = useNavigate();
    const { projectId } = useParams(); // Obtener ID de la URL
    const { setActiveProject, currentProjectId, isTeamPanelOpen, closeTeamPanel } = useProject(); // Usar contexto

    const [currentTab, setCurrentTab] = useState(0);
    const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false); // Estado para diálogo de completado
    // *** AÑADIDO: Estados para diálogo de subir prueba ***
    const [isUploadProofDialogOpen, setIsUploadProofDialogOpen] = useState(false);
    const [selectedTaskForProof, setSelectedTaskForProof] = useState(null);

    // Hook para obtener detalles específicos del proyecto
    const {
        proyectos,
        loading: loadingProjectsList, // Renombrado para claridad
        error: errorProjectsList,     // Renombrado para claridad
        // Obtener funciones y estados necesarios para el diálogo de completado
        updateProjectStatus,
        operationLoading: projectOperationLoading,
        operationError: projectOperationError, // Podrías usar este error en el diálogo
        refreshProyectos // Necesario para refrescar la lista si el estado cambia
    } = useProyectos();
    // Encontrar el proyecto en la lista usando useMemo
    const selectedProjectDetails = useMemo(() => {
        return proyectos.find(p => p.id_proyecto === projectId);
    }, [projectId, proyectos]);

    // Sincronizar contexto con la URL al montar/cambiar projectId
    useEffect(() => {
        if (projectId && projectId !== currentProjectId) {
            console.log(`ProjectDetailPage: Setting active project from URL: ${projectId}`);
            setActiveProject(projectId);
        }
        // Opcional: Limpiar al desmontar si es necesario, aunque navegar fuera debería hacerlo
        // return () => setActiveProject(null);
    }, [projectId, currentProjectId, setActiveProject]);

    // Hooks para tareas y logs (dependen del projectId de la URL)
    // handleAllTasksCompleted ahora abre el diálogo de completado
    const handleAllTasksCompleted = useCallback(() => setIsCompletionDialogOpen(true), []);
    const {
        tareas, loading: loadingTasks, error: errorTasks, dialogOpen: isTaskDialogOpen,
        formData: taskFormData, isEditing: isTaskEditing, tareaToDelete,
        isDeleteDialogOpen: isTaskDeleteDialogOpen, operationLoading: taskOperationLoading,
        operationError: taskOperationError, openEditDialog: openTaskEditDialog,
        openCreateDialog: openTaskCreateDialog, handleCloseDialog: closeTaskDialog, refreshTareas, // <-- AÑADIR refreshTareas aquí
        openDeleteConfirm: openTaskDeleteConfirm, handleCloseDeleteDialog: closeTaskDeleteDialog, // <-- Añadido refreshTareas
        handleSubmit: handleTaskSubmit, handleDeleteConfirm: handleTaskDeleteConfirm,
        handleInputChange: handleTaskInputChange, handleDateChange: handleTaskDateChange,
    } = useTareas(projectId, handleAllTasksCompleted); // Usar projectId de la URL

    const {
        logEntries: projectActivityLog, loading: loadingProjectLog, error: errorProjectLog, refreshLog: refreshProjectLog
    } = useActivityLog('proyectos', projectId); // Usar projectId de la URL

    // Handlers (similares a DashboardPage, pero específicos de esta página)
    const handleTabChange = (event, newValue) => setCurrentTab(newValue);
    const handleOperationSuccess = useCallback(() => {
        if (typeof refreshProjectLog === 'function') refreshProjectLog();
        // Refrescar la lista de proyectos también si una operación de tarea/estado la afecta
        if (typeof refreshProyectos === 'function') refreshProyectos();
        // *** AÑADIDO (Opcional): Refrescar tareas si una operación las afecta ***
        if (typeof refreshTareas === 'function') {
            refreshTareas();
        }
    }, [refreshProjectLog, refreshProyectos, refreshTareas]); // <-- Añadido refreshTareas
    const handleTaskClick = useCallback((task) => { console.log("Tarea clickeada:", task); }, []);
    const handleEditTask = useCallback((task) => { openTaskEditDialog(task); }, [openTaskEditDialog]);
    const handleDeleteTask = useCallback((task) => { openTaskDeleteConfirm(task); }, [openTaskDeleteConfirm]);
    const handleAddNewTask = useCallback(() => { openTaskCreateDialog(); }, [openTaskCreateDialog]);

    // --- Handlers para Diálogo de Completado ---
    const handleCloseCompletionDialog = useCallback(() => { setIsCompletionDialogOpen(false); }, []);
    const handleConfirmProjectCompletion = useCallback(async () => {
        if (!projectId) return;
        try {
            await updateProjectStatus(projectId, 'Completado');
            handleOperationSuccess(); // Refresca log y lista de proyectos
        } catch (error) {
            console.error("Error al intentar marcar el proyecto como finalizado:", error);
            // El diálogo podría mostrar el projectOperationError del hook useProyectos
        }
        // Cierra el diálogo independientemente del resultado (o solo en éxito?)
        handleCloseCompletionDialog();
    }, [projectId, updateProjectStatus, handleOperationSuccess, handleCloseCompletionDialog]);
    const handleKeepActive = useCallback(() => { handleCloseCompletionDialog(); }, [handleCloseCompletionDialog]);

    // Handlers para Activity Log Dialog (si se usa aquí)
    const [selectedLogEntry, setSelectedLogEntry] = useState(null);
    const [isLogDetailOpen, setIsLogDetailOpen] = useState(false);
    const handleLogItemClick = useCallback((logEntry) => { setSelectedLogEntry(logEntry); setIsLogDetailOpen(true); }, []);
    const handleCloseLogDetail = useCallback(() => { setIsLogDetailOpen(false); setTimeout(() => setSelectedLogEntry(null), 300); }, []);

    // *** AÑADIDO: Handlers para el diálogo de subir prueba ***
    const handleOpenTask = useCallback((task) => {
        console.log("ProjectDetailPage: Abriendo diálogo de subir prueba para tarea:", task);
        setSelectedTaskForProof(task);
        setIsUploadProofDialogOpen(true);
    }, []);

    const handleCloseUploadProofDialog = useCallback(() => {
        setSelectedTaskForProof(null);
        setIsUploadProofDialogOpen(false);
    }, []);

    const handleProofSuccess = useCallback((updatedTask) => {
        console.log("ProjectDetailPage: Prueba subida con éxito para:", updatedTask);
        handleCloseUploadProofDialog();
        if (typeof refreshTareas === 'function') refreshTareas(); // Refrescar tareas
    }, [handleCloseUploadProofDialog, refreshTareas]);

    // Renderizado condicional por carga o error del proyecto principal
    if (loadingProjectsList) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress /></Box>;
    }
    // También verifica si no se encontró el proyecto en la lista cargada
    if (errorProjectsList || !selectedProjectDetails) {
        const errorMessage = errorProjectsList || 'Proyecto no encontrado.';
        return (
            <Container maxWidth="sm" sx={{ mt: 5, textAlign: 'center' }}>
                <Alert severity="error">Error al cargar el proyecto: {errorMessage}</Alert>
                <Button component={RouterLink} to="/dashboard" sx={{ mt: 2 }}>Volver al Dashboard</Button>
            </Container>
        );
    }


    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', bgcolor: 'background.paper' }}>
            {/* Botón Volver (Opcional) */}
            <Box sx={{ px: 1.5, pt: 1, flexShrink: 0 }}>
                 <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/dashboard')} size="small">
                     Volver al Dashboard
                 </Button>
            </Box>

            {/* Barra de Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper', px: 1.5, flexShrink: 0 }}>
                <Tabs value={currentTab} onChange={handleTabChange} aria-label="pestañas del proyecto" indicatorColor="primary" textColor="primary" variant="fullWidth" sx={{ minHeight: 48, '& .MuiTabs-flexContainer': { alignItems: 'center' } }}>
                    <Tab label="Detalles" icon={<ArticleOutlinedIcon />} iconPosition="start" {...a11yProps(0)} sx={{ minHeight: 48, fontSize: '0.8rem', fontWeight: currentTab === 0 ? 600 : 400, color: currentTab === 0 ? 'primary.main' : 'text.secondary', opacity: currentTab === 0 ? 1 : 0.7, '&:hover': { backgroundColor: alpha(theme.palette.primary.light, 0.05), opacity: 1 } }} />
                    <Tab label="Cronograma" icon={<TimelineIcon />} iconPosition="start" {...a11yProps(1)} sx={{ minHeight: 48, fontSize: '0.8rem', fontWeight: currentTab === 1 ? 600 : 400, color: currentTab === 1 ? 'primary.main' : 'text.secondary', opacity: currentTab === 1 ? 1 : 0.7, '&:hover': { backgroundColor: alpha(theme.palette.primary.light, 0.05), opacity: 1 } }} />
                </Tabs>
            </Box>

            {/* Paneles de Contenido */}
            <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <TabPanel value={currentTab} index={0} hidden={currentTab !== 0}>
                    <ProjectDetailsPanel
                        project={selectedProjectDetails}
                        tareas={tareas}
                        loadingTasks={loadingTasks}
                        errorTasks={errorTasks}
                        onEditTask={handleEditTask}
                        onDeleteTask={handleDeleteTask}
                        onTaskClick={handleTaskClick}
                        // *** AÑADIDO: Pasar handler para abrir diálogo de prueba ***
                        onUploadProof={handleOpenTask}
                        activityLog={{ entries: projectActivityLog, loading: loadingProjectLog, error: errorProjectLog }}
                        onLogItemClick={handleLogItemClick}
                    />
                </TabPanel>
                <TabPanel value={currentTab} index={1} hidden={currentTab !== 1}>
                    {/* Pasamos el projectId de la URL al Cronograma */}
                    <Cronograma
                        selectedProjectId={projectId}
                        // El log global no es relevante aquí, pasamos null o un objeto vacío
                        activityLog={{ entries: [], loading: false, error: null }}
                    />
                </TabPanel>
            </Box>

            {/* FAB para añadir tarea */}
            <Fab color="primary" size="medium" aria-label="add task" onClick={handleAddNewTask} disabled={taskOperationLoading} sx={{ position: 'fixed', bottom: theme.spacing(2.5), right: theme.spacing(2.5), zIndex: 1050 }}>
                <AddIcon />
            </Fab>

            {/* Diálogos Modales */}
            {isTaskDialogOpen && ( <TaskDialog open={isTaskDialogOpen} onClose={closeTaskDialog} onSubmit={(e) => handleTaskSubmit(e).then(handleOperationSuccess)} formData={taskFormData} onInputChange={handleTaskInputChange} onDateChange={handleTaskDateChange} isEditing={isTaskEditing} loading={taskOperationLoading} error={taskOperationError} /> )}
            {isTaskDeleteDialogOpen && ( <TaskDeleteDialog open={isTaskDeleteDialogOpen} onClose={closeTaskDeleteDialog} onConfirm={() => handleTaskDeleteConfirm().then(handleOperationSuccess)} taskTitle={tareaToDelete?.titulo} loading={taskOperationLoading} error={taskOperationError} /> )}
            {/* --- Añadido: Diálogo de Completado --- */}
            {isCompletionDialogOpen && ( <ProjectCompletionDialog
                open={isCompletionDialogOpen}
                onClose={handleCloseCompletionDialog}
                onConfirmCompletion={handleConfirmProjectCompletion}
                onKeepActive={handleKeepActive}
                projectName={selectedProjectDetails?.nombre || `Proyecto ID ${projectId}`}
                loading={projectOperationLoading} /* Usa el loading de useProyectos */ /> )}
            <EquipoManagementPanel open={isTeamPanelOpen} onClose={closeTeamPanel} projectId={projectId} />
            <ActivityLogDetailDialog logEntry={selectedLogEntry} open={isLogDetailOpen} onClose={handleCloseLogDetail} />
            {/* *** AÑADIDO: Renderizar diálogo de subir prueba *** */}
            <UploadProofDialog
                open={isUploadProofDialogOpen}
                onClose={handleCloseUploadProofDialog}
                task={selectedTaskForProof}
                onSuccess={handleProofSuccess}
                loading={taskOperationLoading} // Usa el loading de useTareas
                error={taskOperationError}     // Usa el error de useTareas
            />

        </Box>
    );
};

export default ProjectDetailPage;
