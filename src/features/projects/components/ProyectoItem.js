// c:\Users\Prueb\Documents\projects\proyecto\src\features\projects\components\ProyectoItem.js
import React from 'react';
import {
    Paper, Typography, Chip, styled, useTheme,
    alpha, Stack, Tooltip, IconButton, Box, SvgIcon
} from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    CalendarMonth as CalendarMonthIcon,
    FolderOutlined as FolderIcon,
} from '@mui/icons-material';
// Iconos de Lucide (manteniendo la lógica actual)
import { CheckCircle, PauseCircle, Flag, AlertCircle, XCircle } from 'lucide-react';
import { formatSimpleDate } from '../utils/projectUtils.js'; // Asegúrate que la ruta sea correcta

// --- Styled Components ---

// Container Box (sin cambios)
const ProyectoItemContainer = styled(Box)(({ theme }) => ({
    marginBottom: theme.spacing(0.75),
    '&:last-child': {
        marginBottom: 0,
    },
}));

// Paper interno con estilos refinados
const ProyectoPaperStyled = styled(Paper, {
    shouldForwardProp: (prop) => prop !== 'selected' && prop !== 'ultraCompact',
})(({ theme, selected, ultraCompact }) => ({
    padding: theme.spacing(ultraCompact ? 0.75 : 1, ultraCompact ? 1.25 : 1.5),
    // *** AJUSTADO: Consistencia en borderRadius con GeneralView ***
    borderRadius: theme.shape.borderRadius * 1.5,
    transition: theme.transitions.create(['background-color', 'border-color', 'box-shadow'], {
        duration: theme.transitions.duration.short,
        easing: theme.transitions.easing.easeInOut,
    }),
    border: `1px solid ${selected ? alpha(theme.palette.primary.main, 0.6) : theme.palette.divider}`,
    backgroundColor: selected ? alpha(theme.palette.primary.main, 0.08) : theme.palette.background.paper,
    position: 'relative',
    paddingRight: theme.spacing(ultraCompact ? 5 : 6),
    width: '100%',
    cursor: 'pointer',
    overflow: 'hidden',
    // *** AJUSTADO: Sombra base sutil (como en GeneralView) ***
    boxShadow: selected ? `0 2px 6px ${alpha(theme.palette.primary.main, 0.1)}` : theme.shadows[1],
    '&:hover': {
        backgroundColor: selected ? alpha(theme.palette.primary.main, 0.12) : alpha(theme.palette.action.hover, 0.04),
        borderColor: selected ? theme.palette.primary.main : alpha(theme.palette.grey[500], 0.4),
        // *** AJUSTADO: Sombra en hover un poco más pronunciada ***
        boxShadow: selected ? `0 3px 8px ${alpha(theme.palette.primary.main, 0.15)}` : theme.shadows[2],
    },
}));

// Base Chip Style (sin cambios)
const BaseChip = styled(Chip, {
    shouldForwardProp: (prop) => prop !== 'ultraCompact',
})(({ theme, ultraCompact }) => ({
   borderRadius: theme.shape.borderRadius * 0.6,
   fontWeight: 500,
   fontSize: ultraCompact ? '0.6rem' : '0.65rem',
   height: ultraCompact ? 16 : 18,
   padding: theme.spacing(0, ultraCompact ? 0.4 : 0.5),
   '& .MuiChip-icon, & .MuiChip-deleteIcon, & .MuiSvgIcon-root': {
       fontSize: ultraCompact ? '0.7rem' : '0.75rem',
       marginLeft: theme.spacing(ultraCompact ? 0.15 : 0.25),
       marginRight: theme.spacing(ultraCompact ? -0.6 : -0.5),
   },
   '& .MuiChip-icon.MuiSvgIcon-root': {
        marginLeft: theme.spacing(ultraCompact ? 0.25 : 0.35),
        marginRight: theme.spacing(ultraCompact ? -0.7 : -0.6),
        fontSize: ultraCompact ? '0.75rem' : '0.8rem',
   }
}));

// Estado Chip specific styles (sin cambios)
const EstadoChipStyled = styled(BaseChip)(({ theme, estado }) => {
    const colorMap = {
        activo: 'success',
        pausado: 'warning',
        completado: 'info',
        cancelado: 'error',
        default: 'default'
    };
    const selectedColorName = colorMap[estado] || 'default';
    const paletteColor = theme.palette[selectedColorName];
    let chipBackgroundColor = alpha(theme.palette.grey[500], 0.1);
    let chipTextColor = theme.palette.text.secondary;
    let iconColor = chipTextColor;
    if (paletteColor && selectedColorName !== 'default') {
        chipBackgroundColor = alpha(paletteColor.main, 0.15);
        chipTextColor = paletteColor.dark;
        iconColor = paletteColor.main;
    }
    return {
        color: chipTextColor,
        backgroundColor: chipBackgroundColor,
        '& .MuiChip-icon, & .MuiChip-deleteIcon, & .MuiSvgIcon-root': {
            color: iconColor,
        },
    };
});

// Fecha Chip specific styles (sin cambios)
const FechaChipStyled = styled(BaseChip)(({ theme }) => ({
    color: theme.palette.text.secondary,
    backgroundColor: alpha(theme.palette.grey[500], 0.08),
    border: `1px solid ${alpha(theme.palette.grey[500], 0.2)}`,
}));

// --- Icono de Estado (sin cambios) ---
const getEstadoIcon = (estado, ultraCompact) => {
    const iconSize = ultraCompact ? 10 : 12;
    const props = { size: iconSize, strokeWidth: 2 };
    switch (estado) {
        case 'activo': return <SvgIcon {...props} component={CheckCircle} inheritViewBox />;
        case 'pausado': return <SvgIcon {...props} component={PauseCircle} inheritViewBox />;
        case 'completado': return <SvgIcon {...props} component={Flag} inheritViewBox />;
        case 'cancelado': return <SvgIcon {...props} component={XCircle} inheritViewBox />;
        default: return <SvgIcon {...props} component={AlertCircle} inheritViewBox />;
    }
};

// --- Componente ProyectoItem ---
const ProyectoItem = ({
    proyecto,
    isSelected,
    onClick,
    onEdit,
    onDelete,
    ultraCompact = false,
}) => {
    const theme = useTheme();

    // Handlers (sin cambios)
    const handleEditClick = (e) => { e.stopPropagation(); onEdit(proyecto); };
    const handleDeleteClick = (e) => { e.stopPropagation(); onDelete(proyecto); };
    const handleItemClick = () => { onClick(proyecto.id_proyecto); };

    // Formato etiqueta estado (sin cambios)
    const statusLabel = proyecto?.estado?.replace('_', ' ') || 'Desconocido';
    const capitalizedStatusLabel = statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1);

    // Tamaños iconos (sin cambios)
    const actionIconSize = ultraCompact ? '1rem' : '1.1rem';
    const mainIconSize = ultraCompact ? '1rem' : 'small';

    return (
        <ProyectoItemContainer>
            <ProyectoPaperStyled
                elevation={0} // La sombra se controla con boxShadow en sx
                selected={isSelected}
                onClick={handleItemClick}
                ultraCompact={ultraCompact}
            >
                <Stack direction="row" spacing={ultraCompact ? 1 : 1.5} alignItems="flex-start">
                    {/* Icono Principal */}
                    <Box sx={{ mt: ultraCompact ? 0.25 : 0.5, color: isSelected ? 'primary.main' : 'text.secondary' }}>
                        <FolderIcon sx={{ fontSize: mainIconSize }} />
                    </Box>

                    {/* Contenido Principal */}
                    <Stack spacing={ultraCompact ? 0.25 : 0.5} sx={{ flexGrow: 1, overflow: 'hidden', pt: 0 }}>
                        <Tooltip title={proyecto.nombre} placement="top-start">
                            <Typography
                                variant="body2"
                                sx={{
                                    fontWeight: 500,
                                    color: 'text.primary',
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    lineHeight: ultraCompact ? 1.3 : 1.4,
                                    fontSize: ultraCompact ? '0.75rem' : '0.875rem',
                                    display: 'block',
                                }}
                            >
                                {proyecto.nombre || 'Proyecto sin nombre'}
                            </Typography>
                        </Tooltip>

                        {/* Chips de Información */}
                        <Stack direction="row" spacing={ultraCompact ? 0.25 : 0.35} flexWrap="wrap" useFlexGap sx={{ width: '100%', pt: ultraCompact ? 0.1 : 0 }}>
                            <EstadoChipStyled
                                label={capitalizedStatusLabel}
                                estado={proyecto.estado}
                                icon={getEstadoIcon(proyecto.estado, ultraCompact)}
                                ultraCompact={ultraCompact}
                            />
                            <FechaChipStyled
                                label={`Inicio: ${formatSimpleDate(proyecto.fecha_inicio)}`}
                                icon={<CalendarMonthIcon />}
                                ultraCompact={ultraCompact}
                            />
                            <FechaChipStyled
                                label={`Fin: ${formatSimpleDate(proyecto.fecha_fin)}`}
                                icon={<CalendarMonthIcon />}
                                ultraCompact={ultraCompact}
                            />
                        </Stack>
                    </Stack>

                    {/* Botones de Acción (sin cambios) */}
                    <Stack
                        direction="row"
                        spacing={0.1}
                        justifyContent="flex-end"
                        alignItems="center"
                        sx={{
                            position: 'absolute',
                            top: theme.spacing(ultraCompact ? 0.5 : 0.75),
                            right: theme.spacing(ultraCompact ? 0.75 : 1),
                        }}
                    >
                        <Tooltip title="Editar Proyecto" arrow>
                            <IconButton
                                onClick={handleEditClick} color="default" size="small" aria-label="Editar proyecto"
                                sx={{
                                    p: ultraCompact ? 0.5 : 0.75,
                                    color: 'text.secondary',
                                    '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }
                                }}
                            >
                                <EditIcon sx={{ fontSize: actionIconSize }} />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar Proyecto" arrow>
                            <IconButton
                                onClick={handleDeleteClick} color="default" size="small" aria-label="Eliminar proyecto"
                                sx={{
                                    p: ultraCompact ? 0.5 : 0.75,
                                    color: 'text.secondary',
                                    '&:hover': { backgroundColor: alpha(theme.palette.error.main, 0.1), color: 'error.main' }
                                }}
                            >
                                <DeleteIcon sx={{ fontSize: actionIconSize }} />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                </Stack>
            </ProyectoPaperStyled>
        </ProyectoItemContainer>
    );
};

export default ProyectoItem;
