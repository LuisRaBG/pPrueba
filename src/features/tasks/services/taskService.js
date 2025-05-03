// src/features/tasks/services/taskService.js
import { parseISO, isValid, format, startOfDay, isBefore } from 'date-fns'; // Añadido startOfDay, isBefore
import { es } from 'date-fns/locale';
import { isValidProjectId, isValidTaskId } from '../../../utils/validation.js';
import { supabase } from '../../../utils/supabase.js';

const TASKS_TABLE = 'tareas';

const VALID_TASK_STATUSES = new Set([
    'Pendiente',
    'En Progreso',
    'Completada',
    'Bloqueada',
    'Cancelada',
    'Vencida'
]);
const DEFAULT_TASK_STATUS = 'Pendiente'; // Cambiado de nuevo a Pendiente como default general

// Define las prioridades válidas para las tareas
const VALID_TASK_PRIORITIES = new Set([
    'Baja',
    'Media',
    'Alta',
    'Urgente',
    'Vencida' // *** AÑADIDO: Vencida como prioridad válida ***
]);
const DEFAULT_TASK_PRIORITY = 'Media';

// *** EXPORTAR CONSTANTES ***
export const TASK_STATUS = Object.freeze({
    PENDIENTE: 'Pendiente',
    EN_PROGRESO: 'En Progreso',
    COMPLETADA: 'Completada',
    BLOQUEADA: 'Bloqueada',
    CANCELADA: 'Cancelada',
    VENCIDA: 'Vencida',
});

export const TASK_PRIORITY = Object.freeze({
    BAJA: 'Baja',
    MEDIA: 'Media',
    ALTA: 'Alta',
    URGENTE: 'Urgente',
    VENCIDA: 'Vencida', // *** AÑADIDO: Vencida como constante de prioridad ***
});

export const DEFAULT_TASK_STATUS_VALUE = DEFAULT_TASK_STATUS;
export const DEFAULT_TASK_PRIORITY_VALUE = DEFAULT_TASK_PRIORITY;
// *** FIN EXPORTAR CONSTANTES ***

const formatSupabaseDate = (date) => {
    if (!date) return null;
    try {
        const parsedDate = (date instanceof Date) ? date : parseISO(date);
        if (isValid(parsedDate)) {
            return parsedDate.toISOString();
        }
    } catch (e) {}
    return null;
};

/**
 * Procesa y formatea una tarea recibida de Supabase.
 * Sobrescribe la prioridad a 'Vencida' si la fecha ha pasado y no está completada/cancelada.
 * @param {object} tarea - El objeto de tarea crudo de Supabase.
 * @returns {object | null} - La tarea procesada.
 */
const processTarea = (tarea) => {
    if (!tarea) return null;

    // 1. Validar Estado
    let estadoProcesado = DEFAULT_TASK_STATUS;
    if (tarea.estado && VALID_TASK_STATUSES.has(tarea.estado)) {
        estadoProcesado = tarea.estado;
    } else if (tarea.estado) {
        console.warn(`processTarea: Estado inválido '${tarea.estado}'. Usando '${DEFAULT_TASK_STATUS}'.`);
    }

    // 2. Validar Prioridad Original
    let prioridadProcesada = DEFAULT_TASK_PRIORITY;
    if (tarea.prioridad && VALID_TASK_PRIORITIES.has(tarea.prioridad)) {
        prioridadProcesada = tarea.prioridad;
    } else if (tarea.prioridad) {
        console.warn(`processTarea: Prioridad inválida '${tarea.prioridad}'. Usando '${DEFAULT_TASK_PRIORITY}'.`);
    }

    // 3. Parsear Fechas
    const fechaInicioParsed = tarea.fecha_inicio ? parseISO(tarea.fecha_inicio) : null;
    const fechaVencimientoParsed = tarea.fecha_vencimiento ? parseISO(tarea.fecha_vencimiento) : null;

    // *** 4. LÓGICA PARA SOBRESCRIBIR PRIORIDAD A 'Vencida' ***
    const today = startOfDay(new Date());
    const isOverdue = fechaVencimientoParsed && isValid(fechaVencimientoParsed) && isBefore(fechaVencimientoParsed, today);
    const isFinished = estadoProcesado === TASK_STATUS.COMPLETADA || estadoProcesado === TASK_STATUS.CANCELADA;

    if (isOverdue && !isFinished) {
        prioridadProcesada = TASK_PRIORITY.VENCIDA; // Sobrescribe la prioridad
        // Opcional: También podrías sobrescribir el estado si 'Vencida' es un estado
        estadoProcesado = TASK_STATUS.VENCIDA;
    }
    // *** FIN LÓGICA VENCIDA ***

    return {
        ...tarea,
        id_tarea: typeof tarea.id_tarea === 'number' ? tarea.id_tarea : parseInt(tarea.id_tarea, 10),
        id_proyecto: typeof tarea.id_proyecto === 'string' ? tarea.id_proyecto : (tarea.id_proyecto ? String(tarea.id_proyecto) : null),
        fecha_inicio_orig: tarea.fecha_inicio,
        fecha_vencimiento_orig: tarea.fecha_vencimiento,
        fecha_inicio_display: fechaInicioParsed && isValid(fechaInicioParsed) ? format(fechaInicioParsed, 'd MMM yy', { locale: es }) : 'N/A',
        fecha_vencimiento_display: fechaVencimientoParsed && isValid(fechaVencimientoParsed) ? format(fechaVencimientoParsed, 'd MMM yy', { locale: es }) : 'N/A',
        prioridad: prioridadProcesada, // Usa la prioridad (potencialmente sobrescrita)
        estado: estadoProcesado,       // Usa el estado validado
        ruta_prueba_entrega: tarea.ruta_prueba_entrega || null, // Añadir el nuevo campo
    };
};

// --- Resto de funciones (getTareas, createTarea, updateTarea, deleteTarea) sin cambios ---
export const getTareas = async (projectId = null, taskId = null) => {
    let query = supabase.from(TASKS_TABLE).select(`*, proyectos ( nombre )`);
    let logContext = 'todas las tareas visibles';
    if (isValidTaskId(taskId)) {
        query = query.eq('id_tarea', taskId).maybeSingle();
        logContext = `tarea ID ${taskId}`;
    } else if (isValidProjectId(projectId)) {
        query = query.eq('id_proyecto', projectId);
        logContext = `tareas del proyecto ID ${projectId}`;
        query = query.order('fecha_vencimiento', { ascending: true, nullsFirst: false }).order('fecha_creacion', { ascending: true });
    } else {
         query = query.order('fecha_creacion', { ascending: false });
    }
    try {
        const { data, error } = await query;
        if (error) throw new Error(error.message || 'Error al obtener las tareas.');
        const flattenTask = (task) => {
            if (!task) return null;
            const { proyectos, ...restOfTask } = task;
            return { ...restOfTask, nombre_proyecto: proyectos?.nombre || null };
        };
        if (isValidTaskId(taskId)) {
            const tareaProcesada = processTarea(flattenTask(data));
            return tareaProcesada ? [tareaProcesada] : [];
        } else {
            return data.map(task => processTarea(flattenTask(task))).filter(Boolean);
        }
    } catch (error) {
        if (!error.message.includes('Supabase')) console.error(`Error en getTareas (${logContext}):`, error.message);
        throw error;
    }
};

export const createTarea = async (tareaData) => {
    if (!isValidProjectId(tareaData?.id_proyecto)) throw new Error("ID de proyecto inválido.");
    let estadoFinal = DEFAULT_TASK_STATUS;
    if (tareaData.estado !== undefined) {
        if (VALID_TASK_STATUSES.has(tareaData.estado)) estadoFinal = tareaData.estado;
        else console.warn(`createTarea: Estado inválido '${tareaData.estado}'. Usando '${DEFAULT_TASK_STATUS}'.`);
    }
    let prioridadFinal = DEFAULT_TASK_PRIORITY;
    if (tareaData.prioridad !== undefined) {
        if (VALID_TASK_PRIORITIES.has(tareaData.prioridad)) prioridadFinal = tareaData.prioridad;
        else console.warn(`createTarea: Prioridad inválida '${tareaData.prioridad}'. Usando '${DEFAULT_TASK_PRIORITY}'.`);
    }
    const payload = {
        titulo: tareaData.titulo, descripcion: tareaData.descripcion,
        fecha_inicio: formatSupabaseDate(tareaData.fecha_inicio), fecha_vencimiento: formatSupabaseDate(tareaData.fecha_vencimiento),
        prioridad: prioridadFinal, estado: estadoFinal, id_proyecto: tareaData.id_proyecto,
    };
    Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);
    try {
        const { data, error } = await supabase.from(TASKS_TABLE).insert([payload]).select(`*, proyectos ( nombre )`).single();
        if (error) throw new Error(error.message || 'Error al crear la tarea.');
        const { proyectos, ...restOfTask } = data;
        return processTarea({ ...restOfTask, nombre_proyecto: proyectos?.nombre || null });
    } catch (error) {
        if (!error.message.includes('Supabase')) console.error("Error en createTarea:", error.message);
        throw error;
    }
};

export const updateTarea = async (idTarea, tareaData) => {
     if (!isValidTaskId(idTarea)) throw new Error("ID de tarea inválido.");
    const payload = {
        titulo: tareaData.titulo, descripcion: tareaData.descripcion,
        fecha_inicio: formatSupabaseDate(tareaData.fecha_inicio), fecha_vencimiento: formatSupabaseDate(tareaData.fecha_vencimiento),
        ruta_prueba_entrega: tareaData.ruta_prueba_entrega, // Incluir el campo (puede ser null)
    };
    if (tareaData.estado !== undefined) {
        if (VALID_TASK_STATUSES.has(tareaData.estado)) payload.estado = tareaData.estado;
        else console.warn(`updateTarea: Estado inválido '${tareaData.estado}'. No se actualizará.`);
    }
    if (tareaData.prioridad !== undefined) {
        // Permitir actualizar a cualquier prioridad válida, excepto 'Vencida' directamente
        if (VALID_TASK_PRIORITIES.has(tareaData.prioridad) && tareaData.prioridad !== TASK_PRIORITY.VENCIDA) {
             payload.prioridad = tareaData.prioridad;
        } else if (tareaData.prioridad === TASK_PRIORITY.VENCIDA) {
             console.warn(`updateTarea: No se puede establecer la prioridad a 'Vencida' manualmente.`);
        } else {
            console.warn(`updateTarea: Prioridad inválida '${tareaData.prioridad}'. No se actualizará.`);
        }
    }

    // *** REGLA DE NEGOCIO: No permitir completar sin prueba ***
    if (payload.estado === TASK_STATUS.COMPLETADA && !payload.ruta_prueba_entrega) {
        // Podríamos verificar si ya existe en la BD, pero por simplicidad, requerimos que se envíe en la actualización
        // Opcional: Cargar la tarea actual para verificar si ya tenía prueba
        throw new Error("No se puede completar la tarea sin adjuntar una prueba de entrega.");
    }
    Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);
    if (Object.keys(payload).length === 0) {
        console.warn(`taskService (updateTarea): No hay datos válidos para actualizar ID ${idTarea}.`);
        const currentTaskArray = await getTareas(null, idTarea);
        return currentTaskArray[0] || null;
    }
    try {
        const { data, error } = await supabase.from(TASKS_TABLE).update(payload).eq('id_tarea', idTarea).select(`*, proyectos ( nombre )`).single();
        if (error) throw new Error(error.message || 'Error al actualizar la tarea.');
        if (!data) throw new Error(`No se encontró la tarea con ID ${idTarea} o no tienes permisos.`);
        const { proyectos, ...restOfTask } = data;
        return processTarea({ ...restOfTask, nombre_proyecto: proyectos?.nombre || null });
    } catch (error) {
        if (!error.message.includes('Supabase') && !error.message.includes('No se encontró')) console.error(`Error en updateTarea ID ${idTarea}:`, error.message);
        throw error;
    }
};

export const deleteTarea = async (idTarea) => {
    if (!isValidTaskId(idTarea)) throw new Error("ID de tarea inválido.");
    try {
        const { error, count } = await supabase.from(TASKS_TABLE).delete({ count: 'exact' }).eq('id_tarea', idTarea);
        if (error) throw new Error(error.message || 'Error al eliminar la tarea.');
        if (count === 0) console.warn(`Intento de eliminar tarea ID ${idTarea}, pero no se encontró.`);
        return { success: true, message: 'Tarea eliminada correctamente.' };
    } catch (error) {
        if (!error.message.includes('Supabase')) console.error(`Error en deleteTarea ID ${idTarea}:`, error.message);
        throw error;
    }
};
