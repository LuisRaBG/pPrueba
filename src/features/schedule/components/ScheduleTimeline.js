// src/features/schedule/components/ScheduleTimeline.js
import React from 'react';
import {
    Timeline, TimelineItem, TimelineSeparator, TimelineConnector,
    TimelineContent, TimelineOppositeContent, TimelineDot
} from '@mui/lab';
import {
    Typography, Box, CircularProgress, Alert, Tooltip,
    useTheme, alpha, Stack, LinearProgress // Quitar Paper si no se usa
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event'; // Icono por defecto
import {
    formatDisplayDate, formatDisplayTime, calculateProgress, getUrgencyInfo // <-- RE-IMPORTAR calculateProgress
} from '../utils/scheduleUtils.js'; // Asegúrate que la ruta y funciones sean correctas
import { isValid } from 'date-fns';
// Importar iconos necesarios para detalles (si los usas en el item)
import { CalendarTodayOutlined as CalendarIcon, AccessTime as TimeIcon } from '@mui/icons-material';

// --- Componente TimelineItem Minimalista ---
const MinimalTimelineItem = ({ item, isFirst, isLast }) => { // <-- QUITAR projectProgress
    const theme = useTheme();

    // --- Datos ---
    const itemId = item?.id ?? `unknown-${Math.random()}`;
    const itemTitle = item?.title ?? 'Sin Título';
    const itemStatus = item?.status ?? 'pendiente';
    const itemPriority = item?.priority ?? 'media';
    const itemFechaInicioOrig = item?.fecha_inicio_orig ?? null;
    const itemFechaVencimientoOrig = item?.fecha_vencimiento_orig ?? null;
    const itemFechaInicioDisplay = item?.fecha_inicio_display ?? 'N/A'; // Formateado en el hook/servicio
    const itemFechaVencimientoDisplay = item?.fecha_vencimiento_display ?? 'N/A'; // Formateado en el hook/servicio
    const itemDate = item?.date ?? null; // Fecha principal del evento en el timeline
    const itemDescription = item?.description ?? ''; // Descripción (opcional)

    // --- Cálculos ---
    const taskProgress = calculateProgress(itemFechaInicioOrig, itemFechaVencimientoOrig); // <-- RE-CALCULAR progreso de la tarea
    const taskUrgency = getUrgencyInfo(itemFechaInicioOrig, itemFechaVencimientoOrig, itemStatus, false); // false para vista de tarea
    const { colorName: taskColorName = 'grey', label: taskUrgencyLabel = 'N/A', icon: TaskUrgencyIcon = EventIcon } = taskUrgency || {};

    // --- Color Principal (Basado en Urgencia/Estado) ---
    let mainColor = theme.palette.grey[600]; // Gris oscuro por defecto
    const paletteColor = theme.palette[taskColorName];
    if (paletteColor && typeof paletteColor === 'object' && paletteColor.main) { mainColor = paletteColor.main; }
    else if (typeof paletteColor === 'string') { mainColor = paletteColor; }
    if (typeof mainColor !== 'string') { mainColor = theme.palette.grey[600]; }

    // --- Fecha opuesta ---
    const isValidItemDate = itemDate && isValid(itemDate);
    const formattedDate = isValidItemDate ? formatDisplayDate(itemDate) : 'N/A'; // Usa tu helper
    const formattedTime = isValidItemDate ? formatDisplayTime(itemDate) : ''; // Usa tu helper

    // --- Tooltip ---
    // *** CORREGIDO: Tooltip muestra progreso de la TAREA ***
    const tooltipTitle = `Progreso Tarea: ${taskProgress}% | Tarea: ${itemTitle} (Prioridad: ${itemPriority || 'N/A'} / Estado: ${itemStatus || 'N/A'})`;

    return (
        <TimelineItem sx={{ '&::before': { display: 'none' }, minHeight: 'auto', py: 0.75 }}>
            {/* Contenido Opuesto (Fecha) */}
            <TimelineOppositeContent sx={{
                m: 'auto 0', flex: 0.25,
                textAlign: 'right', pr: 1.5, py: 0, pl: 0,
            }} align="right" variant="caption" color="text.secondary">
                {formattedDate}
                {formattedTime && <Typography variant="caption" display="block" sx={{ fontSize: '0.65rem' }}>{formattedTime}</Typography>}
            </TimelineOppositeContent>

            {/* Separador */}
            <TimelineSeparator>
                {/* Conector superior fino */}
                {!isFirst && <TimelineConnector sx={{ bgcolor: theme.palette.divider, width: '1px' }} />}
                {/* Punto simple Outlined */}
                <Tooltip title={tooltipTitle}>
                    <TimelineDot
                        variant="outlined"
                        sx={{
                            borderColor: mainColor, // Color del borde basado en urgencia
                            bgcolor: 'background.paper', // Fondo del papel
                            p: 0.4, // Tamaño del punto
                            m: '6px 0'
                        }}
                    />
                </Tooltip>
                {/* Conector inferior fino */}
                {!isLast && <TimelineConnector sx={{ bgcolor: theme.palette.divider, width: '1px' }} />}
            </TimelineSeparator>

            {/* Contenido Principal (Sin fondo, estructura con Stack) */}
            <TimelineContent sx={{ py: 0, px: 1.5 }}>
                <Stack spacing={0.5}>
                    {/* Título */}
                    <Typography variant="body2" component="span" fontWeight="500" sx={{ color: 'text.primary', lineHeight: 1.4 }}>
                        {itemTitle}
                    </Typography>

                    {/* Barra de Progreso Fina */}
                    <Tooltip title={`Progreso Tarea: ${taskProgress}%`}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
                            <LinearProgress
                                variant="determinate"
                                value={taskProgress} // <-- Usar taskProgress (calculado localmente)
                                sx={{
                                    flexGrow: 1, height: 3, borderRadius: 1.5, // Muy delgada
                                    backgroundColor: alpha(mainColor, 0.15),
                                    '& .MuiLinearProgress-bar': { backgroundColor: mainColor }
                                }}
                            />
                            <Typography variant="caption" sx={{ fontWeight: 500, color: alpha(mainColor, 0.9), minWidth: '25px', textAlign: 'right', fontSize: '0.65rem' }}>
                                {/* Muestra el progreso de la tarea */}
                                {(typeof taskProgress === 'number' && !isNaN(taskProgress)) ? `${taskProgress}%` : ''}
                            </Typography>
                        </Stack>
                    </Tooltip>

                    {/* Detalles (Estado, Prioridad, Fechas) - Opcional */}
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 0.25 }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                            Estado: {itemStatus}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                            Prioridad: {itemPriority}
                        </Typography>
                        {/* Puedes añadir más detalles si son necesarios */}
                        {/* <CalendarIcon sx={{ fontSize: '0.8rem', color: 'text.disabled' }} />
                        <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>
                            {itemFechaInicioDisplay} - {itemFechaVencimientoDisplay}
                        </Typography> */}
                    </Stack>
                </Stack>
            </TimelineContent>
        </TimelineItem>
    );
};


// --- Componente Principal ScheduleTimeline (Adaptado) ---
const ScheduleTimeline = ({ items = [], loading, error }) => { // <-- QUITAR projectProgress
    const theme = useTheme();

    if (loading) {
        return ( <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4, minHeight: 150 }}><CircularProgress /></Box> );
    }
    if (error) {
        return ( <Alert severity="error" sx={{ m: 2 }}>Error en Timeline: {typeof error === 'string' ? error : JSON.stringify(error)}</Alert> );
    }
    if (!items || items.length === 0) {
        return (
            <Box sx={{ textAlign: 'center', p: 3, color: 'text.secondary', mt: 4, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <EventIcon sx={{ fontSize: 36, mb: 1, color: 'text.disabled' }} />
                <Typography variant="body2">No hay eventos en el cronograma.</Typography>
                {/* Mensaje adicional si no hay tareas */}
                {items.length === 0 && <Typography variant="caption" color="text.disabled">(Puede que el proyecto no tenga tareas)</Typography>}
            </Box>
        );
    }

    // Asumiendo que los items ya vienen ordenados
    const sortedItems = items;

    return (
        // Timeline sin Paper, con scroll interno si es necesario en el padre
        <Timeline position="right" sx={{
            p: 0, // Sin padding interno
            m: 0,
            width: '100%', // Ocupa ancho
            // El scroll debe manejarlo el contenedor padre en Cronograma.js
        }}>
            {sortedItems.map((item, index) => (
                <MinimalTimelineItem
                    key={item.id || `item-${index}`}
                    item={item}
                    isFirst={index === 0}
                    isLast={index === sortedItems.length - 1}
                    // projectProgress={projectProgress} // <-- QUITAR: Ya no se pasa
                />
            ))}
        </Timeline>
    );
};

export default ScheduleTimeline;
