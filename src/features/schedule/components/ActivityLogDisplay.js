// src/features/schedule/components/ActivityLogDisplay.js
import React from 'react';
import {
    List, ListItem, ListItemText, Typography, Box, CircularProgress, Alert,
    Stack, Tooltip, alpha, useTheme, Avatar
} from '@mui/material';
import { formatDistanceToNow, isValid, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    AddCircleOutline, EditOutlined, DeleteForeverOutlined,
    History, PersonOutline, CalendarTodayOutlined, TaskAlt,
    FolderOutlined as ProjectIcon,
    GroupsOutlined as TeamIcon,
    AssignmentOutlined as TaskIcon,
    AttachFileOutlined as DocumentIcon,
    PersonAddAlt1Outlined as MemberAddedIcon,
    PersonRemoveOutlined as MemberRemovedIcon,
    VpnKeyOutlined as InvitationIcon,
    CheckCircleOutline
} from '@mui/icons-material';

// --- Mapeo de Tipos de Cambio y Tablas a Iconos y Colores ---
// *** ¡¡IMPORTANTE!! Ajusta las claves aquí a los valores EXACTOS que usas ***
const changeTypeMap = {
    // Tipos de cambio genéricos (ajusta si usas otros nombres)
    creacion: { icon: AddCircleOutline, color: 'success', critical: false },
    actualizacion: { icon: EditOutlined, color: 'info', critical: false },
    eliminacion: { icon: DeleteForeverOutlined, color: 'error', critical: true },
    cambio_estado: { icon: TaskAlt, color: 'secondary', critical: false },
    // Tipos específicos (ejemplos, ajusta a tus valores reales)
    miembro_agregado: { icon: MemberAddedIcon, color: 'success', critical: false },
    miembro_eliminado: { icon: MemberRemovedIcon, color: 'error', critical: true },
    rol_actualizado: { icon: EditOutlined, color: 'info', critical: false },
    invitacion_creada: { icon: InvitationIcon, color: 'primary', critical: false },
    invitacion_aceptada: { icon: CheckCircleOutline, color: 'success', critical: false },
    documento_subido: { icon: AddCircleOutline, color: 'success', critical: false },
    documento_eliminado: { icon: DeleteForeverOutlined, color: 'error', critical: true },
    // Default
    default: { icon: History, color: 'action', critical: false },
};

// Mapeo de Tablas a Iconos (ajusta si tus nombres de tabla son diferentes)
const tableIconMap = {
    proyectos: ProjectIcon,
    equipos: TeamIcon,
    tareas: TaskIcon,
    documentos: DocumentIcon,
    invitaciones: InvitationIcon,
    default: History,
};
// --- Fin Mapeos ---

const ActivityLogDisplay = ({ entries = [], loading, error, onLogItemClick }) => {
    const theme = useTheme();

    if (loading) { return ( <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}><CircularProgress size={24} /></Box> ); }
    if (error) { return <Alert severity="error" sx={{ mt: 1, fontSize: '0.8rem' }}>{error}</Alert>; }
    if (!entries || entries.length === 0) { return <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center', fontStyle: 'italic' }}>No hay actividad registrada.</Typography>; }

    const formatRelativeTime = (dateString) => {
        if (!dateString) return 'Fecha desconocida';
        try {
            const date = parseISO(dateString.replace(' ', 'T'));
            if (isValid(date)) {
                return formatDistanceToNow(date, { addSuffix: true, locale: es });
            }
        } catch (e) {
            console.error("Error formatting date:", dateString, e);
        }
        return 'Fecha inválida';
    };

    const handleClick = (entry) => { if (onLogItemClick) { onLogItemClick(entry); } };

    return (
        <List sx={{ width: '100%', bgcolor: 'transparent', p: 0 }}>
            {entries.map((entry) => {
                const changeInfo = changeTypeMap[entry.tipo_cambio] || changeTypeMap.default;
                const IconComponent = (changeInfo.icon === History && tableIconMap[entry.tabla_afectada])
                    ? tableIconMap[entry.tabla_afectada] || History // Fallback a History si la tabla no está mapeada
                    : changeInfo.icon;
                const colorName = changeInfo.color;
                const isCritical = changeInfo.critical;

                let colorValue = theme.palette.text.secondary;
                const paletteColor = theme.palette[colorName];
                if (paletteColor) {
                    if (typeof paletteColor === 'object' && paletteColor.main) { colorValue = paletteColor.main; }
                    else if (colorName === 'action' && paletteColor.active) { colorValue = paletteColor.active; }
                    else if (typeof paletteColor === 'string') { colorValue = paletteColor; }
                }
                if (typeof colorValue !== 'string') { colorValue = theme.palette.text.secondary; }

                const isClickable = !!onLogItemClick;
                const itemStyle = {
                    mb: 0.5,
                    cursor: isClickable ? 'pointer' : 'default',
                    transition: theme.transitions.create('background-color'),
                    '&:hover': { bgcolor: isClickable ? alpha(theme.palette.action.hover, 0.04) : 'transparent' },
                };

                return (
                    <ListItem
                        key={entry.id_cambio || `log-${Math.random()}`}
                        disableGutters
                        divider
                        onClick={() => handleClick(entry)}
                        sx={{ alignItems: 'flex-start', py: 1, px: 0.5, ...itemStyle }}
                    >
                        <Box sx={{ mr: 1.25, mt: 0.25 }}>
                            <Avatar sx={{ bgcolor: alpha(colorValue, 0.15), width: 28, height: 28 }}>
                                <IconComponent sx={{ fontSize: '1rem', color: colorValue }} />
                            </Avatar>
                        </Box>
                        <ListItemText
                            primary={
                                <Typography variant="caption" component="span" sx={{ fontWeight: 500, color: 'text.primary', lineHeight: 1.3, ...(isCritical && { color: 'error.dark', fontWeight: 600 }) }}>
                                    {/* Usa la descripción del log, o genera una por defecto */}
                                    {entry.descripcion || `Cambio de tipo '${entry.tipo_cambio || 'desconocido'}' en '${entry.tabla_afectada || 'tabla desconocida'}'`}
                                </Typography>
                            }
                            secondary={
                                <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mt: 0.25 }}>
                                    <Tooltip title={entry.nombre_usuario_responsable || 'Sistema'}>
                                        <Stack direction="row" alignItems="center" spacing={0.3}>
                                            <PersonOutline sx={{ fontSize: '0.8rem', color: 'text.secondary' }} />
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                                {/* Muestra el nombre obtenido del join */}
                                                {entry.nombre_usuario_responsable || 'Sistema'}
                                            </Typography>
                                        </Stack>
                                    </Tooltip>
                                    <Tooltip title={entry.fecha_cambio || 'Fecha desconocida'}>
                                        <Stack direction="row" alignItems="center" spacing={0.3}>
                                            <CalendarTodayOutlined sx={{ fontSize: '0.8rem', color: 'text.secondary' }} />
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                                {formatRelativeTime(entry.fecha_cambio)}
                                            </Typography>
                                        </Stack>
                                    </Tooltip>
                                </Stack>
                            }
                            secondaryTypographyProps={{ component: 'div' }}
                            sx={{ my: 0 }}
                        />
                    </ListItem>
                );
            })}
        </List>
    );
};

export default ActivityLogDisplay;
