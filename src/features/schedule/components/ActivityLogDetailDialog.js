// src/features/schedule/components/ActivityLogDetailDialog.js
import React from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Typography, Stack, Divider, Chip, alpha, useTheme
} from '@mui/material';
import {
    InfoOutlined, CalendarMonth, PersonOutline, Storage, VpnKey,
    EditAttributes, CompareArrows, Label, Description, CheckCircleOutline, ErrorOutline, WarningAmber, HelpOutline
} from '@mui/icons-material';
import { format, isValid, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

// Helper para mostrar valores (sin cambios)
const ValueDisplay = ({ value }) => {
    const theme = useTheme();
    let displayValue = value;
    let icon = <HelpOutline fontSize="inherit" />;
    let bgColor = alpha(theme.palette.grey[500], 0.1);
    let textColor = theme.palette.text.secondary;

    if (value === null || value === undefined) {
        displayValue = '(Vacío/Null)';
        icon = <ErrorOutline fontSize="inherit" />;
        bgColor = alpha(theme.palette.warning.main, 0.1);
        textColor = theme.palette.warning.dark;
    } else if (typeof value === 'string' && value.trim() === '') {
        displayValue = '(Cadena Vacía)';
        icon = <WarningAmber fontSize="inherit" />;
        bgColor = alpha(theme.palette.info.main, 0.1);
        textColor = theme.palette.info.dark;
    } else if (typeof value === 'boolean') {
        displayValue = value ? 'Verdadero' : 'Falso';
        icon = <CheckCircleOutline fontSize="inherit" />;
        bgColor = alpha(theme.palette.success.main, 0.1);
        textColor = theme.palette.success.dark;
    } else {
        displayValue = String(value);
        icon = <Label fontSize="inherit" />;
    }

    return (
        <Chip
            icon={icon}
            label={displayValue}
            size="small"
            variant="outlined"
            sx={{ height: 'auto', minHeight: 22, '& .MuiChip-label': { display: 'block', whiteSpace: 'normal', py: 0.5 }, bgcolor: bgColor, color: textColor, borderColor: alpha(textColor, 0.3), maxWidth: '100%' }}
        />
    );
};


// Componente para mostrar un detalle específico del log (sin cambios)
const LogDetailItem = ({ icon, label, value, isValueComponent = false }) => (
    <Stack direction="row" spacing={1.5} alignItems="flex-start">
        {React.cloneElement(icon, { sx: { color: 'text.secondary', fontSize: '1.2rem', mt: 0.5, flexShrink: 0 } })}
        <Stack spacing={0.25} sx={{ overflow: 'hidden', width: '100%' }}>
            <Typography variant="caption" color="text.secondary">{label}</Typography>
            {isValueComponent ? value : (
                <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                    {(value !== null && value !== undefined && value !== '') ? value :
                     <Typography component="span" variant="body2" sx={{ fontStyle: 'italic', color: 'text.disabled' }}>N/A</Typography>}
                </Typography>
            )}
        </Stack>
    </Stack>
);

const ActivityLogDetailDialog = ({ logEntry, open, onClose }) => {
    const theme = useTheme();

    if (!logEntry) {
        return null;
    }

    // Formatear fecha completa (validando el objeto Date)
    let formattedTimestamp = 'Fecha inválida';
    // Usa fecha_cambio_dt si existe y es válida (creada en el servicio)
    if (logEntry.fecha_cambio_dt && isValid(logEntry.fecha_cambio_dt)) {
        try {
            formattedTimestamp = format(logEntry.fecha_cambio_dt, "PPPpp", { locale: es });
        } catch (e) {
            console.error("Error formatting log date:", e);
        }
    } else if (logEntry.fecha_cambio) { // Fallback si fecha_cambio_dt no está
         try {
            const date = parseISO(logEntry.fecha_cambio.replace(' ', 'T'));
             if (isValid(date)) {
                 formattedTimestamp = format(date, "PPPpp", { locale: es });
             }
         } catch(e) {
             console.error("Error parsing/formatting fallback log date:", e);
         }
    }


    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth scroll="paper">
            <DialogTitle sx={{ borderBottom: `1px solid ${theme.palette.divider}`, pb: 1.5 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                    <InfoOutlined color="primary" />
                    <Typography variant="h6" component="span">Detalles del Registro de Actividad</Typography>
                </Stack>
            </DialogTitle>
            <DialogContent dividers sx={{ bgcolor: alpha(theme.palette.grey[500], 0.04) }}>
                <Stack spacing={2.5} sx={{ py: 2 }}>
                    <LogDetailItem icon={<VpnKey />} label="ID del Cambio" value={logEntry.id_cambio} />
                    <LogDetailItem icon={<CalendarMonth />} label="Fecha y Hora" value={formattedTimestamp} />
                    {/* Muestra el nombre del usuario obtenido del join */}
                    <LogDetailItem icon={<PersonOutline />} label="Usuario Responsable" value={logEntry.nombre_usuario_responsable || 'Sistema'} />
                    <Divider sx={{ my: 1 }} />
                    <LogDetailItem icon={<EditAttributes />} label="Tipo de Cambio" value={logEntry.tipo_cambio || 'Desconocido'} />
                    <LogDetailItem icon={<Description />} label="Descripción Automática" value={logEntry.descripcion || '(Sin descripción)'} />
                    <Divider sx={{ my: 1 }} />
                    <LogDetailItem icon={<Storage />} label="Tabla Afectada" value={logEntry.tabla_afectada || 'N/A'} />
                    <LogDetailItem icon={<VpnKey />} label="ID del Registro Afectado" value={logEntry.id_registro_afectado ?? 'N/A'} />

                    {/* Muestra detalles de modificación si existen */}
                    {(logEntry.campo_modificado || logEntry.valor_anterior !== undefined || logEntry.valor_nuevo !== undefined) && (
                        <>
                            <Divider sx={{ my: 1, borderStyle: 'dashed' }} />
                            <LogDetailItem icon={<Label />} label="Campo Modificado" value={logEntry.campo_modificado || '(No especificado)'} />
                            <LogDetailItem icon={<CompareArrows />} label="Valor Anterior" isValueComponent value={<ValueDisplay value={logEntry.valor_anterior} />} />
                            <LogDetailItem icon={<CompareArrows sx={{ transform: 'rotate(180deg)' }} />} label="Valor Nuevo" isValueComponent value={<ValueDisplay value={logEntry.valor_nuevo} />} />
                        </>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions sx={{ borderTop: `1px solid ${theme.palette.divider}`, pt: 1.5, pb: 1.5, px: 2 }}>
                <Button onClick={onClose} variant="outlined">Cerrar</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ActivityLogDetailDialog;
