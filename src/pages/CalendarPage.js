// src/pages/CalendarPage.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box, Container, Typography, CircularProgress, Alert, useTheme, alpha,
    Stack, Button, Paper, IconButton, List, ListItem, ListItemText,
    ListItemAvatar, Avatar, Divider, Dialog, Chip // Añadir Chip
} from '@mui/material';
import {
    ArrowBackIosNew as ArrowBackIcon,
    ArrowForwardIos as ArrowForwardIcon,
    Today as TodayIcon,
    CalendarMonth as CalendarMonthIcon,
    Event as EventIcon,
    Circle,
    LabelImportant as PriorityIcon, // Para prioridad
    FolderOutlined as ProjectIcon, // Para nombre de proyecto en tarea
    AssignmentOutlined as TaskIcon // Icono para tareas
} from '@mui/icons-material';
import {
    format, parseISO, startOfDay, endOfDay, startOfWeek, endOfWeek,
    addDays, subDays, addWeeks, subWeeks, isSameDay, isWithinInterval, isValid
} from 'date-fns';
import { es } from 'date-fns/locale';
import { useCalendarData } from '../hooks/useCalendarData.js'; // Ajusta ruta
import { LocalizationProvider, DateCalendar } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// Importar utils para mapeos
import { prioridadMapping, estadoMapping, prioridadColors, estadoColors, getPrioridadIcon, getEstadoIcon } from '../features/tasks/utils/taskUtils.js'; // Ajusta ruta

// --- Componente EventListItem (Rediseñado) ---
const EventListItem = ({ event }) => {
    const theme = useTheme();
    const resourceType = event.resource?.type;
    const resourceData = event.resource?.data; // Datos originales

    let color = theme.palette.grey[500];
    let itemIcon = <EventIcon fontSize="small" />;
    let primaryText = event.title || 'Evento sin título';
    let secondaryContent = null;

    if (resourceType === 'project' && resourceData) {
        color = theme.palette.primary.main;
        itemIcon = <ProjectIcon sx={{ fontSize: '1.1rem', color: color }} />;
        primaryText = resourceData.nombre || 'Proyecto sin nombre';
        const projectStatus = resourceData.estado || 'Desconocido';
        let startDate = 'N/A', endDate = 'N/A';
        try { startDate = resourceData.fecha_inicio ? format(parseISO(resourceData.fecha_inicio), 'dd/MM', { locale: es }) : 'N/A'; } catch (e) { console.error("Error parsing project start date", e); }
        try { endDate = resourceData.fecha_fin ? format(parseISO(resourceData.fecha_fin), 'dd/MM', { locale: es }) : 'N/A'; } catch (e) { console.error("Error parsing project end date", e); }

        secondaryContent = (
            <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                <Chip
                    label={projectStatus}
                    size="small"
                    variant="outlined"
                    sx={{ height: 18, fontSize: '0.65rem', color: 'text.secondary' }}
                />
                 <Typography variant="caption" color="text.secondary">
                    ({startDate} - {endDate})
                 </Typography>
            </Stack>
        );

    } else if (resourceType === 'task' && resourceData) {
        color = theme.palette.secondary.main;
        itemIcon = <TaskIcon sx={{ fontSize: '1.1rem', color: color }} />;
        primaryText = resourceData.titulo || 'Tarea sin título';
        const taskStatus = resourceData.estado || 'Desconocido';
        const taskPriority = resourceData.prioridad || 'Media';
        const projectName = resourceData.nombre_proyecto || '';

        // Obtener icono y color de prioridad/estado de taskUtils
        const PriorityIconComp = getPrioridadIcon(taskPriority); // Devuelve JSX
        const StatusIconComp = getEstadoIcon(taskStatus);       // Devuelve JSX
        const statusColorName = estadoColors[taskStatus] || 'default';
        const statusBgColor = alpha(theme.palette[statusColorName]?.main || theme.palette.grey[300], 0.15);
        const statusTextColor = theme.palette[statusColorName]?.dark || theme.palette.text.secondary;

        secondaryContent = (
            <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                 {/* Chip de Estado Tarea */}
                 <Chip
                    // *** CORREGIDO: Usa directamente el elemento JSX ***
                    icon={StatusIconComp}
                    label={estadoMapping[taskStatus] || taskStatus}
                    size="small"
                    sx={{
                        height: 18, fontSize: '0.65rem', fontWeight: 500,
                        bgcolor: statusBgColor, color: statusTextColor,
                        borderRadius: '6px',
                        // Ajusta el estilo del icono si es necesario (pero fontSize="inherit" debería funcionar)
                        '& .MuiChip-icon': { fontSize: '1rem !important', ml: '2px !important', color: statusTextColor }
                    }}
                 />
                 {/* Chip de Prioridad Tarea */}
                 <Chip
                    // *** CORREGIDO: Usa directamente el elemento JSX ***
                    icon={PriorityIconComp}
                    label={prioridadMapping[taskPriority] || taskPriority}
                    size="small"
                    variant="outlined"
                    sx={{
                        height: 18, fontSize: '0.65rem', color: 'text.secondary',
                        // Ajusta el estilo del icono si es necesario
                         '& .MuiChip-icon': { fontSize: '1rem !important', ml: '2px !important' }
                    }}
                 />
                 {/* Nombre del Proyecto (si existe) */}
                 {projectName && (
                    <Chip
                        icon={<ProjectIcon sx={{fontSize: '1rem !important', ml: '2px !important'}} />}
                        label={projectName}
                        size="small"
                        variant="outlined"
                        sx={{ height: 18, fontSize: '0.65rem', color: 'text.secondary', fontStyle: 'italic' }}
                    />
                 )}
            </Stack>
        );
    }

    return (
        <ListItem
            alignItems="flex-start"
            sx={{
                py: 1.25, px: 1.5, borderLeft: `4px solid ${color}`,
                bgcolor: alpha(color, 0.04), mb: 0.75, borderRadius: 1.5,
                border: `1px solid ${alpha(color, 0.15)}`, borderLeftWidth: '4px',
            }}
        >
            <ListItemAvatar sx={{ minWidth: 36, mt: 0.25 }}>
                <Avatar sx={{ bgcolor: alpha(color, 0.1), width: 30, height: 30 }}>
                    {itemIcon}
                </Avatar>
            </ListItemAvatar>
            <ListItemText
                primary={primaryText}
                secondary={secondaryContent}
                primaryTypographyProps={{ variant: 'body2', fontWeight: 500, noWrap: true, mb: 0.5 }}
                secondaryTypographyProps={{ component: 'div' }}
                sx={{ my: 0 }}
            />
        </ListItem>
    );
};
// --- Fin EventListItem ---


const CalendarPage = () => {
    const theme = useTheme();
    const { events: allEvents, loading, error } = useCalendarData();
    const [currentDate, setCurrentDate] = useState(startOfDay(new Date()));
    const [viewMode, setViewMode] = useState('day');
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

    // --- Lógica de Fechas y Filtrado (sin cambios) ---
    const dateRange = useMemo(() => {
        if (viewMode === 'week') {
            return { start: startOfWeek(currentDate, { locale: es }), end: endOfWeek(currentDate, { locale: es }), };
        }
        return { start: startOfDay(currentDate), end: endOfDay(currentDate), };
    }, [currentDate, viewMode]);

    const filteredEvents = useMemo(() => {
        if (!allEvents) return [];
        return allEvents
            .filter(event => {
                if (!isValid(event.start)) return false;
                const eventEnd = event.allDay && isValid(event.end) ? subDays(event.end, 1) : event.end;
                if (!isValid(eventEnd)) return isSameDay(event.start, dateRange.start);
                const eventInterval = { start: event.start, end: eventEnd };
                return isWithinInterval(dateRange.start, eventInterval) || isWithinInterval(dateRange.end, eventInterval) ||
                       isWithinInterval(event.start, dateRange) || isWithinInterval(eventEnd, dateRange);
            })
            .sort((a, b) => a.start - b.start);
    }, [allEvents, dateRange]);

    // --- Handlers de Navegación (sin cambios) ---
    const handlePrev = () => { setCurrentDate(current => viewMode === 'week' ? subWeeks(current, 1) : subDays(current, 1)); };
    const handleNext = () => { setCurrentDate(current => viewMode === 'week' ? addWeeks(current, 1) : addDays(current, 1)); };
    const handleToday = () => { setCurrentDate(startOfDay(new Date())); };
    const handleDateChange = (newDate) => {
        if (newDate && isValid(newDate)) { setCurrentDate(startOfDay(newDate)); }
        setIsDatePickerOpen(false);
    };

    // --- Formato de Título (sin cambios) ---
    const rangeTitle = useMemo(() => {
        if (viewMode === 'week') { return `Semana del ${format(dateRange.start, 'd MMM', { locale: es })}`; }
        if (isSameDay(currentDate, new Date())) { return 'Hoy'; }
        return format(currentDate, 'EEEE, d MMM yyyy', { locale: es });
    }, [currentDate, viewMode, dateRange]);

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <Container
                maxWidth={false}
                disableGutters
                sx={{
                    mt: 1, mb: 1, height: 'calc(100vh - 60px - 8px - 8px)',
                    display: 'flex', flexDirection: 'column', px: 1,
                }}
            >
                {/* --- Barra de Herramientas Superior (sin cambios) --- */}
                <Paper elevation={1} sx={{ p: 1, mb: 1.5, borderRadius: 1.5, flexShrink: 0 }}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Stack direction="row" spacing={0.5}>
                            <IconButton onClick={handlePrev} size="small" aria-label="anterior"><ArrowBackIcon fontSize="small" /></IconButton>
                            <Button onClick={handleToday} size="small" variant="outlined" sx={{ px: 1 }}>Hoy</Button>
                            <IconButton onClick={handleNext} size="small" aria-label="siguiente"><ArrowForwardIcon fontSize="small" /></IconButton>
                        </Stack>
                        <Button onClick={() => setIsDatePickerOpen(true)} sx={{ textTransform: 'none', color: 'text.primary' }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 500, textAlign: 'center' }}>{rangeTitle}</Typography>
                        </Button>
                        <Stack direction="row" spacing={0.5}>
                            <Button size="small" onClick={() => setViewMode('day')} variant={viewMode === 'day' ? 'contained' : 'outlined'}>Día</Button>
                            <Button size="small" onClick={() => setViewMode('week')} variant={viewMode === 'week' ? 'contained' : 'outlined'}>Semana</Button>
                        </Stack>
                    </Stack>
                </Paper>

                {/* --- Lista de Eventos (sin cambios) --- */}
                <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    {loading && ( <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}><CircularProgress /></Box> )}
                    {error && ( <Alert severity="error" sx={{ m: 1 }}>{error}</Alert> )}
                    {!loading && !error && (
                        <List sx={{ flexGrow: 1, overflowY: 'auto', p: 0.5, '&::-webkit-scrollbar': { width: '5px' }, '&::-webkit-scrollbar-thumb': { backgroundColor: alpha(theme.palette.text.primary, 0.2), borderRadius: '3px' }, }}>
                            {filteredEvents.length > 0 ? (
                                filteredEvents.map(event => <EventListItem key={event.id} event={event} />)
                            ) : (
                                <Typography sx={{ textAlign: 'center', p: 3, color: 'text.secondary', fontStyle: 'italic' }}>
                                    No hay eventos para {viewMode === 'week' ? 'esta semana' : 'este día'}.
                                </Typography>
                            )}
                        </List>
                    )}
                </Box>

                {/* --- Diálogo DatePicker (sin cambios) --- */}
                <Dialog open={isDatePickerOpen} onClose={() => setIsDatePickerOpen(false)}>
                    <DateCalendar value={currentDate} onChange={handleDateChange} />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
                        <Button onClick={() => setIsDatePickerOpen(false)}>Cerrar</Button>
                    </Box>
                </Dialog>

            </Container>
        </LocalizationProvider>
    );
};

export default CalendarPage;
