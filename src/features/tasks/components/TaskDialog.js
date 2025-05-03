// c:\Users\Prueb\Documents\projects\proyecto\src\features\tasks\components\TaskDialog.js
import React from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    TextField, Grid, CircularProgress, Typography, IconButton,
    FormControl, InputLabel, Select, MenuItem, Alert, Box,
    Stack, Chip, InputAdornment, useTheme, alpha, Link // Añadir Link
} from '@mui/material';
import {
    Close as CloseIcon, Title as TitleIcon, Notes as NotesIcon,
    Event as EventIcon, LabelImportant as LabelImportantIcon,
    CheckCircle as CheckCircleIcon,
    // ELIMINADO: Iconos de prueba ya no se usan aquí
    // FolderOpenOutlined as FolderIcon,
    // AttachFile as AttachFileIcon,
    // Link as LinkIcon
} from '@mui/icons-material';
import {
    prioridadMapping, estadoMapping, getPrioridadIcon, getEstadoIcon,
    estadoColors // <-- TASK_STATUS was incorrectly imported here
} from '../utils/taskUtils.js'; // Importar utils
// *** CORREGIDO: Importar TASK_STATUS desde taskService ***
import { TASK_STATUS } from '../services/taskService.js'; // Ajusta la ruta si es necesario
// *** ELIMINADO: Ya no se importa DocumentUpload aquí ***
// import DocumentUpload from '.././../schedule/components/DocumentUpload.js';

// Helper component for consistent MenuItem content
const SelectOptionItem = ({ icon, text }) => (
    <Stack direction="row" alignItems="center" spacing={1.5}>
        {icon}
        <Typography variant="body2">{text}</Typography>
    </Stack>
);



// Helper component for consistent State Chip in Select/MenuItem
const StateChip = ({ stateKey, theme }) => {
    const label = estadoMapping[stateKey] || stateKey;
    const icon = getEstadoIcon(stateKey);
    const colorName = estadoColors[stateKey] || 'default';
    const bgColor = alpha(theme.palette[colorName]?.main || theme.palette.grey[300], 0.15);
    const textColor = theme.palette[colorName]?.dark || theme.palette.text.secondary;

    return (
        <Chip
            icon={icon}
            label={label}
            size="small"
            sx={{
                bgcolor: bgColor,
                color: textColor,
                height: 24,
                fontSize: '0.75rem',
                borderRadius: theme.shape.borderRadius * 0.75,
                '.MuiChip-icon': { fontSize: '1rem', ml: 0.5 },
                ml: -0.5
            }}
        />
    );
};


const TaskDialog = ({
    open,
    onClose,
    onSubmit,
    formData,
    onInputChange,
    isEditing, // <-- ELIMINADO: onProofUploadSuccess ya no se necesita aquí
    loading,
    error,
}) => {
    const theme = useTheme();

    if (!open || !formData) {
        return null;
    }

    const handleDialogClose = (event, reason) => {
        if (loading && reason === 'backdropClick') {
            return;
        }
        if (!loading) {
            onClose();
        }
    };

    // Define los nuevos estados
    const taskStatuses = [
        'Pendiente',
        'En Progreso',
        'Completada',
        'Bloqueada',
        'Cancelada'
    ];
    const defaultStatus = 'Pendiente';

    // *** NUEVO: Define las nuevas prioridades ***
    const taskPriorities = [
        'Baja',
        'Media',
        'Alta',
        'Urgente'
    ];
    const defaultPriority = 'Media'; // Nueva prioridad por defecto

    return (
        <Dialog
            open={open}
            onClose={handleDialogClose}
            fullWidth
            maxWidth="sm"
            PaperProps={{
                component: 'form',
                onSubmit: onSubmit,
            }}
            aria-labelledby="task-dialog-title"
        >
            <DialogTitle
                sx={{
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    py: 1.5, px: 2.5
                }}
                id="task-dialog-title"
            >
                <Typography variant="h6" fontWeight="600">
                    {isEditing ? 'Editar Tarea' : 'Nueva Tarea'}
                </Typography>
                <IconButton onClick={onClose} size="small" disabled={loading} aria-label="Cerrar diálogo">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ px: theme.spacing(3), py: theme.spacing(2) }}>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}
                <Grid container spacing={2}>
                    {/* Campos Título, Descripción, Fechas (sin cambios) */}
                    <Grid item xs={12}>
                        <TextField fullWidth required label="Título" name="titulo" value={formData.titulo || ''} onChange={onInputChange} margin="dense" variant="outlined" disabled={loading} autoFocus InputProps={{ startAdornment: <InputAdornment position="start"><TitleIcon color="action" /></InputAdornment> }} />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField fullWidth label="Descripción" name="descripcion" value={formData.descripcion || ''} onChange={onInputChange} multiline rows={3} margin="dense" variant="outlined" disabled={loading} InputProps={{ startAdornment: <InputAdornment position="start"><NotesIcon color="action" /></InputAdornment> }} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth label="Fecha Inicio" type="date" name="fecha_inicio" value={formData.fecha_inicio || ''} onChange={onInputChange} InputLabelProps={{ shrink: true }} margin="dense" variant="outlined" disabled={loading} InputProps={{ startAdornment: <InputAdornment position="start"><EventIcon color="action" /></InputAdornment> }} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField fullWidth required label="Fecha Vencimiento" type="date" name="fecha_vencimiento" value={formData.fecha_vencimiento || ''} onChange={onInputChange} InputLabelProps={{ shrink: true }} margin="dense" variant="outlined" disabled={loading} InputProps={{ startAdornment: <InputAdornment position="start"><EventIcon color="action" /></InputAdornment> }} />
                    </Grid>

                    {/* Select de Prioridad (ACTUALIZADO) */}
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth margin="dense" variant="outlined" disabled={loading}>
                            <InputLabel id="prioridad-select-label">Prioridad</InputLabel>
                            <Select
                                labelId="prioridad-select-label"
                                label="Prioridad"
                                name="prioridad"
                                // *** ACTUALIZADO: Usa el nuevo defaultPriority ***
                                value={formData.prioridad || defaultPriority}
                                onChange={onInputChange}
                                startAdornment={<InputAdornment position="start"><LabelImportantIcon color="action" /></InputAdornment>}
                                renderValue={(selectedValue) => (
                                     <SelectOptionItem
                                         icon={getPrioridadIcon(selectedValue)}
                                         // *** Asume que prioridadMapping tiene las nuevas claves ***
                                         text={prioridadMapping[selectedValue] || selectedValue}
                                     />
                                 )}
                            >
                                {/* *** ACTUALIZADO: Mapea las nuevas prioridades *** */}
                                {taskPriorities.map((priorityKey) => (
                                    <MenuItem key={priorityKey} value={priorityKey}>
                                        {/* Asume que getPrioridadIcon y prioridadMapping pueden manejar las nuevas claves */}
                                        <SelectOptionItem
                                            icon={getPrioridadIcon(priorityKey)}
                                            text={prioridadMapping[priorityKey] || priorityKey}
                                        />
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* Select de Estado (sin cambios respecto a la versión anterior) */}
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth margin="dense" variant="outlined" disabled={loading}>
                            <InputLabel id="estado-select-label">Estado</InputLabel>
                            <Select
                                labelId="estado-select-label"
                                label="Estado"
                                name="estado"
                                value={formData.estado || defaultStatus}
                                onChange={onInputChange}
                                startAdornment={<InputAdornment position="start"><CheckCircleIcon color="action" /></InputAdornment>}
                                renderValue={(selectedValue) => (
                                    <StateChip stateKey={selectedValue} theme={theme} />
                                )}
                            >
                                {taskStatuses.map((statusKey) => (
                                    <MenuItem key={statusKey} value={statusKey}>
                                        <StateChip stateKey={statusKey} theme={theme} sx={{ width: '100%', ml: 0 }} />
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* --- ELIMINADO: Sección Prueba de Entrega --- */}
                </Grid>
            </DialogContent>
            <DialogActions sx={{ p: theme.spacing(2), borderTop: `1px solid ${theme.palette.divider}` }}>
                <Button onClick={onClose} disabled={loading} color="inherit">
                    Cancelar
                </Button>
                <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                >
                    {loading ? 'Guardando...' : (isEditing ? 'Guardar Cambios' : 'Crear Tarea')}
                </Button>
                {/* ELIMINADO: Ya no se necesita el chequeo de prueba aquí */}
                {/* {formData.estado === TASK_STATUS.COMPLETADA && !formData.ruta_prueba_entrega && <Typography variant="caption" color="warning.main" sx={{ ml: 1 }}>Debes subir una prueba.</Typography>} */}
            </DialogActions>
        </Dialog>
    );
};

export default TaskDialog;
