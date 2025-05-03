// src/features/tasks/components/Tareas.js
import React, { useMemo } from 'react'; // Añadido useMemo
import {
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    ListItemIcon,
    Typography,
    Box,
    CircularProgress,
    Alert,
    Chip,
    Tooltip,
    Paper,
    Stack,
    alpha,
    useTheme,
    IconButton,
    Menu,
    MenuItem
} from '@mui/material';
import {
    CalendarToday as CalendarIcon,
    ErrorOutline as ErrorIcon,
    MoreVert as MoreVertIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    KeyboardDoubleArrowUp as UrgentPriorityIcon,
    ArrowUpward as HighPriorityIcon,
    ArrowForward as MediumPriorityIcon,
    ArrowDownward as LowPriorityIcon,
    RadioButtonUnchecked as PendingIcon,
    Cached as InProgressIcon,
    TaskAlt as CompletedIcon,
    Block as BlockedIcon,
    CancelOutlined as CancelledIcon,
    HelpOutline as UnknownStateIcon,
    UploadFile as UploadFileIcon, // <-- Añadir icono para subir prueba
    AttachFile as AttachFileIcon, // <-- Añadir icono de adjunto
} from '@mui/icons-material';
import { ListChecks as ListChecksIcon } from 'lucide-react';
import { useTareas } from '../hooks/useTareas.js';
import { formatSimpleDate } from '../utils/taskUtils.js';
import { isBefore, startOfDay, parseISO, isValid } from 'date-fns';
// *** AÑADIDO: Importa las constantes de estado ***
import { TASK_STATUS } from '../services/taskService.js'; // Ajusta la ruta

// --- Mapeos (Ajusta según tus datos y preferencias) ---
const priorityMap = {
    Urgente: { icon: UrgentPriorityIcon, color: 'error' },
    Alta: { icon: HighPriorityIcon, color: 'warning' },
    Media: { icon: MediumPriorityIcon, color: 'info' },
    Baja: { icon: LowPriorityIcon, color: 'success' },
    default: { icon: MediumPriorityIcon, color: 'action' },
    Vencida: { icon: UrgentPriorityIcon, color: 'error' }
};

const statusMap = {
    Pendiente: { icon: PendingIcon, color: 'action' },
    'En Progreso': { icon: InProgressIcon, color: 'info' },
    Completada: { icon: CompletedIcon, color: 'success' },
    Bloqueada: { icon: BlockedIcon, color: 'warning' },
    Cancelada: { icon: CancelledIcon, color: 'error' },
    default: { icon: UnknownStateIcon, color: 'disabled' },
    Vencida: { icon: UrgentPriorityIcon, color: 'error' }
};
// --- Fin Mapeos ---

// --- Componente TaskItem Rediseñado ---
const TaskItem = ({ tarea, onSelect, onEdit, onDelete, onUploadProofRequest }) => { // <-- Añadir prop onUploadProofRequest
    const theme = useTheme();
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);

    // --- Lógica de Estado y Prioridad ---
    const { icon: PriorityIcon, color: priorityColorKey } = priorityMap[tarea.prioridad] || priorityMap.default;
    const priorityColor = theme.palette[priorityColorKey]?.main || theme.palette.action.active;

    const { icon: StatusIcon, color: statusColorKey } = statusMap[tarea.estado] || statusMap.default;
    const statusColor = theme.palette[statusColorKey]?.main || theme.palette.action.disabled;
    const statusBgColor = alpha(statusColor, 0.1);
    const statusTextColor = theme.palette[statusColorKey]?.dark || theme.palette.text.secondary;
    // --- Fin Lógica ---

    // --- Lógica de Vencimiento ---
    const today = startOfDay(new Date());
    // *** CORREGIDO: Usa fecha_vencimiento_orig si existe, si no fecha_vencimiento ***
    const dueDateString = tarea.fecha_vencimiento || tarea.fecha_vencimiento;
    const dueDate = dueDateString ? parseISO(dueDateString) : null;
    // Vencida visualmente (pasó la fecha Y no está completada/cancelada)
    const isTaskOverdue = dueDate && isValid(dueDate) && isBefore(dueDate, today) && tarea.estado !== TASK_STATUS.COMPLETADA && tarea.estado !== TASK_STATUS.CANCELADA;
    // Solo para el borde rojo (pasó la fecha)
    const isDateOverdue = dueDate && isValid(dueDate) && isBefore(dueDate, today);
    const formattedDueDate = formatSimpleDate(dueDateString); // Formatea la fecha correcta
    // --- Fin Lógica Vencimiento ---

    // --- Handlers Menú ---
    const handleMenuClick = (event) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };
    const handleMenuClose = (event) => {
        setAnchorEl(null);
    };
    const handleEditClick = (event) => {
        event.stopPropagation();
        onEdit(tarea);
        handleMenuClose(event);
    };
    const handleDeleteClick = (event) => {
        event.stopPropagation();
        onDelete(tarea);
        handleMenuClose(event);
    };
    // *** NUEVO: Handler para adjuntar prueba (reutiliza flujo de edición) ***
    const handleAttachProofClick = (event) => {
        // *** CAMBIADO: Llama a la nueva prop en lugar de onEdit ***
        event.stopPropagation();
        if (onUploadProofRequest) {
            onUploadProofRequest(tarea);
        } else {
            console.warn("TaskItem (internal): onUploadProofRequest handler is missing!");
        }
        handleMenuClose(event);
    };
    // --- Fin Handlers ---

    // Estilos condicionales para tareas vencidas (similar a TaskItem global)
    const overdueStyles = isTaskOverdue ? {
        opacity: 0.7,
        backgroundColor: alpha(theme.palette.grey[500], 0.05),
        '&:hover': {
            backgroundColor: alpha(theme.palette.grey[500], 0.08),
        },
    } : {};

    return (
        // Usamos Paper como contenedor principal para aplicar estilos
        <Paper
            variant="outlined"
            sx={{
                mb: 1, // Margen inferior entre items
                overflow: 'visible', // Para el menú
                // Borde izquierdo basado en prioridad o vencimiento
                borderLeft: `4px solid ${isDateOverdue ? theme.palette.error.main : priorityColor}`,
                // Estilos base consistentes
                borderRadius: theme.shape.borderRadius * 1.5,
                transition: theme.transitions.create(['background-color', 'border-color', 'box-shadow', 'opacity']),
                position: 'relative',
                // Aplicar estilos de vencido
                ...overdueStyles,
                // Hover general
                '&:hover': {
                    borderColor: theme.palette.divider, // Mantiene borde general
                    borderLeftColor: isDateOverdue ? theme.palette.error.dark : alpha(priorityColor, 0.7), // Oscurece borde izquierdo
                    bgcolor: alpha(theme.palette.action.hover, 0.04), // Fondo hover sutil
                    boxShadow: theme.shadows[1], // Sombra sutil en hover
                    // Sobrescribe hover si está vencido
                    ...(isTaskOverdue && overdueStyles['&:hover']),
                    // Mostrar acciones en hover (opcional)
                    // '& .task-actions': { opacity: 1 },
                },
            }}
        >
            {/* ListItem solo para estructura semántica, sin padding */}
            <ListItem disablePadding>
                {/* ListItemButton para el área clickeable */}
                <ListItemButton
                    // *** CORREGIDO: onSelect debe recibir la tarea, no el id_proyecto ***
                    onClick={() => onSelect ? onSelect(tarea) : undefined}
                    sx={{ py: 1, px: 1.5, alignItems: 'flex-start' }} // Padding ajustado
                >
                    {/* Icono de Prioridad */}
                    <ListItemIcon sx={{ minWidth: 32, mt: 0.25, color: isTaskOverdue ? 'text.disabled' : priorityColor }}>
                        <Tooltip title={`Prioridad: ${tarea.prioridad || 'No definida'}`}>
                            <PriorityIcon fontSize="small" />
                        </Tooltip>
                    </ListItemIcon>

                    {/* Contenido Principal */}
                    <ListItemText
                        disableTypography // Deshabilitar tipografía por defecto para usar Stack
                        primary={
                            <Typography
                                variant="body2"
                                fontWeight={500}
                                sx={{
                                    mb: 0.5,
                                    textDecoration: tarea.estado === TASK_STATUS.COMPLETADA ? 'line-through' : 'none',
                                    color: isTaskOverdue ? 'text.disabled' : (tarea.estado === TASK_STATUS.COMPLETADA ? 'text.disabled' : 'text.primary'),
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}
                            >
                                {tarea.titulo || 'Tarea sin título'}
                            </Typography>
                        }
                        secondary={
                            <Stack spacing={0.75} direction="row" alignItems="center" flexWrap="wrap" useFlexGap>
                                {/* Chip de Estado */}
                                <Chip
                                    icon={<StatusIcon sx={{ fontSize: '1rem', ml: '2px' }} />}
                                    label={tarea.estado?.replace('_', ' ') || 'Desconocido'}
                                    size="small"
                                    sx={{
                                        height: 20, fontSize: '0.65rem', fontWeight: 500,
                                        bgcolor: isTaskOverdue ? alpha(theme.palette.grey[500], 0.1) : statusBgColor,
                                        color: isTaskOverdue ? 'text.disabled' : statusTextColor,
                                        borderRadius: '6px',
                                        '& .MuiChip-icon': { color: isTaskOverdue ? 'text.disabled' : statusTextColor }
                                    }}
                                />
                                {/* Chip de Fecha Vencimiento */}
                                {formattedDueDate !== 'N/A' && (
                                    <Tooltip title="Fecha Vencimiento">
                                        <Chip
                                            icon={<CalendarIcon sx={{ fontSize: '0.8rem' }} />}
                                            label={formattedDueDate}
                                            size="small"
                                            variant="outlined"
                                            sx={{
                                                height: 20, fontSize: '0.65rem',
                                                // Estilo si está vencida (rojo) o atenuada (gris)
                                                ...(isTaskOverdue
                                                    ? { opacity: 0.8, borderColor: theme.palette.grey[400], color: 'text.disabled' }
                                                    : (isDateOverdue ? { borderColor: 'error.light', color: 'error.dark', fontWeight: 500 } : {})
                                                )
                                            }}
                                        />
                                    </Tooltip>
                                )}
                                {/* Icono de Prueba Adjunta */}
                                {tarea.ruta_prueba_entrega && (
                                    <Tooltip title="Prueba adjunta">
                                        <AttachFileIcon sx={{ fontSize: '0.8rem', color: 'text.secondary', ml: 0.5 }} />
                                    </Tooltip>
                                )}
                                {/* Chip de Proyecto (Opcional, si 'tarea' lo incluye) */}
                                {tarea.nombre_proyecto && (
                                    <Chip
                                        label={tarea.nombre_proyecto}
                                        size="small"
                                        variant="outlined"
                                        sx={{
                                            height: 20, fontSize: '0.65rem', fontStyle: 'italic',
                                            // Atenuar si está vencida
                                            ...(isTaskOverdue ? { opacity: 0.7, color: 'text.disabled', borderColor: theme.palette.grey[400] } : {})
                                        }}
                                    />
                                )}
                            </Stack>
                        }
                        sx={{ my: 0 }} // Quitar margen vertical por defecto
                    />
                </ListItemButton>

                {/* Botón de Acciones (siempre visible o en hover) */}
                <IconButton
                    edge="end"
                    aria-label="acciones"
                    aria-controls={open ? 'task-item-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? 'true' : undefined}
                    onClick={handleMenuClick}
                    size="small"
                    className="task-actions" // Clase opcional para controlar visibilidad en hover
                    sx={{
                        position: 'absolute',
                        top: theme.spacing(1), // Ajustar posición vertical
                        right: theme.spacing(1), // Ajustar posición horizontal
                        color: 'text.secondary',
                        // opacity: { xs: 1, sm: 0 }, // Opcional: Ocultar en desktop hasta hover
                        transition: theme.transitions.create('opacity'),
                        '&:hover': { bgcolor: alpha(theme.palette.action.active, 0.06) }
                    }}
                >
                    <MoreVertIcon fontSize="small" />
                </IconButton>
            </ListItem>

            {/* Menú de Acciones (Estilo consistente) */}
            <Menu
                id="task-item-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleMenuClose}
                MenuListProps={{ 'aria-labelledby': 'acciones-button' }}
                slotProps={{
                    paper: {
                        elevation: 3,
                        sx: {
                            minWidth: 140,
                            borderRadius: 1.5, // Consistente
                            mt: 0.5,
                            '& .MuiMenuItem-root': {
                                fontSize: '0.875rem', py: 1, px: 1.5,
                                '&:hover': { bgcolor: alpha(theme.palette.action.hover, 0.05) }
                            },
                            '& .MuiListItemIcon-root': { minWidth: 32, color: 'text.secondary' }
                        }
                    }
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                {/* *** NUEVO: Opción para Adjuntar Prueba *** */}
                {/* Mostrar solo si la tarea no está completada o cancelada */}
                {tarea.estado !== TASK_STATUS.COMPLETADA && tarea.estado !== TASK_STATUS.CANCELADA && (
                    <MenuItem onClick={handleAttachProofClick}>
                        <ListItemIcon>
                            {/* Usar icono diferente si ya existe prueba */}
                            {tarea.ruta_prueba_entrega ? <AttachFileIcon fontSize="small" /> : <UploadFileIcon fontSize="small" />}
                        </ListItemIcon>
                        {tarea.ruta_prueba_entrega ? 'Ver/Cambiar Prueba' : 'Adjuntar Prueba'}
                    </MenuItem>
                )}
                <MenuItem onClick={handleEditClick}>
                    <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon> Editar
                </MenuItem>
                <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main', '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.08) } }}>
                    <ListItemIcon sx={{ color: 'error.main' }}><DeleteIcon fontSize="small" /></ListItemIcon> Eliminar
                </MenuItem>
            </Menu>
        </Paper>
    );
};


// --- Componente Tareas (Contenedor Principal) ---
const Tareas = ({ idProyecto, compact = false, onTaskSelect, onUploadProofRequest }) => { // <-- Añadir prop onUploadProofRequest
    const theme = useTheme();
    const {
        tareas: initialTareas, // Renombrar para evitar conflicto
        loading, error,
        openEditDialog,
        openDeleteConfirm
    } = useTareas(idProyecto);

    // --- Lógica de Ordenamiento (Añadida aquí si es necesario para esta vista) ---
    const sortedTareas = useMemo(() => {
        if (!initialTareas) return [];

        const today = startOfDay(new Date());

        const isTaskOverdueForSorting = (task) => {
            if (task.estado === TASK_STATUS.COMPLETADA || task.estado === TASK_STATUS.CANCELADA) {
                return false;
            }
            // *** CORREGIDO: Usa fecha_vencimiento_orig si existe, si no fecha_vencimiento ***
            const dueDateString = task.fecha_vencimiento || task.fecha_vencimiento;
            const dueDate = dueDateString ? parseISO(dueDateString) : null;
            return dueDate && isValid(dueDate) && isBefore(dueDate, today);
        };

        return [...initialTareas].sort((a, b) => {
            const aIsOverdue = isTaskOverdueForSorting(a);
            const bIsOverdue = isTaskOverdueForSorting(b);

            if (aIsOverdue && !bIsOverdue) return 1;
            if (!aIsOverdue && bIsOverdue) return -1;

            const dateAString = a.fecha_vencimiento || a.fecha_vencimiento;
            const dateBString = b.fecha_vencimiento || b.fecha_vencimiento;
            const dateA = dateAString ? parseISO(dateAString) : null;
            const dateB = dateBString ? parseISO(dateBString) : null;
            if (dateA && dateB && isValid(dateA) && isValid(dateB)) {
                return dateA.getTime() - dateB.getTime();
            }
            return 0;
        });
    }, [initialTareas]); // Depende de initialTareas
    // --- Fin Lógica de Ordenamiento ---

    // --- Renderizado Condicional ---
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: theme.spacing(3) }}>
                <CircularProgress size={30} />
            </Box>
        );
    }

    if (error) {
        return (
            <Alert
                severity="error"
                icon={<ErrorIcon fontSize="inherit" />}
                sx={{ m: theme.spacing(1), fontSize: '0.8rem' }}
            >
                {error}
            </Alert>
        );
    }

    if (!sortedTareas || sortedTareas.length === 0) {
        return (
            <Box sx={{
                p: theme.spacing(2),
                textAlign: 'center',
                color: 'text.secondary',
                mt: 1,
            }}>
                <ListChecksIcon size={32} style={{ marginBottom: theme.spacing(1), color: theme.palette.text.disabled }} />
                <Typography variant="body2">
                    No hay tareas para mostrar.
                </Typography>
            </Box>
        );
    }

    // Asegurar que los handlers existan antes de pasarlos
    const handleEdit = openEditDialog || (() => console.warn('onEdit handler not provided to Tareas component'));
    const handleDelete = openDeleteConfirm || (() => console.warn('onDelete handler not provided to Tareas component'));
    // onTaskSelect es opcional, puede ser para navegar o mostrar detalles
    const handleSelect = onTaskSelect || (() => {});


    return (
        // Lista sin padding, TaskItem maneja su propio margen
        <List disablePadding sx={{ width: '100%' }}>
            {/* *** CORREGIDO: Mapea sobre sortedTareas *** */}
            {sortedTareas.map((tarea) => (
                <TaskItem
                    key={tarea.id}
                    tarea={tarea}
                    onSelect={handleSelect}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onUploadProofRequest={onUploadProofRequest} // <-- Pasar la nueva prop
                    // Puedes añadir ultraCompact aquí si lo necesitas
                    // ultraCompact={compact}
                />
            ))}
        </List>
    );
};

export default Tareas;
