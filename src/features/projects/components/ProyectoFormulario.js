// src/features/projects/components/ProyectoFormulario.js
import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    CircularProgress,
    Typography,
    IconButton,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Box,
    Stack,
    alpha,
} from '@mui/material';
import { Close as CloseIcon, FolderOpenOutlined as ProjectIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
// *** AÑADIDO: Imports para DatePicker ***
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'; // O AdapterDateFns si usas v1/v2
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { es } from 'date-fns/locale'; // Importar locale español
import { isValid, parseISO } from 'date-fns'; // Importar helpers de date-fns

// Estados válidos
const projectStatuses = [
    'Planificado',
    'En Curso',
    'Completado',
    'Cancelado',
    'En Espera'
];
const defaultStatus = 'Planificado';

// Helper para obtener la fecha de hoy en formato YYYY-MM-DD
const getTodayDateString = () => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${today.getFullYear()}-${month}-${day}`;
};

const ProyectoFormulario = ({
    open,
    onClose,
    onSubmit,
    proyectoData,
    onInputChange, // Mantenemos onInputChange para otros campos
    isCreating,
    loading,
    error,
}) => {
    const theme = useTheme();

    if (!proyectoData) return null;

    const handleDialogClose = (event, reason) => {
        if (loading && reason === 'backdropClick') { return; }
        if (!loading) { onClose(); }
    };

    // *** AÑADIDO: Handler específico para cambios de fecha ***
    const handleDateChange = (name, newValue) => {
        let formattedDate = null;
        if (newValue && isValid(newValue)) { // Verifica si es una fecha válida
            try {
                // Formatea a YYYY-MM-DD para guardar consistentemente
                const month = String(newValue.getMonth() + 1).padStart(2, '0');
                const day = String(newValue.getDate()).padStart(2, '0');
                formattedDate = `${newValue.getFullYear()}-${month}-${day}`;
            } catch (e) {
                console.error("Error formatting date:", e);
                formattedDate = null; // O maneja el error como prefieras
            }
        }
        // Llama a onInputChange simulando el evento, como lo esperan tus hooks
        onInputChange({ target: { name: name, value: formattedDate } });
    };

    // --- Preparar valores para DatePicker ---
    // Valor inicial para fecha_inicio (puede ser hoy o el valor existente)
    const initialStartDateString = isCreating && !proyectoData.fecha_inicio
        ? getTodayDateString()
        : proyectoData.fecha_inicio || '';
    // Parsea las fechas string a objetos Date (o null) para los DatePicker
    const startDateValue = initialStartDateString ? parseISO(initialStartDateString) : null;
    const endDateValue = proyectoData.fecha_fin ? parseISO(proyectoData.fecha_fin) : null;


    return (
        // *** AÑADIDO: Envuelve el contenido con LocalizationProvider ***
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
            <Dialog
                open={open}
                onClose={handleDialogClose}
                fullWidth
                maxWidth="sm"
                PaperProps={{
                    component: 'form',
                    onSubmit: onSubmit,
                    sx: { borderRadius: theme.shape.borderRadius * 1.5 }
                }}
                aria-labelledby="project-form-dialog-title"
            >
                <DialogTitle sx={{
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    m: 0,
                    px: theme.spacing(3),
                    py: theme.spacing(1.5),
                }} id="project-form-dialog-title">
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <ProjectIcon color="primary" />
                            <Typography variant="h6" fontWeight="600">
                                {isCreating ? 'Crear Nuevo Proyecto' : 'Editar Proyecto'}
                            </Typography>
                        </Stack>
                        <IconButton onClick={onClose} size="small" disabled={loading} aria-label="Cerrar diálogo" sx={{ color: 'text.secondary' }}>
                            <CloseIcon />
                        </IconButton>
                    </Stack>
                </DialogTitle>
                <DialogContent dividers sx={{
                    px: theme.spacing(3),
                    py: theme.spacing(2.5),
                    bgcolor: alpha(theme.palette.grey[500], 0.02)
                }}>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2.5, borderRadius: 1 }}>
                            {error}
                        </Alert>
                    )}
                    <Grid container spacing={2.5}>
                        {/* Nombre y Descripción (sin cambios) */}
                        <Grid item xs={12}>
                            <TextField fullWidth required label="Nombre del proyecto" name="nombre" value={proyectoData.nombre || ''} onChange={onInputChange} margin="dense" variant="outlined" disabled={loading} autoFocus />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField fullWidth multiline rows={3} label="Descripción" name="descripcion" value={proyectoData.descripcion || ''} onChange={onInputChange} margin="dense" variant="outlined" disabled={loading} />
                        </Grid>

                        {/* --- CAMPO FECHA INICIO (DatePicker) --- */}
                        <Grid item xs={12} sm={6}>
                            <DatePicker
                                label="Fecha Inicio"
                                value={startDateValue} // Usa el objeto Date parseado
                                onChange={(newValue) => handleDateChange('fecha_inicio', newValue)} // Usa el handler específico
                                disabled={loading}
                                // Pasa props al TextField interno usando slotProps
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        required: true,
                                        margin: "dense",
                                        variant: "outlined",
                                        error: false, // Puedes añadir lógica de error si es necesario
                                        helperText: '', // Puedes añadir helper text
                                    }
                                }}
                                // Formato visual (opcional, el locale 'es' ayuda)
                                format="dd/MM/yyyy"
                            />
                        </Grid>

                        {/* --- CAMPO FECHA FIN (DatePicker) --- */}
                        <Grid item xs={12} sm={6}>
                            <DatePicker
                                label="Fecha Fin"
                                value={endDateValue} // Usa el objeto Date parseado
                                onChange={(newValue) => handleDateChange('fecha_fin', newValue)} // Usa el handler específico
                                disabled={loading}
                                // Opcional: Limitar fecha mínima a la fecha de inicio
                                minDate={startDateValue || undefined}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        required: true,
                                        margin: "dense",
                                        variant: "outlined",
                                        error: false,
                                        helperText: '',
                                    }
                                }}
                                format="dd/MM/yyyy"
                            />
                        </Grid>

                        {/* Estado (sin cambios) */}
                        <Grid item xs={12}>
                            <FormControl fullWidth margin="dense" variant="outlined" disabled={loading}>
                                <InputLabel id="estado-select-label">Estado</InputLabel>
                                <Select labelId="estado-select-label" label="Estado" name="estado" value={proyectoData.estado || defaultStatus} onChange={onInputChange} >
                                    {projectStatuses.map((status) => ( <MenuItem key={status} value={status}>{status}</MenuItem> ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{
                    p: theme.spacing(2),
                    borderTop: `1px solid ${theme.palette.divider}`,
                    bgcolor: alpha(theme.palette.grey[500], 0.02)
                }}>
                    <Button onClick={onClose} disabled={loading} color="inherit"> Cancelar </Button>
                    <Button type="submit" variant="contained" color="primary" disabled={loading} startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null} >
                        {loading ? 'Guardando...' : (isCreating ? 'Crear Proyecto' : 'Guardar Cambios')}
                    </Button>
                </DialogActions>
            </Dialog>
        </LocalizationProvider> // *** CIERRE del LocalizationProvider ***
    );
};

export default ProyectoFormulario;
