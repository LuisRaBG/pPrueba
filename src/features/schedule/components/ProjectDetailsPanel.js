// c:\Users\Prueb\Documents\projects\proyecto\src\features\schedule\components\ProjectDetailsPanel.js
import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Stack, useTheme, Divider,
    CircularProgress, Alert, Dialog, DialogTitle,
    DialogContent, DialogContentText, DialogActions, Button, alpha,
    Paper, // Añadido Paper
    Grid,  // Añadido Grid
    Chip,  // Añadido Chip
    Tooltip // Añadido Tooltip
} from '@mui/material';
import {
    CalendarMonth, Description, Label, Person,
    Timer, EventAvailable, Update, History, FolderOpenOutlined,
    ListAlt as TaskIcon,
    // Iconos para estados (ejemplos, puedes usar los de taskUtils si prefieres)
    PlayCircleOutline, PauseCircleOutline, CheckCircleOutline, CancelOutlined, HourglassEmptyOutlined, HelpOutline as HelpOutlineIcon
} from '@mui/icons-material';
import { parseISO, isValid, differenceInDays, startOfDay, format } from 'date-fns'; // Añadido format
import { es } from 'date-fns/locale'; // Añadido locale
import ActivityLogDisplay from './ActivityLogDisplay.js';
import { useDocumentService } from '../../../services/documentService.js'; // Ajusta ruta
import DocumentList from './DocumentList.js';
import DocumentUpload from './DocumentUpload.js';
import DocumentPreviewDialog from './DocumentPreviewDialog.js';
import TaskList from '../../tasks/components/TaskList.js'; // Asegúrate que la ruta sea correcta

// Mapeos de estado (sin cambios)
const projectEstadoMapping = {
    'Planificado': 'Planificado',
    'En Curso': 'En Curso',
    'Completado': 'Completado',
    'Cancelado': 'Cancelado',
    'En Espera': 'En Espera',
    'default': 'Desconocido'
};
const projectEstadoColors = {
    'Planificado': 'info',
    'En Curso': 'primary',
    'Completado': 'success',
    'Cancelado': 'error',
    'En Espera': 'warning',
    'default': 'grey'
};

// --- Componente DetailItem (sin cambios) ---
const DetailItem = ({ icon, label, value, valueComponent = null, xs = 12, sm = 6 }) => (
    <Grid item xs={xs} sm={sm}>
        <Stack direction="row" spacing={1.5} alignItems="center">
            {React.cloneElement(icon, { sx: { color: 'text.secondary', fontSize: '1.2rem', flexShrink: 0 } })}
            <Box sx={{ overflow: 'hidden', width: '100%' }}>
                <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>{label}</Typography>
                {valueComponent ? valueComponent : (
                    <Typography variant="body2" sx={{ fontWeight: 500, wordBreak: 'break-word' }}>
                        {(value !== null && value !== undefined && value !== '') ? value :
                         <Typography component="span" variant="body2" sx={{ fontStyle: 'italic', color: 'text.disabled' }}>N/A</Typography>}
                    </Typography>
                )}
            </Box>
        </Stack>
    </Grid>
);

// --- Icono de Estado del Proyecto (sin cambios) ---
const getProjectStatusIcon = (status) => {
    switch (status) {
        case 'En Curso': return <PlayCircleOutline fontSize="inherit" />;
        case 'En Espera': return <PauseCircleOutline fontSize="inherit" />;
        case 'Completado': return <CheckCircleOutline fontSize="inherit" />;
        case 'Cancelado': return <CancelOutlined fontSize="inherit" />;
        case 'Planificado': return <HourglassEmptyOutlined fontSize="inherit" />;
        default: return <HelpOutlineIcon fontSize="inherit" />;
    }
};

const ProjectDetailsPanel = ({
    project,
    activityLog,
    onLogItemClick,
    tareas,
    loadingTasks,
    errorTasks,
    onEditTask,     // Handler para editar tarea
    onDeleteTask,   // Handler para borrar tarea
    onUploadProof,  // <-- RECIBIR: Handler para subir prueba desde ProjectDetailPage
    onTaskClick     // Handler para click general en tarea
}) => {
    const theme = useTheme();
    const { getDocuments, deleteDocument, downloadDocument } = useDocumentService();
    const [documents, setDocuments] = useState([]);
    const [loadingDocs, setLoadingDocs] = useState(false);
    const [errorDocs, setErrorDocs] = useState(null);
    const [docPathToDelete, setDocPathToDelete] = useState(null);
    const [isDeletingDoc, setIsDeletingDoc] = useState(false);
    const [downloadError, setDownloadError] = useState(null);
    const projectId = project?.id_proyecto;

    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewDoc, setPreviewDoc] = useState(null);

    // --- Cargar Documentos ---
    const loadDocuments = useCallback(async () => {
        if (!projectId) { setDocuments([]); return; }
        setLoadingDocs(true); setErrorDocs(null); setDownloadError(null);
        try {
            const data = await getDocuments('proyecto', projectId);
            setDocuments(data.documentos || []);
        } catch (err) {
            console.error("Error fetching documents:", err);
            setErrorDocs(err.message || 'Error al cargar documentos.'); setDocuments([]);
        } finally { setLoadingDocs(false); }
    }, [projectId, getDocuments]);

    useEffect(() => {
        loadDocuments();
    }, [loadDocuments]);

    // --- Handlers Documentos ---
    const handleUploadSuccess = useCallback(() => {
        loadDocuments();
        // Podrías añadir un snackbar de éxito aquí
    }, [loadDocuments]);

    const handleUploadError = useCallback((err) => {
        setErrorDocs(`Error en subida: ${err.message}`);
        console.error("Upload failed in parent:", err);
    }, []);

    const openDeleteConfirm = useCallback((filePath) => {
        setDocPathToDelete(filePath);
        setErrorDocs(null); // Limpia errores previos del diálogo
    }, []);

    const closeDeleteConfirm = useCallback(() => {
        setDocPathToDelete(null);
        setIsDeletingDoc(false);
        // No limpiar errorDocs aquí para que se vea si falla la eliminación
    }, []);

    const handleDeleteDocument = useCallback(async () => {
        if (!docPathToDelete) return;
        setIsDeletingDoc(true);
        setErrorDocs(null);
        let deleteErrorOccurred = false; // Flag para saber si hubo error en el catch
        try {
            await deleteDocument(docPathToDelete);
            await loadDocuments(); // Recarga la lista
            closeDeleteConfirm(); // Cierra el diálogo en éxito
        } catch (err) {
            deleteErrorOccurred = true; // Marca que hubo error
            console.error("Error deleting document:", err);
            setErrorDocs(`Error al eliminar: ${err.message}`);
            // No cerrar el diálogo en caso de error para mostrar el mensaje
        } finally {
             // Solo poner a false si NO hubo error en el catch
             if (!deleteErrorOccurred) {
                 setIsDeletingDoc(false);
             }
             // Si hubo error, isDeletingDoc se quedará en true hasta que se cierre manually
        }
    }, [docPathToDelete, deleteDocument, loadDocuments, closeDeleteConfirm]);

    const handleDownloadDocument = useCallback(async (filePath, filename) => {
        setDownloadError(null); // Limpia errores previos de descarga
        try {
            await downloadDocument(filePath, filename);
        } catch (error) {
            console.error("Download failed in parent:", error);
            setDownloadError(`Error al descargar: ${error.message}`);
        }
    }, [downloadDocument]);

    // --- Handlers para la vista previa ---
    const handlePreview = useCallback((doc) => {
        console.log("Preview requested for project doc:", doc);
        setPreviewDoc(doc);
        setIsPreviewOpen(true);
    }, []);

    const handleClosePreview = useCallback(() => {
        setIsPreviewOpen(false);
        setTimeout(() => setPreviewDoc(null), 300);
    }, []);

    // --- Renderizado ---
    if (!project) {
        return ( <Box sx={{ p: 3, textAlign: 'center', color: 'text.disabled', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Typography>Selecciona un proyecto para ver sus detalles.</Typography></Box> );
    }

    // --- Cálculo de Días y Datos (con formato mejorado) ---
    let totalDays = null, elapsedDays = null, remainingDays = null;
    const today = startOfDay(new Date());
    const parseDateSafe = (dateString) => {
        if (!dateString) return null;
        try {
            let date = parseISO(dateString);
            if (!isValid(date)) { date = parseISO(dateString.replace(' ', 'T')); }
            return isValid(date) ? date : null;
        } catch (e) { console.error("Error parsing date string:", dateString, e); return null; }
    };
    const parsedStartDate = parseDateSafe(project.fecha_inicio);
    const parsedEndDate = parseDateSafe(project.fecha_fin);

    if (parsedStartDate && parsedEndDate && parsedStartDate <= parsedEndDate) {
        totalDays = differenceInDays(parsedEndDate, parsedStartDate) + 1;
        elapsedDays = today >= parsedStartDate ? Math.min(differenceInDays(today, parsedStartDate) + 1, totalDays) : 0;
        remainingDays = today <= parsedEndDate ? differenceInDays(parsedEndDate, today) : 0;
        if (remainingDays < 0) remainingDays = 0;
    }
    const projectName = project.nombre || 'Proyecto sin nombre';
    const projectDescription = project.descripcion || '';
    const projectStartDateDisplay = parsedStartDate ? format(parsedStartDate, 'dd MMM yyyy', { locale: es }) : 'N/A';
    const projectEndDateDisplay = parsedEndDate ? format(parsedEndDate, 'dd MMM yyyy', { locale: es }) : 'N/A';
    const projectCreator = project.nombre_creador || 'Desconocido';
    const projectStatus = project.estado || 'Desconocido';
    const logEntries = activityLog?.entries;
    const loadingLog = activityLog?.loading;
    const errorLog = activityLog?.error;

    // --- Estilo del Chip de Estado ---
    const statusColorName = projectEstadoColors[projectStatus] || 'default';
    const statusPaletteColor = theme.palette[statusColorName];
    let statusBgColor = alpha(theme.palette.grey[500], 0.15);
    let statusTextColor = theme.palette.text.secondary;
    if (statusPaletteColor) {
        statusBgColor = alpha(statusPaletteColor.main || theme.palette.grey[500], 0.15);
        statusTextColor = statusPaletteColor.dark || theme.palette.text.secondary;
    }
    const StatusIcon = getProjectStatusIcon(projectStatus);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', bgcolor: 'background.default',
             '&::-webkit-scrollbar': { width: '6px' },
             '&::-webkit-scrollbar-thumb': { backgroundColor: alpha(theme.palette.text.primary, 0.2), borderRadius: '3px' }
        }}>
            {/* --- Sección Detalles Proyecto --- */}
            <Paper elevation={1} sx={{ m: 1.5, p: 2, borderRadius: 1.5, flexShrink: 0 }}>
                <Stack spacing={2}>
                    {/* Título y Estado */}
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                        <Typography variant="h6" sx={{ fontWeight: 600, flexGrow: 1, mr: 1 }}>
                            {projectName}
                        </Typography>
                        <Chip
                            icon={StatusIcon}
                            label={projectEstadoMapping[projectStatus] || projectStatus}
                            size="small"
                            sx={{
                                bgcolor: statusBgColor, color: statusTextColor, fontWeight: 500,
                                height: 24, fontSize: '0.75rem', borderRadius: 1, mt: 0.5,
                                '& .MuiChip-icon': { fontSize: '1.1rem !important', color: statusTextColor, ml: 0.75 }
                            }}
                        />
                    </Stack>

                    {/* Descripción */}
                    {projectDescription && ( <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{projectDescription}</Typography> )}

                    <Divider sx={{ my: 1 }} />

                    {/* Grid para Fechas y Días */}
                    <Grid container spacing={2} alignItems="center">
                        <DetailItem icon={<CalendarMonth />} label="Inicio" value={projectStartDateDisplay} xs={6} sm={3} />
                        <DetailItem icon={<CalendarMonth />} label="Fin" value={projectEndDateDisplay} xs={6} sm={3} />
                        <DetailItem icon={<Timer />} label="Días Totales" value={totalDays !== null ? `${totalDays}` : 'N/A'} xs={6} sm={2} />
                        <DetailItem icon={<Update />} label="Transcurridos" value={elapsedDays !== null ? `${elapsedDays}` : 'N/A'} xs={6} sm={2} />
                        <DetailItem icon={<EventAvailable />} label="Restantes" value={remainingDays !== null ? `${remainingDays}` : 'N/A'} xs={12} sm={2} />
                    </Grid>

                    <Divider sx={{ my: 1 }} />

                    {/* Creador */}
                    <DetailItem icon={<Person />} label="Líder/Creador" value={projectCreator} xs={12} sm={12} />

                </Stack>
            </Paper>
            {/* --- Fin Sección Detalles --- */}

            {/* --- Sección Tareas --- */}
            <Paper elevation={1} sx={{ m: 1.5, mt: 0, p: 2, borderRadius: 1.5, flexShrink: 0, minHeight: 250, display: 'flex', flexDirection: 'column' }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5, flexShrink: 0 }}>
                    <TaskIcon sx={{ color: 'text.secondary' }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>Tareas del Proyecto</Typography>
                </Stack>
                <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                    <TaskList
                        tareas={tareas}
                        loading={loadingTasks}
                        error={errorTasks}
                        idProyectoContext={projectId}
                        onTaskClick={onTaskClick}
                        onEditTask={onEditTask}
                        onDeleteTask={onDeleteTask}
                        onUploadProof={onUploadProof} // <-- CORREGIDO: Pasar como onUploadProof
                        ultraCompact // Mantiene el modo ultra compacto
                    />
                </Box>
            </Paper>

            {/* --- Sección Documentos --- */}
            <Paper elevation={1} sx={{ m: 1.5, mt: 0, p: 2, borderRadius: 1.5, flexShrink: 0 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                    <FolderOpenOutlined sx={{ color: 'text.secondary' }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>Documentos</Typography>
                </Stack>
                <DocumentUpload contextType="proyecto" contextId={projectId} onUploadSuccess={handleUploadSuccess} onUploadError={handleUploadError} />
                {loadingDocs && <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress size={24} /></Box>}
                {errorDocs && !loadingDocs && <Alert severity="error" sx={{ my: 1, fontSize: '0.8rem' }}>{errorDocs}</Alert>}
                {downloadError && <Alert severity="error" sx={{ my: 1, fontSize: '0.8rem' }}>{downloadError}</Alert>}
                {!loadingDocs && ( <Box sx={{ maxHeight: 200, overflowY: 'auto', '&::-webkit-scrollbar': { width: '5px' }, '&::-webkit-scrollbar-thumb': { backgroundColor: alpha(theme.palette.text.primary, 0.15), borderRadius: '3px' } }}> <DocumentList documents={documents} onDelete={openDeleteConfirm} onDownload={handleDownloadDocument} onPreview={handlePreview}/> </Box> )}
            </Paper>

            {/* --- Sección Historial --- */}
            <Paper elevation={1} sx={{ m: 1.5, mt: 0, p: 2, borderRadius: 1.5, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5, flexShrink: 0 }}>
                    <History sx={{ color: 'text.secondary' }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>Historial de Actividad</Typography>
                </Stack>
                <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                    <ActivityLogDisplay entries={logEntries} loading={loadingLog} error={errorLog} onLogItemClick={onLogItemClick} />
                </Box>
            </Paper>

            {/* --- Diálogo Confirmación Eliminación Documento --- */}
            <Dialog open={Boolean(docPathToDelete)} onClose={closeDeleteConfirm}>
                <DialogTitle>Confirmar Eliminación</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        ¿Estás seguro de que quieres eliminar este documento? Esta acción no se puede deshacer.
                        {docPathToDelete && <Typography variant="caption" display="block" sx={{ mt: 1 }}>Archivo: {docPathToDelete.split('/').pop()}</Typography>}
                    </DialogContentText>
                    {/* Muestra error si falla la eliminación */}
                    {errorDocs && isDeletingDoc && ( <Alert severity="error" sx={{ mt: 2 }}>{errorDocs}</Alert> )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeDeleteConfirm} disabled={isDeletingDoc}>Cancelar</Button>
                    <Button onClick={handleDeleteDocument} color="error" autoFocus disabled={isDeletingDoc}>
                        {isDeletingDoc ? <CircularProgress size={20} color="inherit" /> : 'Eliminar'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* --- Diálogo Vista Previa Documento --- */}
            <DocumentPreviewDialog
                open={isPreviewOpen}
                onClose={handleClosePreview}
                document={previewDoc}
            />
        </Box>
    );
};

export default ProjectDetailsPanel;
