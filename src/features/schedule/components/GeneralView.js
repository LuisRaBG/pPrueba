// src/features/schedule/components/GeneralView.js
import React, { useState, useCallback, useEffect } from 'react';
import {
    Box, Typography, Stack, alpha, useTheme, Button,
    Tabs, Tab, CircularProgress, Alert
} from '@mui/material';
import GeneralSummaryPanel from './GeneralSummaryPanel.js';
import ActivityLogDisplay from './ActivityLogDisplay.js';
import {
    History as HistoryIcon, AssessmentOutlined as SummaryIcon, Add as AddIcon,
    ListAlt as TaskIcon, FolderOpenOutlined as DocumentIcon
} from '@mui/icons-material';

// --- Dependencias ---
import { useTareas } from '../../tasks/hooks/useTareas.js';
import { useAuth } from '../../../contexts/AuthContext.js';
import TaskList from '../../tasks/components/TaskList.js';
import DocumentList from './DocumentList.js';
import DocumentPreviewDialog from './DocumentPreviewDialog.js'; // <-- Importar el diálogo
import { useDocumentService } from '../../../services/documentService.js';


// --- Componente TabPanel ---
function TabPanel(props) {
    const { children, value, index, ...other } = props;
    const theme = useTheme();
    return (
        <div role="tabpanel" hidden={value !== index} id={`global-tabpanel-${index}`} aria-labelledby={`global-tab-${index}`} style={{ height: '100%', overflow: 'hidden', flexGrow: 1 }} {...other}>
            {value === index && (
                <Box sx={{
                    p: 2, // Padding consistente
                    height: '100%',
                    overflowY: 'auto',
                    '&::-webkit-scrollbar': { width: '6px' },
                    '&::-webkit-scrollbar-thumb': { backgroundColor: alpha(theme.palette.text.primary, 0.2), borderRadius: '3px' }
                }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

// --- Helper a11yProps ---
function a11yProps(index) { return { id: `global-tab-${index}`, 'aria-controls': `global-tabpanel-${index}`, }; }


// === Lógica y Componentes Globales Integrados ===

// --- Hook para Tareas Globales ---
const useGlobalTasks = () => {
    const {
        tareas: globalTasks, loading: loadingGlobalTasks, error: errorGlobalTasks,
        refreshTareas: refreshGlobalTasks,
    } = useTareas(null); // Llama a useTareas sin idProyecto para obtener todas las tareas del usuario
    return { globalTasks, loadingGlobalTasks, errorGlobalTasks, refreshGlobalTasks };
};

// --- Hook para Documentos Globales ---
const useGlobalDocuments = (limit = 20) => {
    const [globalDocs, setGlobalDocs] = useState([]);
    const [loadingGlobalDocs, setLoadingGlobalDocs] = useState(false);
    const [errorGlobalDocs, setErrorGlobalDocs] = useState(null);
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    // Obtiene la función getDocuments del hook del servicio
    const { getDocuments } = useDocumentService();

    const fetchGlobalDocs = useCallback(async () => {
        // No intentar cargar si no está autenticado o la autenticación está en proceso
        if (isAuthLoading || !isAuthenticated) {
            setGlobalDocs([]);
            setLoadingGlobalDocs(false);
            setErrorGlobalDocs(null);
            return;
        }

        setLoadingGlobalDocs(true);
        setErrorGlobalDocs(null);
        console.log(`useGlobalDocuments: Fetching global documents for user (limit ${limit})...`);

        try {
            // Llama a getDocuments con null para obtener los globales del usuario
            const data = await getDocuments(null, null, limit);
            console.log("useGlobalDocuments: Received global documents data:", data);
            setGlobalDocs(data.documentos || []);

        } catch (err) {
            console.error("Error fetching global documents:", err);
            setErrorGlobalDocs(err.message || 'Error al cargar documentos globales.');
            setGlobalDocs([]);
        } finally {
            setLoadingGlobalDocs(false);
        }
    // Añade getDocuments a las dependencias
    }, [isAuthenticated, isAuthLoading, limit, getDocuments]);

    // Efecto para cargar los documentos cuando el hook se monta o cambian las dependencias
    useEffect(() => {
        fetchGlobalDocs();
    }, [fetchGlobalDocs]); // fetchGlobalDocs es estable gracias a useCallback

    // Devuelve el estado y la función para refrescar
    return {
        globalDocs,
        loadingGlobalDocs,
        errorGlobalDocs,
        refreshGlobalDocs: fetchGlobalDocs,
    };
};

// --- Componente para Mostrar Lista de Tareas Globales ---
const GlobalTaskListDisplay = ({
    tasks,
    loading,
    error,
    onTaskClick,
    onEditTask,      // <-- Recibir prop
    onDeleteTask,    // <-- Recibir prop
    onUploadProof    // <-- Recibir prop
}) => {
    if (loading) { return <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}><CircularProgress size={24} /></Box>; }
    if (error) { return <Alert severity="error" sx={{ mt: 1, fontSize: '0.8rem' }}>{error}</Alert>; }
    if (!tasks || tasks.length === 0) { return <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center', fontStyle: 'italic' }}>No hay tareas globales para mostrar.</Typography>; }
    // Renderiza TaskList sin contexto de proyecto y ocultando el botón de añadir
    // *** PASAR LAS PROPS RECIBIDAS A TaskList ***
    return ( <TaskList tareas={tasks} loading={false} error={null} idProyectoContext={null} onTaskClick={onTaskClick} onEditTask={onEditTask} onDeleteTask={onDeleteTask} onUploadProof={onUploadProof} hideAddButton={true} /> );
};

// --- Componente para Mostrar Lista de Documentos Globales ---
const GlobalDocumentListDisplay = ({ documents, loading, error, refreshList }) => {
    const { deleteDocument, downloadDocument } = useDocumentService();

    // Estado para el diálogo de vista previa
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState(null); // Estado para el documento a previsualizar

    // Handler para eliminar un documento
    const handleDelete = useCallback(async (filePath) => {
        // Confirmación antes de eliminar
        if (!window.confirm(`¿Estás seguro de eliminar el documento "${filePath.split('/').pop()}"?`)) return;
        try {
            await deleteDocument(filePath);
            // Refresca la lista si la función fue proporcionada
            if (typeof refreshList === 'function') {
                refreshList();
            }
        } catch (err) {
            console.error("Error al eliminar documento global:", err);
            // Muestra un mensaje de error al usuario
            alert(`Error al eliminar: ${err.message}`);
        }
    }, [deleteDocument, refreshList]); // Dependencias del useCallback

    // Handler para descargar un documento
    const handleDownload = useCallback(async (filePath, filename) => {
        try {
            await downloadDocument(filePath, filename);
        } catch (err) {
            console.error("Error al descargar documento global:", err);
            // Muestra un mensaje de error al usuario
            alert(`Error al descargar: ${err.message}`);
        }
    }, [downloadDocument]); // Dependencia del useCallback

    // Handler para abrir la vista previa --- CORREGIDO ---
    const handlePreview = useCallback((doc) => {
        console.log("Preview requested for global doc:", doc);
        setSelectedDocument(doc); // Usa el setter correcto
        setIsPreviewOpen(true);
    }, []); // No necesita dependencias si solo usa setters

    // Handler para cerrar la vista previa --- CORREGIDO ---
    const handleClosePreview = useCallback(() => {
        setIsPreviewOpen(false);
        // Pequeño delay para que la animación de cierre termine antes de limpiar el doc
        setTimeout(() => setSelectedDocument(null), 300); // Usa el setter correcto
    }, []); // No necesita dependencias si solo usa setters

    // Renderizado condicional
    if (loading) { return <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}><CircularProgress size={24} /></Box>; }
    if (error) { return <Alert severity="error" sx={{ mt: 1, fontSize: '0.8rem' }}>{error}</Alert>; }
    if (!documents || documents.length === 0) { return <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center', fontStyle: 'italic' }}>No hay documentos globales para mostrar.</Typography>; }

    // Renderiza el componente DocumentList pasando los documentos y los handlers
   return (
        <>
            <DocumentList
                documents={documents}
                onDelete={handleDelete}
                onDownload={handleDownload}
                onPreview={handlePreview} // <-- Pasar el handler de preview
            />
            {/* Renderizar el diálogo --- CORREGIDO --- */}
            <DocumentPreviewDialog
                open={isPreviewOpen}
                onClose={handleClosePreview}
                document={selectedDocument} // <-- Pasa el estado correcto
            />
        </>
    );
};
// === Fin Lógica y Componentes Integrados ===


// --- Componente Principal GeneralView ---
const GeneralView = ({
    projectsData, activityLog, onLogItemClick, onProjectSelect,
    onAddNewProject, onEditProject, onDeleteProject,
    // *** AÑADIR: Recibir los handlers de tareas globales ***
    onEditTask,      // Handler para editar tarea global
    onDeleteTask,    // Handler para borrar tarea global
    onUploadProof    // Handler para subir prueba global
}) => {
    const theme = useTheme();
    const [currentTab, setCurrentTab] = useState(0);

    // Hooks para obtener datos globales (tareas y documentos)
    // *** NOTA: onEditTask, onDeleteTask, onUploadProof vienen de las props, no de useGlobalTasks ***
    const { globalTasks, loadingGlobalTasks, errorGlobalTasks } = useGlobalTasks();
    const { globalDocs, loadingGlobalDocs, errorGlobalDocs, refreshGlobalDocs } = useGlobalDocuments();

    // Handler para cambiar la pestaña activa
    const handleTabChange = (event, newValue) => { setCurrentTab(newValue); };

    // Handler para click en una tarea global (intenta navegar al proyecto si tiene uno asociado)
    const handleGlobalTaskClick = useCallback((task) => {
        if (task.id_proyecto && onProjectSelect) {
            onProjectSelect(task.id_proyecto);
        } else {
            console.log("Tarea global clickeada (sin acción definida o sin proyecto asociado):", task);
        }
    }, [onProjectSelect]); // Dependencia del useCallback

    // --- Estilos reutilizables para las secciones ---
    const sectionBoxSx = {
        bgcolor: 'background.paper', // Fondo blanco
        border: `1px solid ${theme.palette.divider}`, // Borde sutil
        borderRadius: theme.shape.borderRadius * .5, // Bordes redondeados consistentes
        overflow: 'hidden', // Para que el contenido interno no se salga
        display: 'flex',
        flexDirection: 'column',
        boxShadow: theme.shadows[1], // Sombra muy sutil
    };

    const sectionHeaderSx = {
        p: 1.5,
        borderBottom: `1px solid ${theme.palette.divider}`,
        flexShrink: 0,
        bgcolor: alpha(theme.palette.grey[500], 0.04), // Fondo ligeramente gris para cabecera
    };

    const sectionContentSx = {
        flexGrow: 1,
        overflowY: 'auto',
        p: 1.5, // Padding interno para el contenido
        '&::-webkit-scrollbar': { width: '6px' },
        '&::-webkit-scrollbar-thumb': { backgroundColor: alpha(theme.palette.text.primary, 0.2), borderRadius: '3px' }
    };

    // --- Renderizado del componente ---
    return (
        // Contenedor principal con padding y espaciado entre secciones
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 2, p: { xs: 1, sm: 2 } }}>

            {/* Título General (fuera de las cajas) */}
            <Typography variant="h5" sx={{ fontWeight: 600, color: 'text.primary', flexShrink: 0, px: 0.5 }}>
                Resumen General
            </Typography>

            {/* Sección 1: Resumen de Proyectos */}
            <Box sx={{ ...sectionBoxSx, flexShrink: 0 /* Esta sección no crece verticalmente */ }}>
                {/* Cabecera de la sección de proyectos */}
                <Stack direction="row" alignItems="center" sx={sectionHeaderSx}>
                    <SummaryIcon sx={{ color: 'primary.main', mr: 1 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 500, mr: 'auto' }}>
                        Proyectos Activos
                    </Typography>
                    {/* Botón para añadir nuevo proyecto (si la función es proporcionada) */}
                    {onAddNewProject && (
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={onAddNewProject}
                            sx={{ py: 0.5, fontSize: '0.75rem', ml: 1 }}
                            color="primary" // Botón con color primario
                        >
                            Nuevo Proyecto
                        </Button>
                    )}
                </Stack>
                {/* Contenido de la sección de proyectos */}
                <Box sx={{ ...sectionContentSx, maxHeight: '40vh' /* Limita la altura máxima */ }}>
                    <GeneralSummaryPanel
                        projects={projectsData}
                        onProjectSelect={onProjectSelect}
                        onEditProject={onEditProject}
                        onDeleteProject={onDeleteProject}
                    />
                </Box>
            </Box>

            {/* === Sección 2: Panel con Pestañas (Actividad, Tareas, Documentos Globales) === */}
            <Box sx={{ ...sectionBoxSx, flexGrow: 1 /* Esta sección crece para ocupar el espacio restante */ }}>
                {/* Contenedor de las Pestañas */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', flexShrink: 0 }}>
                    <Tabs
                        value={currentTab}
                        onChange={handleTabChange}
                        aria-label="Pestañas de vista general global"
                        variant="fullWidth" // Las pestañas ocupan todo el ancho disponible
                        indicatorColor="secondary" // Color del indicador de la pestaña activa
                        textColor="primary" // Color del texto de la pestaña activa
                        sx={{
                            minHeight: 48, // Altura mínima de la barra de pestañas
                            '& .MuiTab-root': { // Estilo base para todas las pestañas
                                minHeight: 48,
                                textTransform: 'none', // Sin mayúsculas automáticas
                                fontWeight: 400,
                                fontSize: '0.85rem',
                                color: 'text.secondary', // Color del texto inactivo
                                opacity: 0.8,
                                '&:hover': { // Estilo al pasar el ratón
                                    backgroundColor: alpha(theme.palette.action.hover, 0.04),
                                    opacity: 1,
                                },
                            },
                            '& .Mui-selected': { // Estilo para la pestaña seleccionada
                                fontWeight: 600, // Texto en negrita
                                color: 'primary.main', // Asegura color primario
                                opacity: 1,
                            },
                        }}
                    >
                        {/* Definición de cada pestaña con su etiqueta e icono */}
                        <Tab label="Mi Actividad" icon={<HistoryIcon />} iconPosition="start" {...a11yProps(0)} />
                        <Tab label="Mis Tareas" icon={<TaskIcon />} iconPosition="start" {...a11yProps(1)} />
                        <Tab label="Documentos" icon={<DocumentIcon />} iconPosition="start" {...a11yProps(2)} />
                    </Tabs>
                </Box>

                {/* Contenido de cada Pestaña (usando el componente TabPanel) */}
                <TabPanel value={currentTab} index={0}>
                    {/* Muestra el historial de actividad */}
                    <ActivityLogDisplay entries={activityLog?.entries} loading={activityLog?.loading} error={activityLog?.error} onLogItemClick={onLogItemClick} />
                </TabPanel>
                <TabPanel value={currentTab} index={1}>
                    {/* Muestra la lista de tareas globales */}
                    {/* *** PASAR LOS HANDLERS RECIBIDOS *** */}
                    <GlobalTaskListDisplay
                        tasks={globalTasks}
                        loading={loadingGlobalTasks}
                        error={errorGlobalTasks}
                        onTaskClick={handleGlobalTaskClick}
                        onEditTask={onEditTask}       // <-- Pasar
                        onDeleteTask={onDeleteTask}     // <-- Pasar
                        onUploadProof={onUploadProof}    // <-- Pasar
                    />
                </TabPanel>
                <TabPanel value={currentTab} index={2}>
                    {/* Muestra la lista de documentos globales */}
                    <GlobalDocumentListDisplay documents={globalDocs} loading={loadingGlobalDocs} error={errorGlobalDocs} refreshList={refreshGlobalDocs} />
                </TabPanel>
            </Box>
            {/* === Fin Sección 2 === */}
        </Box>
    );
};

export default GeneralView;
