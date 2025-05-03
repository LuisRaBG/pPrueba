// src/features/schedule/components/ScheduleProjectHeader.js
import React from 'react'; // Quitar useEffect, useState
import { Stack, Typography, Chip, LinearProgress, Tooltip, Box, alpha, useTheme, keyframes } from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
// Quitar imports de date-fns si ya no se usan aquí
// import { parseISO, isValid, differenceInMilliseconds, startOfDay, endOfDay } from 'date-fns';

// Definir la animación de las líneas
const shimmerAnimation = keyframes`
  0% { background-position: -200% 0; } /* Empezar más a la izquierda */
  100% { background-position: 200% 0; } /* Terminar más a la derecha */
`;

// *** CORREGIDO: Recibe 'progress' directamente ***
const ScheduleProjectHeader = ({ projectDetails, urgencyInfo, progress }) => {
    const theme = useTheme();
    // *** ELIMINADO: Estado y cálculo de dynamicProgress ***
    // const [dynamicProgress, setDynamicProgress] = useState(0);
    // useEffect(() => { ... }, [projectDetails?.fecha_inicio, projectDetails?.fecha_fin]);

    // --- Validación y Colores (sin cambios) ---
    if (!projectDetails) {
        console.warn("ScheduleProjectHeader: Falta projectDetails.");
        return null;
    }
    const safeUrgencyInfo = urgencyInfo || { colorName: 'grey', label: 'Desconocido', icon: EventIcon };
    const { colorName, label: urgencyLabel, icon: UrgencyIconComponent } = safeUrgencyInfo;

    let mainColor = theme.palette.grey[500];
    let darkColor = theme.palette.grey[700];
    let contrastTextColor = theme.palette.getContrastText(mainColor);

    if (colorName && colorName !== 'grey' && theme.palette[colorName]) {
        const paletteColor = theme.palette[colorName];
        if (paletteColor.main) mainColor = paletteColor.main;
        if (paletteColor.dark) darkColor = paletteColor.dark;
        else if (paletteColor.main) darkColor = paletteColor.main;
        else darkColor = theme.palette.grey[700];
        if (paletteColor.contrastText) contrastTextColor = paletteColor.contrastText;
        else contrastTextColor = theme.palette.getContrastText(mainColor);
    } else if (colorName !== 'grey') {
        console.warn(`ScheduleProjectHeader: Color name "${colorName}" not found in theme palette. Using grey.`);
    }

    if (typeof mainColor !== 'string') mainColor = theme.palette.grey[500];
    if (typeof darkColor !== 'string') darkColor = theme.palette.grey[700];
    if (typeof contrastTextColor !== 'string') contrastTextColor = theme.palette.getContrastText(mainColor);

    // *** CORREGIDO: Usa la prop 'progress' directamente ***
    const displayProgress = progress ?? 0; // Usa el progreso recibido o 0

    return (
        <Box
            sx={{
                p: 1.5,
                borderRadius: theme.shape.borderRadius,
                bgcolor: alpha(mainColor, 0.08),
                border: `1px solid ${alpha(mainColor, 0.3)}`
            }}
        >
            <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} flexWrap="wrap">
                    <Tooltip title={projectDetails.descripcion || projectDetails.nombre || "Detalles del proyecto"} arrow>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: darkColor, flexGrow: 1, minWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {projectDetails.nombre || "Proyecto sin nombre"}
                        </Typography>
                    </Tooltip>
                    <Chip
                        icon={UrgencyIconComponent && React.isValidElement(<UrgencyIconComponent />) ?
                              <UrgencyIconComponent sx={{ fontSize: '1rem !important', color: `${darkColor} !important` }} /> : undefined}
                        label={urgencyLabel}
                        size="small"
                        sx={{
                            bgcolor: alpha(mainColor, 0.15),
                            color: darkColor,
                            fontWeight: 500,
                            height: 22,
                            fontSize: '0.7rem',
                            borderRadius: theme.shape.borderRadius * 0.75,
                            flexShrink: 0,
                            '& .MuiChip-icon': {
                                color: `${darkColor} !important`,
                                marginLeft: '5px',
                                marginRight: '-5px',
                            }
                        }}
                    />
                </Stack>
                {/* *** CORREGIDO: Tooltip y valor usan displayProgress *** */}
                <Tooltip title={`Progreso (Tiempo Transcurrido): ${displayProgress}%`} arrow>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <LinearProgress
                            variant="determinate"
                            value={displayProgress} // Usar el progreso de la prop
                            sx={{
                                flexGrow: 1,
                                height: 10, // Un poco más gruesa para las líneas
                                borderRadius: theme.shape.borderRadius,
                                backgroundColor: alpha(darkColor, 0.15), // Fondo basado en el color oscuro
                                overflow: 'hidden', // Necesario para que las líneas no se salgan
                                '& .MuiLinearProgress-bar': {
                                    borderRadius: theme.shape.borderRadius,
                                    // --- Aplicar gradiente y animación directamente al fondo de la barra ---
                                    backgroundColor: darkColor, // Color base sigue siendo necesario
                                    backgroundImage: `linear-gradient(
                                        90deg,
                                        ${alpha(darkColor, 0.8)}, /* Inicio ligeramente más oscuro/opaco */
                                        ${alpha(theme.palette.common.white, 0.4)}, /* Punto brillante */
                                        ${alpha(darkColor, 0.8)} /* Final ligeramente más oscuro/opaco */
                                    )`,
                                    backgroundSize: '200% 100%', // Gradiente más ancho que la barra para el movimiento
                                    animation: `${shimmerAnimation} 1.8s linear infinite`, // Aplicar animación de brillo
                                }
                            }}
                        />
                        <Typography variant="caption" sx={{ fontWeight: 600, color: darkColor, flexShrink: 0 }}>
                            {displayProgress}%
                        </Typography>
                    </Stack>
                </Tooltip>
            </Stack>
        </Box>
    );
};

export default ScheduleProjectHeader;
