// src/hooks/useGlobalTasks.js
import { useTareas } from '../features/tasks/hooks/useTareas.js'; // Ajusta la ruta si es necesario

/**
 * Hook para obtener y gestionar tareas globales (visibles para el usuario).
 * Reutiliza useTareas sin un ID de proyecto específico.
 */
export const useGlobalTasks = () => {
    // Llama a useTareas sin idProyectoContext (null) para obtener tareas globales
    // según las reglas de acceso (RLS) definidas en el servicio.
    const {
        tareas: globalTasks, // Renombra 'tareas' a 'globalTasks' para claridad semántica
        loading: loadingGlobalTasks,
        error: errorGlobalTasks,
        refreshTareas: refreshGlobalTasks, // Renombra 'refreshTareas'
        // Podrías exponer más funciones de useTareas si fueran necesarias globalmente,
        // pero editar/eliminar globalmente puede ser complejo sin contexto.
        // openEditDialog,
        // openDeleteConfirm,
    } = useTareas(null); // <-- Pasa null aquí para indicar consulta global

    // Devuelve el estado y funciones relevantes para la vista global
    return {
        globalTasks,
        loadingGlobalTasks,
        errorGlobalTasks,
        refreshGlobalTasks,
        // ...otras funciones si las necesitas
    };
};
