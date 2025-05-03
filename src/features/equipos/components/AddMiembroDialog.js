// src/features/equipos/components/AddMiembroDialog.js
import React, { useState, useEffect, useMemo, useCallback } from 'react'; // Añadir useMemo, useCallback
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Autocomplete,
    CircularProgress,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Alert
} from '@mui/material';

// --- Placeholder para la función de búsqueda (SIN CAMBIOS) ---
// En una app real, esto debería venir de un servicio e interactuar con tu API
const searchUsuarios = async (term) => {
    console.warn("searchUsuarios no implementado. Usando datos de ejemplo.");
    await new Promise(resolve => setTimeout(resolve, 500)); // Simula delay
    const allUsers = [
        { id_usuario: 1, nombre: 'Alice Wonderland', email: 'alice@example.com' },
        { id_usuario: 2, nombre: 'Bob The Builder', email: 'bob@example.com' },
        { id_usuario: 10, nombre: 'Charlie Chaplin', email: 'charlie@example.com' },
        { id_usuario: 13, nombre: 'Diana Prince', email: 'diana@example.com' },
        { id_usuario: 14, nombre: 'Ethan Hunt', email: 'ethan@example.com' },
        // Añade más usuarios si es necesario para probar
    ];
    if (!term) return [];
    return allUsers.filter(u =>
        u.nombre.toLowerCase().includes(term.toLowerCase()) ||
        u.email.toLowerCase().includes(term.toLowerCase())
    );
};
// --- Fin Placeholder ---

const rolesPermitidos = ['lider', 'colaborador', 'observador'];

const AddMiembroDialog = ({ open, onClose, onAdd, idProyecto, miembrosActuales = [] }) => {
    const [selectedUser, setSelectedUser] = useState(null);
    const [inputValue, setInputValue] = useState('');
    const [options, setOptions] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [rol, setRol] = useState('colaborador');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // *** CORRECCIÓN: Memoizar idsMiembrosActuales ***
    const idsMiembrosActuales = useMemo(() => {
        return miembrosActuales.map(m => m.id_usuario);
    }, [miembrosActuales]); // Solo recalcula si miembrosActuales cambia

    // Efecto para buscar usuarios con debounce
    useEffect(() => {
        let active = true;
        if (inputValue === '') {
            setOptions(selectedUser ? [selectedUser] : []);
            setLoadingUsers(false); // Asegurar que el loading se quite si el input está vacío
            return undefined;
        }

        setLoadingUsers(true);
        setError(null); // Limpiar error al empezar nueva búsqueda

        const fetchDelay = setTimeout(async () => {
            try {
                // Llama a la función de búsqueda
                const users = await searchUsuarios(inputValue);

                if (active) {
                    // Filtra usuarios que ya están en el equipo usando el array memoizado
                    const usuariosFiltrados = users.filter(u => !idsMiembrosActuales.includes(u.id_usuario));

                    let newOptions = [];
                    // Mantener el usuario seleccionado en la lista si ya no aparece en los resultados filtrados
                    if (selectedUser && !usuariosFiltrados.some(u => u.id_usuario === selectedUser.id_usuario)) {
                        newOptions = [selectedUser, ...usuariosFiltrados];
                    } else {
                        newOptions = usuariosFiltrados;
                    }
                    setOptions(newOptions);
                }
            } catch (searchError) {
                console.error("Error buscando usuarios:", searchError);
                if (active) {
                    setError("Error al buscar usuarios."); // Mostrar error genérico
                    setOptions([]);
                }
            } finally {
                if (active) {
                    setLoadingUsers(false);
                }
            }
        }, 500); // Espera 500ms

        return () => {
            active = false;
            clearTimeout(fetchDelay);
        };
        // *** CORRECCIÓN: Usar idsMiembrosActuales memoizado en dependencias ***
    }, [inputValue, selectedUser, idsMiembrosActuales]); // Depende del input, usuario seleccionado y IDs actuales

    // *** CORRECCIÓN: Envolver handleClose en useCallback ***
    const handleClose = useCallback(() => {
        setSelectedUser(null);
        setInputValue('');
        setOptions([]);
        setRol('colaborador');
        setError(null);
        setSubmitting(false);
        if (onClose) { // Llama a onClose si existe
            onClose();
        }
    }, [onClose]); // Depende de onClose

    // *** CORRECCIÓN: Envolver handleAddClick en useCallback ***
    const handleAddClick = useCallback(async () => {
        if (!selectedUser || !selectedUser.id_usuario) {
            setError("Por favor, selecciona un usuario válido.");
            return;
        }
        setError(null);
        setSubmitting(true);
        try {
            // Llama a la función onAdd pasada como prop (que ahora debería estar memoizada en el padre)
            await onAdd(idProyecto, selectedUser.id_usuario, rol);
            handleClose(); // Cierra y resetea si tiene éxito
        } catch (addError) {
            // Muestra el error específico devuelto por onAdd
            setError(addError.message || 'Error desconocido al añadir miembro.');
        } finally {
            setSubmitting(false);
        }
    }, [selectedUser, idProyecto, rol, onAdd, handleClose]); // Dependencias necesarias

    return (
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
            <DialogTitle>Añadir Miembro al Proyecto {idProyecto}</DialogTitle>
            <DialogContent>
                <Box component="form" noValidate autoComplete="off" sx={{ mt: 1 }}>
                    <Autocomplete
                        id="usuario-autocomplete"
                        sx={{ mb: 2 }}
                        options={options}
                        getOptionLabel={(option) => `${option.nombre} (${option.email})` || ""}
                        filterOptions={(x) => x}
                        autoComplete
                        includeInputInList
                        filterSelectedOptions
                        value={selectedUser}
                        loading={loadingUsers} // Mostrar estado de carga
                        loadingText="Buscando..." // Texto mientras carga
                        noOptionsText="No hay usuarios disponibles o que coincidan"
                        onChange={(event, newValue) => {
                            // Limpiar opciones si se deselecciona
                            setOptions(newValue ? [newValue, ...options.filter(o => o.id_usuario !== newValue.id_usuario)] : []);
                            setSelectedUser(newValue);
                            setError(null); // Limpiar error al seleccionar
                        }}
                        onInputChange={(event, newInputValue) => {
                            setInputValue(newInputValue);
                        }}
                        isOptionEqualToValue={(option, value) => option.id_usuario === value.id_usuario}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Buscar Usuario (nombre o email)"
                                fullWidth
                                error={!!error && !selectedUser} // Mostrar error si no hay usuario seleccionado
                                helperText={error && !selectedUser ? error : null} // Mostrar mensaje de error
                                InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (
                                        <React.Fragment>
                                            {loadingUsers ? <CircularProgress color="inherit" size={20} /> : null}
                                            {params.InputProps.endAdornment}
                                        </React.Fragment>
                                    ),
                                }}
                            />
                        )}
                        renderOption={(props, option) => {
                            // Asegurar que las props del li se pasen correctamente
                            return (
                                <li {...props} key={option.id_usuario}>
                                    {option.nombre} ({option.email})
                                </li>
                            );
                        }}
                    />

                    <FormControl fullWidth sx={{ mb: 2 }}> {/* Añadir margen inferior */}
                        <InputLabel id="rol-select-label">Rol</InputLabel>
                        <Select
                            labelId="rol-select-label"
                            id="rol-select"
                            value={rol}
                            label="Rol"
                            onChange={(e) => setRol(e.target.value)}
                            disabled={submitting} // Deshabilitar mientras se envía
                        >
                            {rolesPermitidos.map((r) => (
                                <MenuItem key={r} value={r}>
                                    {r.charAt(0).toUpperCase() + r.slice(1)}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* Mostrar error específico de la acción de añadir */}
                    {error && submitting && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                </Box>
            </DialogContent>
            <DialogActions sx={{ pb: 2, px: 3 }}> {/* Añadir padding */}
                <Button onClick={handleClose} disabled={submitting}>Cancelar</Button>
                <Button
                    onClick={handleAddClick}
                    variant="contained"
                    disabled={!selectedUser || submitting || loadingUsers} // Deshabilitar si carga usuarios o envía
                    startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : null} // Mostrar progreso en botón
                >
                    {submitting ? 'Añadiendo...' : 'Añadir Miembro'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddMiembroDialog;
