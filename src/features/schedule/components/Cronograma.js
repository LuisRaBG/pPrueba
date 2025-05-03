// src/features/schedule/components/Cronograma.js
import React, { useState, useCallback } from 'react';
import {
    Box, Typography, CircularProgress, Alert, Stack, useTheme, Paper, alpha,
    Chip, // Mantenemos Chip para filtros por ahora
    Button // Añadido Button para filtros alternativos
} from '@mui/material';
import { useScheduleData } from '../hooks/useScheduleData.js';
import ScheduleTimeline from './ScheduleTimeline.js'; // Importa el timeline rediseñado
import ScheduleProjectHeader from './ScheduleProjectHeader.js';
import ActivityLogDetailDialog from './ActivityLogDetailDialog.js';
import GeneralView from './GeneralView.js';
import {
    WarningAmber as WarningIcon,
    ErrorOutline as ErrorIcon,
    InfoOutlined as InfoIcon,
    FlagOutlined as FlagIcon,
    FilterList as FilterListIcon,
    Check as CheckIcon
} from '@mui/icons-material';

// Opciones de Filtro (sin cambios)
const priorityFilters = [
    { value: 'all', label: 'Todas', icon: null, color: 'default' },
    { value: 'alta', label: 'Alta', icon: <WarningIcon sx={{ fontSize: '1rem' }} />, color: 'warning' },
    { value: 'media', label: 'Media', icon: <InfoIcon sx={{ fontSize: '1rem' }} />, color: 'info' },
    { value: 'baja', label: 'Baja', icon: <FlagIcon sx={{ fontSize: '1rem' }} />, color: 'success' },
];

// Recibe activityLog para la vista global
const Cronograma = ({ selectedProjectId = null, activityLog }) => {
    const theme = useTheme();
    const {
        timelineItems,
        selectedProjectDetails,
        generalProjectsData,
        projectProgress, // Se mantiene para ScheduleProjectHeader
        projectUrgencyInfo,
        loading,
        error,
        filters,
        handleFilterChange,
    } = useScheduleData(selectedProjectId);

    // --- Estado y Handlers Diálogo Log (sin cambios) ---
    const [selectedLogEntry, setSelectedLogEntry] = useState(null);
    const [isLogDetailOpen, setIsLogDetailOpen] = useState(false);
    const handleLogItemClick = useCallback((logEntry) => { setSelectedLogEntry(logEntry); setIsLogDetailOpen(true); }, []);
    const handleCloseLogDetail = useCallback(() => { setIsLogDetailOpen(false); setTimeout(() => setSelectedLogEntry(null), theme.transitions.duration.leavingScreen); }, [theme.transitions.duration.leavingScreen]);

    // --- Renderizado Carga/Error (sin cambios) ---
    if (loading) {
        return ( <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}><CircularProgress size={50} thickness={4} /></Box> );
    }
    if (error) {
        return ( <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}><Alert severity="error" variant="outlined" icon={<ErrorIcon />} sx={{ width: '100%', maxWidth: 600 }}>Error al cargar datos: {error}</Alert></Box> );
    }

    // --- Renderizado Principal ---
    return (
        // Contenedor principal con scroll
        <Box sx={{
            width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
            gap: 1.5, p: 0, // Padding gestionado por TabPanel
            overflowY: 'auto', overflowX: 'hidden',
            bgcolor: 'background.default', // Fondo general gris claro
            '&::-webkit-scrollbar': { width: '6px' },
            '&::-webkit-scrollbar-thumb': { backgroundColor: alpha(theme.palette.text.primary, 0.2), borderRadius: '3px' }
        }}>

            {/* === VISTA ESPECÍFICA DEL PROYECTO === */}
            {selectedProjectId && (
                <>
                    {/* --- Cabecera y Filtros (Estilo Minimalista) --- */}
                    <Paper
                        variant="outlined" // Borde en lugar de sombra
                        sx={{
                            p: 1.5, flexShrink: 0, m: 1.5, mb: 0,
                            borderRadius: 1, // Bordes menos redondeados
                            bgcolor: 'background.paper' // Fondo blanco
                        }}
                    >
                        <Stack spacing={1.5}>
                            {/* Cabecera del proyecto */}
                            {selectedProjectDetails && projectUrgencyInfo && (
                                <ScheduleProjectHeader
                                    projectDetails={selectedProjectDetails}
                                    urgencyInfo={projectUrgencyInfo}
                                    progress={projectProgress} // La cabecera sí usa el progreso general
                                />
                            )}
                            {/* Filtros (Botones Outlined) */}
                            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                                <FilterListIcon sx={{ color: 'text.secondary', fontSize: '1.1rem' }} />
                                <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                                    Prioridad:
                                </Typography>
                                {priorityFilters.map((filter) => {
                                    const isSelected = filters.priority === filter.value;
                                    return (
                                        <Button
                                            key={filter.value}
                                            size="small"
                                            variant={isSelected ? "contained" : "outlined"} // Contained para seleccionado
                                            color={isSelected ? 'primary' : 'inherit'} // Azul primario si seleccionado
                                            onClick={() => handleFilterChange('priority', filter.value)}
                                            startIcon={filter.icon}
                                            sx={{
                                                textTransform: 'none',
                                                fontSize: '0.75rem',
                                                fontWeight: isSelected ? 600 : 400,
                                                py: 0.25, px: 1,
                                                minWidth: 'auto',
                                                borderColor: isSelected ? 'primary.main' : 'divider',
                                                bgcolor: isSelected ? 'primary.main' : 'transparent',
                                                color: isSelected ? 'primary.contrastText' : 'text.secondary',
                                                '& .MuiButton-startIcon': { mr: 0.5, '& svg': { fontSize: '1rem' } },
                                                '&:hover': {
                                                    bgcolor: isSelected ? 'primary.dark' : alpha(theme.palette.action.hover, 0.06),
                                                    borderColor: isSelected ? 'primary.dark' : 'grey.400',
                                                }
                                            }}
                                        >
                                            {filter.label}
                                        </Button>
                                    );
                                })}
                            </Stack>
                        </Stack>
                    </Paper>

                    {/* --- Timeline (directamente en el contenedor scrollable) --- */}
                    <Box sx={{ flexGrow: 1, px: { xs: 1, sm: 2 }, pt: 1 }}> {/* Padding ajustado */}
                        <ScheduleTimeline
                            items={timelineItems}
                            loading={false}
                            // projectProgress={projectProgress} // <-- QUITAR: Ya no se pasa el progreso general
                            error={null}
                        />
                    </Box>
                </>
            )}

            {/* === VISTA GENERAL (SIN PROYECTO SELECCIONADO) === */}
            {!selectedProjectId && (
                <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', width: '100%', minHeight: 0 }}>
                    {/* GeneralView ocupa todo el espacio */}
                    <GeneralView
                        projectsData={generalProjectsData}
                        activityLog={activityLog}
                        onLogItemClick={handleLogItemClick}
                    />
                </Box>
            )}

            {/* Diálogo Detalles Log (sin cambios) */}
            <ActivityLogDetailDialog
                logEntry={selectedLogEntry}
                open={isLogDetailOpen}
                onClose={handleCloseLogDetail}
            />
        </Box>
    );
};

export default Cronograma;
