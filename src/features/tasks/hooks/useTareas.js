// c:\Users\Prueb\Documents\projects\proyecto\src\features\tasks\hooks\useTareas.js
import { useState, useEffect, useCallback } from 'react';
import * as taskService from '../services/taskService.js'; // Ajusta la ruta si es necesario
import { useAuth } from '../../../contexts/AuthContext.js'; // Ajusta la ruta si es necesario
import { isValidProjectId } from '../../../utils/validation.js'; // Ajusta la ruta si es necesario

// Estado inicial del formulario de tarea, con prioridad por defecto 'Media'
const initialFormData = {
    id_tarea: null,
    titulo: '',
    descripcion: '',
    fecha_inicio: '',
    fecha_vencimiento: '',
    prioridad: 'Media', // Prioridad por defecto al crear
    estado: 'Pendiente', // Estado por defecto al crear
    id_proyecto: null,
    ruta_prueba_entrega: null, // Añadir campo para la prueba
};

/**
 * Hook para gestionar las tareas (obtener, crear, editar, eliminar).
 * @param {string | null} [idProyectoContext=null] - ID del proyecto actual para filtrar, o null para obtener todas las tareas visibles.
 * @param {function(string): void} [onAllTasksCompleted=()=>{}] - Callback a ejecutar cuando todas las tareas de un proyecto se marcan como completadas.
 */
export const useTareas = (idProyectoContext = null, onAllTasksCompleted = () => {}) => {
    const [tareas, setTareas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Estados para el diálogo de creación/edición
    const [dialogOpen, setDialogOpen] = useState(false);
    const [formData, setFormData] = useState(initialFormData);
    const [isEditing, setIsEditing] = useState(false);

    // Estados para el diálogo de eliminación
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [tareaToDelete, setTareaToDelete] = useState(null);

    // *** NUEVO: Estados para diálogo de subida de prueba ***
    const [isUploadProofDialogOpen, setIsUploadProofDialogOpen] = useState(false);
    const [taskToUploadProofFor, setTaskToUploadProofFor] = useState(null);

    // Estados para operaciones (guardar/eliminar)
    const [operationLoading, setOperationLoading] = useState(false);
    const [operationError, setOperationError] = useState(null);

    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

    // Función para cargar/recargar tareas
    const cargarTareas = useCallback(async () => {
        // No cargar si la autenticación aún está pendiente
        if (isAuthLoading || !isAuthenticated) {
            console.warn("useTareas - cargarTareas: Autenticación no lista, no se pueden cargar tareas.");
            if(tareas.length > 0) setTareas([]); // Limpia tareas si el usuario ya no está autenticado
            setLoading(false);
            setError(null);
            return;
        }

        setLoading(true);
        setError(null);

        // Determina si se busca por proyecto o globalmente
        const buscarPorProyecto = isValidProjectId(idProyectoContext);
        const logContext = buscarPorProyecto ? `proyecto ID ${idProyectoContext}` : 'todas del usuario';
        console.log(`useTareas - cargarTareas: Cargando tareas (${logContext})`);

        try {
            let data;
            if (buscarPorProyecto) {
                // Llama al servicio para obtener tareas del proyecto específico
                data = await taskService.getTareas(idProyectoContext);
            } else {
                // Llama al servicio para obtener todas las tareas visibles para el usuario
                data = await taskService.getTareas(); // Asume que getTareas sin ID hace esto
            }
            // *** AÑADIDO: Verifica los IDs de las tareas cargadas ***
            console.log('useTareas - cargarTareas: Datos recibidos del servicio:', data);
            setTareas(data || []); // Actualiza el estado con las tareas obtenidas

            // Verificar si todas las tareas están completadas (solo si se filtra por proyecto)
            if (buscarPorProyecto && data && data.length > 0 && data.every(t => t.estado === 'Completada')) {
                console.log(`useTareas: Todas las tareas del proyecto ${idProyectoContext} están completadas.`);
                // Llama al callback si todas están completadas
                if (typeof onAllTasksCompleted === 'function') {
                    onAllTasksCompleted(idProyectoContext);
                }
            }

        } catch (err) {
            console.error(`useTareas - cargarTareas: Error cargando tareas (${logContext}):`, err);
            setError(err.message || 'Error al cargar las tareas.');
            setTareas([]); // Limpia tareas en caso de error
        } finally {
            setLoading(false); // Finaliza el estado de carga
        }
    }, [idProyectoContext, isAuthenticated, isAuthLoading, onAllTasksCompleted, tareas.length]); // Añadido tareas.length para evitar bucle si setTareas no cambia referencia

    // Efecto para cargar tareas cuando cambia el contexto o la autenticación
    useEffect(() => {
        if (isAuthenticated && !isAuthLoading) {
            cargarTareas();
        } else if (!isAuthenticated && !isAuthLoading) {
            // Si el usuario cierra sesión, limpia las tareas
            setTareas([]);
            setLoading(false);
            setError(null);
        }
        // No incluir cargarTareas directamente si depende de tareas.length para evitar bucles infinitos.
        // La dependencia de isAuthenticated y isAuthLoading es suficiente aquí.
    }, [idProyectoContext, isAuthenticated, isAuthLoading]); // Dependencias principales para recargar

    // --- Handlers para Diálogo de Tarea (Crear/Editar) ---
    const openCreateDialog = useCallback(() => {
        // Valida que haya un ID de proyecto válido para crear
        if (!isValidProjectId(idProyectoContext)) {
            console.error("useTareas - openCreateDialog: Intento de abrir diálogo sin ID de proyecto válido.");
            setOperationError("Se necesita seleccionar un proyecto válido para crear una tarea.");
            // Podrías mostrar un Snackbar/Toast aquí también
            return;
        }
        // Resetea el formulario con el ID del proyecto actual
        setFormData({ ...initialFormData, id_proyecto: idProyectoContext });
        setIsEditing(false); // Asegura que está en modo creación
        setOperationError(null); // Limpia errores previos
        setDialogOpen(true); // Abre el diálogo
    }, [idProyectoContext]);

    const openEditDialog = useCallback((tarea) => {
        if (!tarea) return; // No hacer nada si no se proporciona tarea
        // Pre-llena el formulario con los datos de la tarea a editar
        // Usa las fechas originales (sin formato) si existen
        setFormData({
            ...initialFormData, // Empieza con valores por defecto
            ...tarea, // Sobrescribe con los datos de la tarea
            fecha_inicio: tarea.fecha_inicio || '', // Usa fecha original si existe
            fecha_vencimiento: tarea.fecha_vencimiento || '', // Usa fecha original si existe
            ruta_prueba_entrega: tarea.ruta_prueba_entrega || null, // Carga la ruta de prueba existente
        });
        setIsEditing(true); // Pone en modo edición
        setOperationError(null); // Limpia errores previos
        setDialogOpen(true); // Abre el diálogo
    }, []);

    const handleCloseDialog = useCallback(() => {
        setDialogOpen(false);
        // Retrasa la limpieza del formulario para que no se vea el cambio durante la animación de cierre
        setTimeout(() => {
            setFormData(initialFormData);
            setOperationError(null);
        }, 300); // Ajusta el tiempo si es necesario
    }, []);

    // *** NUEVO: Handlers para Diálogo de Subida de Prueba ***
    const openUploadProofDialog = useCallback((tarea) => {
        if (!tarea.id_tarea) return;
        setTaskToUploadProofFor(tarea.id_tarea); // Guarda la tarea específica
        setOperationError(null); // Limpia errores
        setIsUploadProofDialogOpen(true); // Abre el diálogo específico
    }, []);

    const closeUploadProofDialog = useCallback(() => {
        setIsUploadProofDialogOpen(false);
        // Retrasa limpieza
        setTimeout(() => { setTaskToUploadProofFor(null); setOperationError(null); }, 300);
    }, []);

    // Handler para cambios en inputs de texto/select
    const handleInputChange = useCallback((event) => {
        const { name, value } = event.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    // Handler para cambios en inputs de fecha (DatePicker, etc.)
    const handleDateChange = useCallback((name, date) => {
        // Formatea la fecha a YYYY-MM-DD o null si es inválida
        const formattedDate = date instanceof Date && !isNaN(date)
            ? date.toISOString().split('T')[0]
            : null;
        setFormData(prev => ({ ...prev, [name]: formattedDate }));
    }, []);

    // Handler para enviar el formulario (Crear o Actualizar)
    const handleSubmit = useCallback(async (event) => {
        if (event) event.preventDefault(); // Previene recarga de página si es un form HTML
        if (!formData) {
            setOperationError("Error interno: Faltan datos del formulario.");
            return Promise.reject(new Error("Error interno: Faltan datos del formulario."));
        }

        setOperationLoading(true); // Inicia estado de carga
        setOperationError(null); // Limpia errores previos

        try {
            let result;
            if (isEditing) {
                // Modo Edición: Llama a updateTarea
                if (!formData.id_tarea) throw new Error("Falta ID de tarea para actualizar.");
                result = await taskService.updateTarea(formData.id_tarea, formData);
            } else {
                // Modo Creación: Llama a createTarea
                if (!isValidProjectId(formData.id_proyecto)) throw new Error("Falta ID de proyecto para crear tarea.");
                result = await taskService.createTarea(formData);
            }
            console.log("Resultado operación tarea:", result);
            handleCloseDialog(); // Cierra el diálogo en éxito
            await cargarTareas(); // Recarga la lista de tareas
            return Promise.resolve(result); // Resuelve la promesa con el resultado
        } catch (err) {
            console.error("useTareas - handleSubmit: Error guardando tarea:", err);
            setOperationError(err.message || 'Error al guardar la tarea.');
            // No cerrar el diálogo en caso de error para mostrar el mensaje
            return Promise.reject(err); // Rechaza la promesa con el error
        } finally {
            setOperationLoading(false); // Finaliza estado de carga
        }
    }, [formData, isEditing, cargarTareas, handleCloseDialog]);

    // --- Handlers para Diálogo de Eliminación ---
    const openDeleteConfirm = useCallback((tarea) => {
        if (!tarea) return; // No hacer nada si no hay tarea
        setTareaToDelete(tarea); // Guarda la tarea a eliminar
        setOperationError(null); // Limpia errores previos
        setIsDeleteDialogOpen(true); // Abre el diálogo de confirmación
    }, []);

    const handleCloseDeleteDialog = useCallback(() => {
        setIsDeleteDialogOpen(false);
        // Retrasa la limpieza para la animación
        setTimeout(() => {
            setTareaToDelete(null);
            setOperationError(null);
        }, 300);
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        if (!tareaToDelete?.id_tarea) {
            setOperationError("Error interno: No hay tarea seleccionada para eliminar.");
            return Promise.reject(new Error("Error interno: No hay tarea seleccionada para eliminar."));
        }

        setOperationLoading(true); // Inicia carga
        setOperationError(null); // Limpia errores

        try {
            // Llama al servicio para eliminar la tarea
            const result = await taskService.deleteTarea(tareaToDelete.id_tarea);
            console.log("Resultado eliminación tarea:", result);
            handleCloseDeleteDialog(); // Cierra el diálogo en éxito
            await cargarTareas(); // Recarga la lista
            return Promise.resolve(result); // Resuelve la promesa
        } catch (err) {
            console.error("useTareas - handleDeleteConfirm: Error eliminando tarea:", err);
            setOperationError(err.message || 'Error al eliminar la tarea.');
            // No cerrar el diálogo en error para mostrar el mensaje
            return Promise.reject(err); // Rechaza la promesa
        } finally {
            setOperationLoading(false); // Finaliza carga
        }
    }, [tareaToDelete, cargarTareas, handleCloseDeleteDialog]);

    // --- NUEVO: Handler para cuando la prueba se sube con éxito ---
    const handleProofUploadSuccess = useCallback(async (uploadResult) => {
        // *** MODIFICADO: Usa taskToUploadProofFor en lugar de formData ***
        if (!taskToUploadProofFor?.id_tarea || !uploadResult?.path) {
            console.error("handleProofUploadSuccess: Falta ID de tarea o ruta del archivo.");
            setOperationError("Error al asociar la prueba: faltan datos.");
            return;
        }

        const taskId = taskToUploadProofFor.id_tarea; // <-- Usa la tarea guardada
        const filePath = uploadResult.path;

        setOperationLoading(true);
        setOperationError(null);

        try {
            // 1. Actualizar la tarea con la ruta de la prueba
            await taskService.updateTarea(taskId, { ruta_prueba_entrega: filePath });

            // 2. Preguntar al usuario si desea completar la tarea
            const confirmComplete = window.confirm("Prueba subida con éxito. ¿Deseas marcar la tarea como completada?");

            if (confirmComplete) {
                // 3. Si confirma, actualizar el estado a Completada
                await taskService.updateTarea(taskId, { estado: taskService.TASK_STATUS.COMPLETADA });
            }

            await cargarTareas(); // Recargar tareas para reflejar cambios
            closeUploadProofDialog(); // <-- Cierra el diálogo de subida
        } catch (err) {
            console.error("handleProofUploadSuccess: Error:", err);
            setOperationError(err.message || "Error al procesar la prueba de entrega.");
        } finally {
            setOperationLoading(false);
        }
    }, [taskToUploadProofFor?.id_tarea, cargarTareas, closeUploadProofDialog]); // <-- Dependencias actualizadas

    // --- Devuelve el estado y los handlers ---
    return {
        tareas,                 // Array de tareas
        loading,                // Booleano: cargando lista de tareas
        error,                  // String o null: error al cargar lista
        dialogOpen,             // Booleano: diálogo de crear/editar abierto
        formData,               // Objeto: datos del formulario actual
        isEditing,              // Booleano: modo edición activado
        isDeleteDialogOpen,    // Booleano: diálogo de eliminar abierto
        // *** NUEVO: Exportar estado y handlers del diálogo de subida ***
        isUploadProofDialogOpen,
        taskToUploadProofFor,
        tareaToDelete,          // Objeto: tarea seleccionada para eliminar
        operationLoading,       // Booleano: operación (guardar/eliminar) en curso
        operationError,         // String o null: error en la última operación
        openCreateDialog,       // Función para abrir diálogo de creación
        openEditDialog,         // Función para abrir diálogo de edición
        handleCloseDialog,      // Función para cerrar diálogo de creación/edición
        openDeleteConfirm,      // Función para abrir diálogo de eliminación
        openUploadProofDialog,  // <-- NUEVO: Función para abrir diálogo de subida
        closeUploadProofDialog, // <-- NUEVO: Función para cerrar diálogo de subida
        handleCloseDeleteDialog,// Función para cerrar diálogo de eliminación
        handleSubmit,           // Función para guardar (crear/editar)
        handleDeleteConfirm,    // Función para confirmar eliminación
        handleInputChange,      // Función para actualizar inputs de texto/select
        handleDateChange,       // Función para actualizar inputs de fecha
        handleProofUploadSuccess, // <-- NUEVO: Pasar este handler al diálogo
        refreshTareas: cargarTareas // Función para recargar manualmente las tareas
    };
};
