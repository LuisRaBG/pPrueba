// c:\Users\Prueb\Documents\projects\proyecto\src\features\tasks\components\TaskItem.js
import React from 'react';
import { motion } from 'framer-motion';
import {
    ListItem, Paper, Typography, Chip, styled, useTheme,
    alpha, Stack, Tooltip, IconButton, Box
} from '@mui/material';
import {
    Edit as EditIcon, Delete as DeleteIcon,
    FolderOpen as FolderOpenIcon, // Para chip de proyecto
    CalendarToday as CalendarTodayIcon,
    CloudUpload as CloudUploadIcon, // <-- Icono para el nuevo botón
    AttachFile as AttachFileIcon, // <-- Icono para indicar prueba existente
} from '@mui/icons-material';
import {
    prioridadColors, estadoColors, estadoMapping, prioridadMapping,
    getPrioridadIcon, getEstadoIcon, formatSimpleDate // Importar formatSimpleDate
} from '../utils/taskUtils.js'; // Importar utils
// *** AÑADIDO: Importar helpers de date-fns ***
import { isBefore, startOfDay, parseISO, isValid } from 'date-fns'; // Añadido isValid
// *** AÑADIDO: Importa las constantes de estado ***
import { TASK_STATUS } from '../services/taskService.js'; // Ajusta la ruta

// --- Styled Components (Ajustados para tamaño compacto) ---

const TaskItemContainer = styled(motion.div)(({ theme }) => ({
    padding: 0,
    marginBottom: theme.spacing(0.5), // Espacio reducido entre items
    '&:last-child': { marginBottom: 0 },
}));

// *** AJUSTADO: TaskPaperStyled ahora recibe isTaskOverdue ***
const TaskPaperStyled = styled(Paper, {
    shouldForwardProp: (prop) => prop !== 'prioridad' && prop !== 'isOverdue' && prop !== 'ultraCompact' && prop !== 'isTaskOverdue',
})(({ theme, prioridad, isOverdue, ultraCompact, isTaskOverdue }) => { // Añadido isTaskOverdue
    // Asume que prioridadColors mapea 'Baja', 'Media', 'Alta', 'Urgente' a claves de theme.palette
    const colorName = prioridadColors[prioridad] || 'default'; // Usa 'default' como fallback
    const colorValue = theme.palette[colorName] || theme.palette.grey; // Recurre a grey si la clave no existe

    // Lógica para obtener mainColor (sin cambios respecto a la versión anterior)
    let mainColor;
    if (colorName !== 'default' && colorValue?.main) {
        mainColor = colorValue.main;
    } else if (colorValue && typeof colorValue === 'object' && colorValue[500]) {
         mainColor = colorValue[500];
    } else if (typeof colorValue === 'string') {
        mainColor = colorValue;
    } else {
        mainColor = theme.palette.grey[500];
    }

    const hoverBgColor = alpha(mainColor, 0.04);
    const hoverBorderColor = alpha(mainColor, 0.4);

    // *** AJUSTADO: Estilos condicionales para tareas vencidas ***
    const overdueStyles = isTaskOverdue ? {
        opacity: 0.65, // Reducir opacidad
        backgroundColor: alpha(theme.palette.grey[500], 0.05), // Fondo grisáceo muy sutil
        borderLeftColor: theme.palette.text.disabled, // Borde izquierdo gris oscuro/deshabilitado
        '&:hover': { // Hover menos pronunciado para vencidas
            backgroundColor: alpha(theme.palette.grey[500], 0.08),
            borderColor: theme.palette.grey[400], // Borde general gris claro
            borderLeftColor: theme.palette.text.disabled, // Mantiene borde izquierdo gris
        },
    } : {};

    return {
        padding: theme.spacing(ultraCompact ? 0.5 : 0.75, ultraCompact ? 1.25 : 1.5), // Padding reducido
        borderRadius: theme.shape.borderRadius * (ultraCompact ? 0.7 : 0.85), // Radio más pequeño
        transition: theme.transitions.create(['background-color', 'border-color', 'border-left-color', 'opacity'], { // Añadir opacity a transition
            duration: theme.transitions.duration.shortest,
        }),
        border: `1px solid ${theme.palette.divider}`,
        // Borde izquierdo: Rojo si la fecha pasó (isOverdue), si no, usa mainColor (prioridad)
        // Este borde NO se sobrescribe por overdueStyles, solo el color de fondo y opacidad
        borderLeft: `${ultraCompact ? 2 : 3}px solid ${isOverdue ? theme.palette.error.main : mainColor}`, // Borde más fino
        backgroundColor: theme.palette.background.paper,
        minHeight: 'auto', // Altura automática
        width: '100%',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden', cursor: 'pointer', position: 'relative',
        paddingRight: theme.spacing(ultraCompact ? 7 : 8), // Espacio aumentado para 3 botones
        '&:hover': {
            backgroundColor: hoverBgColor,
            borderColor: hoverBorderColor,
        },
        ...overdueStyles, // Aplicar estilos de vencida (opacidad, fondo, hover específico)
    };
});

const InfoChipStyled = styled(Chip, {
    shouldForwardProp: (prop) => prop !== 'ultraCompact',
})(({ theme, ultraCompact }) => ({
   height: ultraCompact ? 16 : 18, // Altura aún más pequeña
   fontSize: ultraCompact ? '0.6rem' : '0.65rem', // Fuente aún más pequeña
   fontWeight: 500,
   borderRadius: theme.shape.borderRadius * 0.6, // Más redondeado
   padding: theme.spacing(0, ultraCompact ? 0.4 : 0.5), // Padding reducido
   '& .MuiChip-icon': {
       fontSize: ultraCompact ? '0.7rem' : '0.75rem', // Icono más pequeño
       marginLeft: theme.spacing(ultraCompact ? 0.15 : 0.25),
       marginRight: theme.spacing(ultraCompact ? -0.7 : -0.6),
   },
   // Específico para iconos SVG de Material Icons si es necesario
   '& .MuiChip-icon.MuiSvgIcon-root': {
       fontSize: ultraCompact ? '0.75rem' : '0.8rem',
       marginLeft: theme.spacing(ultraCompact ? 0.25 : 0.35),
       marginRight: theme.spacing(ultraCompact ? -0.8 : -0.7),
   }
}));


// --- Componente TaskItem ---
const TaskItem = ({
    tarea,
    showProjectChip, // Mostrar chip de proyecto (si no estamos filtrando)
    onClick,         // Handler para click general en el item
    onEdit,          // Handler para editar (recibido de TaskList)
    onDelete,        // Handler para borrar (recibido de TaskList)
    onUploadProof,   // <-- NUEVO: Handler para el botón de subir prueba
    ultraCompact = false, // Prop para modo ultra compacto
}) => {
    const theme = useTheme();

    // Handler para el botón de editar
    const handleEditClick = (e) => {
        e.stopPropagation();
        if (onEdit) {
            onEdit(tarea);
        } else {
            console.warn("TaskItem: onEdit handler is missing!");
        }
    };

    // Handler para el botón de borrar
    const handleDeleteClick = (e) => {
        e.stopPropagation();
        if (onDelete) {
            onDelete(tarea);
        } else {
            console.warn("TaskItem: onDelete handler is missing!");
        }
    };

    // *** NUEVO: Handler para el BOTÓN directo de subir prueba ***
    const handleUploadProofButtonClick = (e) => {
        e.stopPropagation(); // Evita que se seleccione el item completo
        if (onUploadProof) {
            onUploadProof(tarea); // Llama a la nueva función pasada por props
        } else {
            console.warn("TaskItem: onUploadProof handler is missing!");
        }
    };

    // Handler para el click general en el item
    const handleItemClick = () => {
        if (onClick) {
            onClick(tarea);
        }
    };

    // --- Cálculos de estado y formato ---
    const today = startOfDay(new Date());
    const dueDate = tarea.fecha_vencimiento_orig ? parseISO(tarea.fecha_vencimiento_orig) : null;
    const isTaskOverdue = dueDate && isValid(dueDate) && isBefore(dueDate, today) && tarea.estado !== TASK_STATUS.COMPLETADA && tarea.estado !== TASK_STATUS.CANCELADA;
    const isDateOverdue = dueDate && isValid(dueDate) && isBefore(dueDate, today);

    const estadoLabel = estadoMapping[tarea.estado] || tarea.estado;
    const prioridadLabel = prioridadMapping[tarea.prioridad] || tarea.prioridad;
    const fechaVencimientoFormatted = formatSimpleDate(tarea.fecha_vencimiento_orig);
    const estadoColorName = estadoColors[tarea.estado] || 'default';
    const estadoBgColor = alpha(theme.palette[estadoColorName]?.main || theme.palette.grey[300], 0.15);
    const estadoTextColor = theme.palette[estadoColorName]?.dark || theme.palette.text.secondary;
    const prioridadColorName = prioridadColors[tarea.prioridad] || 'default';
    const prioridadIconColor = isTaskOverdue ? theme.palette.text.disabled : (theme.palette[prioridadColorName]?.main || theme.palette.action.active);

    const actionIconSize = ultraCompact ? '0.8rem' : '0.9rem';
    const priorityIconSize = ultraCompact ? '1rem' : 'small';

    return (
        <TaskItemContainer
           key={tarea.id_tarea} layout
           initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
           transition={{ type: 'spring', stiffness: 400, damping: 40 }}
        >
           <ListItem disablePadding sx={{ width: '100%', alignItems: 'stretch' }}>
               <TaskPaperStyled
                   prioridad={tarea.prioridad}
                   isOverdue={isDateOverdue} // Para el borde rojo original
                   isTaskOverdue={isTaskOverdue} // Para el estilo "muerto"
                   elevation={0}
                   onClick={handleItemClick}
                   ultraCompact={ultraCompact}
               >
                   <Stack direction="row" spacing={ultraCompact ? 0.75 : 1} alignItems="flex-start" sx={{ width: '100%' }}>
                        {/* Icono de Prioridad */}
                        <Box sx={{ mt: ultraCompact ? 0.1 : 0.2, color: prioridadIconColor }}> {/* Color ajustado */}
                           <Tooltip title={`Prioridad: ${prioridadLabel}`}>
                               {React.isValidElement(getPrioridadIcon(tarea.prioridad))
                                   ? React.cloneElement(getPrioridadIcon(tarea.prioridad), { sx: { fontSize: priorityIconSize } })
                                   : <Box sx={{ width: 16, height: 16 }} />
                               }
                           </Tooltip>
                        </Box>

                       {/* Contenido Principal */}
                       <Stack spacing={ultraCompact ? 0.15 : 0.25} sx={{ flexGrow: 1, overflow: 'hidden', pt: 0 }}>
                           {/* Título */}
                           <Tooltip title={tarea.titulo} placement="top-start">
                               <Typography
                                   variant="body2"
                                   sx={{
                                       fontWeight: 500,
                                       lineHeight: ultraCompact ? 1.3 : 1.4,
                                       textDecoration: tarea.estado === TASK_STATUS.COMPLETADA ? 'line-through' : 'none', // Usa constante
                                       color: isTaskOverdue ? 'text.disabled' : (tarea.estado === TASK_STATUS.COMPLETADA ? 'text.disabled' : 'text.primary'), // Usa constante
                                       overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                       display: 'block',
                                       fontSize: ultraCompact ? '0.75rem' : '0.8rem',
                                   }}
                               >
                                   {tarea.titulo || 'Tarea sin título'}
                               </Typography>
                           </Tooltip>
                           {/* Chips */}
                           <Stack direction="row" spacing={ultraCompact ? 0.35 : 0.5} flexWrap="wrap" useFlexGap sx={{ pt: ultraCompact ? 0.1 : 0.25 }}>
                               {/* Icono de Prueba Adjunta (como chip opcional) */}
                               {tarea.ruta_prueba_entrega && !ultraCompact && (
                                   <InfoChipStyled
                                       icon={<AttachFileIcon />} // Usar AttachFileIcon importado
                                       label="Prueba"
                                       variant="outlined"
                                       ultraCompact={ultraCompact}
                                       sx={{
                                           color: 'text.secondary',
                                           borderColor: theme.palette.grey[400],
                                           '& .MuiChip-icon': { color: 'text.secondary' },
                                           ...(isTaskOverdue ? { opacity: 0.7, color: 'text.disabled', borderColor: theme.palette.grey[400], '& .MuiChip-icon': { color: 'text.disabled' } } : {})
                                       }}
                                   />
                               )}
                               {/* Chip Proyecto */}
                               {showProjectChip && !ultraCompact && tarea.nombre_proyecto && (
                                   <InfoChipStyled
                                       icon={<FolderOpenIcon />}
                                       label={tarea.nombre_proyecto}
                                       variant="outlined" ultraCompact={ultraCompact}
                                       sx={isTaskOverdue ? { opacity: 0.7, color: 'text.disabled', borderColor: theme.palette.grey[400] } : {}}
                                   />
                               )}
                               {/* Chip Estado */}
                               <InfoChipStyled
                                   icon={getEstadoIcon(tarea.estado)}
                                   label={estadoLabel} ultraCompact={ultraCompact}
                                   sx={{
                                       color: isTaskOverdue ? theme.palette.text.disabled : estadoTextColor,
                                       bgcolor: isTaskOverdue ? alpha(theme.palette.grey[500], 0.1) : estadoBgColor,
                                       '& .MuiChip-icon': { color: isTaskOverdue ? theme.palette.text.disabled : estadoTextColor }
                                   }}
                               />
                               {/* Chip Fecha Vencimiento */}
                               {fechaVencimientoFormatted !== 'N/A' && (
                                   <InfoChipStyled
                                       icon={<CalendarTodayIcon />}
                                       label={fechaVencimientoFormatted} variant="outlined" ultraCompact={ultraCompact}
                                       sx={isTaskOverdue
                                            ? { opacity: 0.7, borderColor: theme.palette.grey[400], color: theme.palette.text.disabled } // Estilo atenuado si vencida Y no completada
                                            : (isDateOverdue ? { borderColor: 'error.light', color: 'error.dark' } : {}) // Estilo rojo si solo pasó la fecha
                                        }
                                   />
                               )}
                           </Stack>
                       </Stack>

                       {/* Botones de acción (atenuados si está vencida) */}
                       <Stack
                           direction="row" spacing={0}
                           justifyContent="flex-end" alignItems="center"
                           sx={{
                               position: 'absolute',
                               top: theme.spacing(ultraCompact ? 0.25 : 0.5),
                               right: theme.spacing(ultraCompact ? 0.5 : 0.75),
                               opacity: isTaskOverdue ? 0.6 : 1,
                           }}
                       >
                           {/* *** NUEVO: Botón Subir Prueba *** */}
                           {/* Mostrar solo si no está completada/cancelada */}
                           {tarea.estado !== TASK_STATUS.COMPLETADA && tarea.estado !== TASK_STATUS.CANCELADA && (
                               <Tooltip title={tarea.ruta_prueba_entrega ? 'Ver/Cambiar Prueba' : 'Subir Prueba'}>
                                   <IconButton
                                       size="small"
                                       onClick={handleUploadProofButtonClick} // Llama al nuevo handler
                                       aria-label="Subir prueba de entrega"
                                       sx={{ p: ultraCompact ? 0.4 : 0.5, '&:hover': { bgcolor: alpha(theme.palette.action.active, 0.06) } }}
                                   >
                                       {/* Icono cambia si ya hay prueba */}
                                       {tarea.ruta_prueba_entrega ? <AttachFileIcon sx={{ fontSize: actionIconSize }} /> : <CloudUploadIcon sx={{ fontSize: actionIconSize }} />}
                                   </IconButton>
                               </Tooltip>
                           )}
                           {/* Botón Editar */}
                           <Tooltip title="Editar Tarea">
                               <span> {/* Span necesario para Tooltip sobre botón deshabilitado */}
                                   <IconButton size="small" onClick={handleEditClick} aria-label="Editar tarea"
                                       sx={{ p: ultraCompact ? 0.4 : 0.5, '&:hover': { bgcolor: alpha(theme.palette.action.active, 0.06) } }} >
                                       <EditIcon sx={{ fontSize: actionIconSize }} />
                                   </IconButton>
                               </span>
                           </Tooltip>
                           {/* Botón Eliminar */}
                           <Tooltip title="Eliminar Tarea">
                               <span>
                                   <IconButton size="small" onClick={handleDeleteClick} aria-label="Eliminar tarea"
                                       sx={{ p: ultraCompact ? 0.4 : 0.5, color: 'error.main', '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.06) } }} >
                                       <DeleteIcon sx={{ fontSize: actionIconSize }} />
                                   </IconButton>
                               </span>
                           </Tooltip>
                       </Stack>
                   </Stack>
               </TaskPaperStyled>
           </ListItem>
       </TaskItemContainer>
   );
};

export default TaskItem;
