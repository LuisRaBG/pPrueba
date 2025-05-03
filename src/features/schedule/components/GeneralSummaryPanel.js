// src/features/schedule/components/GeneralSummaryPanel.js
import React from 'react';
import {
    Box, Typography, Stack, LinearProgress, Tooltip, alpha, useTheme, IconButton, keyframes // Asegúrate que keyframes esté importado
} from '@mui/material';
import { getUrgencyInfo } from '../utils/scheduleUtils.js';
import EventIcon from '@mui/icons-material/Event';
import { styled } from '@mui/material/styles';
// Importar funciones necesarias de date-fns
import { parseISO, isValid, format, isPast, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person'; // Icono para líder

// *** Definir la animación de las líneas (FUERA del componente) ***
const progressAnimation = keyframes`
  0% { background-position: 1rem 0; }
  100% { background-position: 0 0; }
`;

// Estilo personalizado para la barra de progreso (FUERA del componente)
const CustomLinearProgress = styled(LinearProgress)(({ theme, barcolor }) => {
    // Color más claro para las líneas
    const stripeColor = alpha(barcolor || theme.palette.grey[500], 0.4); // Usa barcolor o gris

    return {
        height: 4,
        borderRadius: 2,
        backgroundColor: alpha(barcolor || theme.palette.grey[500], 0.2),
        overflow: 'hidden', // Necesario para la animación
        '& .MuiLinearProgress-bar': {
            borderRadius: 2,
            backgroundColor: barcolor || theme.palette.grey[500], // Color base
            // Estilo de líneas diagonales animadas
            backgroundImage: `repeating-linear-gradient(
                -45deg,
                transparent,
                transparent 4px,
                ${stripeColor} 4px,
                ${stripeColor} 8px
            )`,
            backgroundSize: '0.8rem 0.8rem', // Tamaño más pequeño para barra delgada
            animation: `${progressAnimation} 1s linear infinite`, // Aplicar animación
        },
    };
});


// Función helper para formatear fechas de forma segura (sin cambios)
const formatProjectDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        // Intenta parsear, incluyendo posible reemplazo de espacio por T
        let date = parseISO(dateString);
        if (!isValid(date)) {
            date = parseISO(dateString.replace(' ', 'T'));
        }
        if (isValid(date)) {
            return format(date, 'dd MMM yyyy', { locale: es });
        }
    } catch (e) {
        console.error("Error formatting project date:", dateString, e);
    }
    return 'N/A';
};

// --- Componente SummaryItem (con botones y nombre de líder) ---
const SummaryItem = ({ project, onProjectSelect, onEditProject, onDeleteProject }) => {
    const theme = useTheme();

    const projectId = project?.id_proyecto ?? 'unknown';
    const projectName = project?.nombre ?? 'Proyecto sin nombre';
    const projectStatus = project?.estado ?? 'desconocido';
    const projectFechaInicio = project?.fecha_inicio ?? null;
    const projectFechaFin = project?.fecha_fin ?? null;
    // Usar el progreso calculado en useProjects
    const progress = project?.progress ?? 0;
    const urgency = getUrgencyInfo(projectFechaInicio, projectFechaFin, projectStatus, true);
    const { colorName = 'grey', label: urgencyLabel = 'N/A', icon: UrgencyIcon = EventIcon } = urgency || {};
    const displayStartDate = formatProjectDate(projectFechaInicio);
    const displayEndDate = formatProjectDate(projectFechaFin);
    const leaderName = project?.nombre_creador ?? 'Líder no asignado';

    // Lógica de color (sin cambios)
    let projectColor = theme.palette.grey[600];
    const paletteColor = theme.palette[colorName];
    if (paletteColor && typeof paletteColor === 'object' && paletteColor.main) { projectColor = paletteColor.main; }
    else if (typeof paletteColor === 'string') { projectColor = paletteColor; }
    else if (colorName !== 'grey') { console.warn(`Project color name "${colorName}" invalid. Using grey.`); }
    if (typeof projectColor !== 'string') { projectColor = theme.palette.grey[600]; }

    // Handlers (sin cambios)
    const handleSelect = () => {
        if (onProjectSelect && projectId !== 'unknown') {
            onProjectSelect(projectId);
        }
    };
    const handleEdit = (event) => {
        event.stopPropagation();
        if (onEditProject && project) {
            onEditProject(project);
        } else {
            console.warn("onEditProject function not provided or project data missing.");
        }
    };
    const handleDelete = (event) => {
        event.stopPropagation();
        if (onDeleteProject && project) {
            onDeleteProject(project);
        } else {
            console.warn("onDeleteProject function not provided or project data missing.");
        }
    };

    return (
        <Box
            onClick={handleSelect}
            sx={{
                position: 'relative',
                p: 1.25,
                pl: 1.5,
                borderLeft: `3px solid ${projectColor}`,
                border: `1px solid ${theme.palette.divider}`,
                borderLeftWidth: '3px',
                borderRadius: theme.shape.borderRadius / 2,
                bgcolor: 'background.paper',
                transition: theme.transitions.create(['border-color', 'background-color', 'box-shadow']),
                cursor: 'pointer',
                '&:hover': {
                    borderColor: theme.palette.divider,
                    borderLeftColor: projectColor,
                    bgcolor: alpha(theme.palette.action.hover, 0.06),
                    boxShadow: theme.shadows[2],
                    '& .project-actions': { opacity: 1 },
                }
            }}
        >
              {/* Botones de Acción (sin cambios) */}
              <Stack
                direction="row"
                spacing={0}
                className="project-actions"
                sx={{
                    position: 'absolute',
                    top: theme.spacing(0.5),
                    right: theme.spacing(0.5),
                    opacity: { xs: 1, sm: 0 },
                    transition: theme.transitions.create('opacity'),
                    zIndex: 1,
                    bgcolor: alpha(theme.palette.background.paper, 0.7),
                    borderRadius: '4px',
                    backdropFilter: 'blur(2px)',
                }}
            >
                <Tooltip title="Editar Proyecto">
                    <IconButton size="small" onClick={handleEdit} aria-label={`Editar proyecto ${projectName}`} sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.1) } }}>
                        <EditIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Eliminar Proyecto">
                    <IconButton size="small" onClick={handleDelete} aria-label={`Eliminar proyecto ${projectName}`} sx={{ color: 'text.secondary', '&:hover': { color: 'error.main', bgcolor: alpha(theme.palette.error.main, 0.1) } }}>
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Stack>

            {/* Contenido del Item (sin cambios) */}
            <Stack spacing={0.5}>
                {/* Título y Estado */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} sx={{ pr: 5 }}>
                    <Tooltip title={projectName}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.primary', flexGrow: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {projectName}
                        </Typography>
                    </Tooltip>
                    <Tooltip title={`Estado: ${urgencyLabel}`}>
                        {UrgencyIcon && <UrgencyIcon sx={{ fontSize: '0.9rem', color: projectColor, flexShrink: 0 }} />}
                    </Tooltip>
                </Stack>

                {/* Nombre del Líder */}
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.25 }}>
                    <PersonIcon sx={{ fontSize: '0.8rem', color: 'text.secondary' }} />
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', fontStyle: 'italic' }}>
                        {leaderName}
                    </Typography>
                </Stack>

                {/* Barra de Progreso (Usa CustomLinearProgress con animación) */}
                <Stack direction="row" spacing={0.75} alignItems="center">
                    <CustomLinearProgress variant="determinate" value={progress} barcolor={projectColor} sx={{ flexGrow: 1 }} />
                    <Typography variant="caption" sx={{ fontWeight: 500, color: projectColor, minWidth: '28px', textAlign: 'right' }}>
                        {progress}%
                    </Typography>
                </Stack>

                {/* Fechas */}
                 <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'right', fontSize: '0.65rem', lineHeight: 1.2 }}>
                    {displayStartDate} → {displayEndDate}
                 </Typography>
            </Stack>
        </Box>
    );
};

// --- Componente GeneralSummaryPanel (con ordenación actualizada) ---
const GeneralSummaryPanel = ({ projects = [], onProjectSelect, onEditProject, onDeleteProject }) => {

    if (!projects || projects.length === 0) {
        return ( <Box sx={{ p: 2, textAlign: 'center', color: 'text.disabled' }}><Typography>No hay información general de proyectos disponible.</Typography></Box> );
    }

    // Estados que no se consideran activos para el vencimiento (sin cambios)
    const inactiveStatuses = ['Completado', 'Cancelado'];
    const today = startOfDay(new Date());

    // Función para determinar si un proyecto está vencido (sin cambios)
    const isProjectOverdue = (project) => {
        if (!project?.fecha_fin || inactiveStatuses.includes(project?.estado)) {
            return false;
        }
        try {
            let endDate = parseISO(project.fecha_fin);
             if (!isValid(endDate)) {
                 endDate = parseISO(project.fecha_fin.replace(' ', 'T'));
             }
            return isValid(endDate) && isPast(endDate) && !inactiveStatuses.includes(project.estado);
        } catch (e) {
            console.error("Error checking if project is overdue:", project.id_proyecto, e);
            return false;
        }
    };

    // Ordenar proyectos (sin cambios)
    const sortedProjects = [...projects].sort((a, b) => {
        const isAOverdue = isProjectOverdue(a);
        const isBOverdue = isProjectOverdue(b);

        if (isAOverdue && !isBOverdue) return 1;
        if (!isAOverdue && isBOverdue) return -1;

        const dateA = a.fecha_fin ? parseISO(a.fecha_fin.replace(' ', 'T')) : null;
        const dateB = b.fecha_fin ? parseISO(b.fecha_fin.replace(' ', 'T')) : null;
        const isValidA = dateA && isValid(dateA);
        const isValidB = dateB && isValid(dateB);

        if (isValidA && !isValidB) return -1;
        if (!isValidA && isValidB) return 1;
        if (isValidA && isValidB) {
            return dateA.getTime() - dateB.getTime();
        }

        return (a.nombre || '').localeCompare(b.nombre || '');
    });

    return (
        <Stack spacing={1}>
            {sortedProjects.map((project) => (
                <SummaryItem
                    key={project.id_proyecto || `proj-${Math.random()}`}
                    project={project}
                    onProjectSelect={onProjectSelect}
                    onEditProject={onEditProject}
                    onDeleteProject={onDeleteProject}
                />
            ))}
        </Stack>
    );
};

export default GeneralSummaryPanel;
