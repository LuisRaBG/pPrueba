// src/features/projects/services/projectService.js
import { supabase } from '../../../utils/supabase.js'; // Importa el cliente Supabase
import { isValidProjectId } from '../../../utils/validation.js'; // Importa validación
import { parseISO, isValid as isDateValid, format as formatDate } from 'date-fns'; // Importar para formateo

// Define el nombre de tu tabla de proyectos en Supabase
const PROJECTS_TABLE = 'proyectos';
// Define el nombre de tu tabla de equipos/membresías
const EQUIPOS_TABLE = 'equipos';
// Define el nombre de tu tabla de usuarios
const USUARIOS_TABLE = 'usuarios'; // Asegúrate que este sea el nombre correcto

// Define los estados válidos para los proyectos
const VALID_PROJECT_STATUSES = new Set([
    'Planificado',
    'En Curso',
    'Completado',
    'Cancelado',
    'En Espera'
]);
const DEFAULT_PROJECT_STATUS = 'Planificado';

/**
 * Formatea una fecha (objeto Date o string ISO) para Supabase (YYYY-MM-DD o null).
 * @param {Date | string | null | undefined} date - La fecha a formatear.
 * @returns {string | null} - La fecha en formato YYYY-MM-DD o null.
 */
const formatSupabaseDate = (date) => {
    if (!date) return null;
    try {
        // Intenta parsear si es string, o usa directamente si es Date
        const parsedDate = typeof date === 'string' ? parseISO(date) : date;
        if (isDateValid(parsedDate)) {
            // Devuelve solo la parte de la fecha en formato YYYY-MM-DD
            return formatDate(parsedDate, 'yyyy-MM-dd');
        }
    } catch (e) {
        console.warn(`formatSupabaseDate: Error parsing/formatting date "${date}"`, e);
    }
    return null;
};

/**
 * Formatea una fecha (objeto Date o string ISO) para un input de tipo 'date' (YYYY-MM-DD o '').
 * @param {Date | string | null | undefined} date - La fecha a formatear.
 * @returns {string} - La fecha en formato YYYY-MM-DD o una cadena vacía.
 */
export const formatDateForInput = (date) => {
    const formatted = formatSupabaseDate(date);
    return formatted || ''; // Devuelve string vacío si es null
};


/**
 * Obtiene todos los proyectos visibles para el usuario autenticado,
 * incluyendo el nombre del creador.
 * (Depende de las políticas RLS configuradas en Supabase sobre 'proyectos').
 */
export const fetchProyectos = async () => {
    console.log("projectService: Fetching all visible projects with creator name (based on RLS)");
    try {
        const { data, error } = await supabase
            .from(PROJECTS_TABLE)
            // Selecciona todo de proyectos y el nombre del creador desde la tabla usuarios
            .select(`
                *,
                ${USUARIOS_TABLE} ( nombre )
            `)
            .order('fecha_creacion', { ascending: false });

        if (error) {
            console.error("Supabase error fetching projects with creator:", error.message);
            throw new Error(error.message || 'Error al obtener los proyectos.');
        }

        // Procesar datos para añadir 'nombre_creador'
        const processedData = data?.map(proj => ({
            ...proj,
            // Accede al nombre dentro del objeto anidado 'usuarios'
            nombre_creador: proj[USUARIOS_TABLE]?.nombre || 'Creador Desconocido'
        })) || [];

        console.log("Fetched and processed projects:", processedData.length);
        return processedData;

    } catch (error) {
        // Evita loguear errores que ya loguea Supabase
        if (!error.message.includes('Supabase')) {
            console.error("Error en fetchProyectos:", error.message);
        }
        throw error; // Relanza el error para que el hook lo maneje
    }
};

/**
 * Obtiene los proyectos en los que el usuario actual es miembro explícito
 * a través de la tabla 'equipos', incluyendo el rol del usuario y detalles del proyecto.
 */
export const fetchUserMemberProjects = async () => {
    console.log("projectService: Fetching projects where current user is a member");
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            console.warn("fetchUserMemberProjects: User not authenticated.");
            return [];
        }
        const userId = user.id;

        const { data, error } = await supabase
            .from(EQUIPOS_TABLE)
            .select(`
                rol,
                id_usuario,
                ${PROJECTS_TABLE} (
                    id_proyecto,
                    nombre,
                    estado,
                    fecha_inicio,
                    fecha_fin
                 )
            `)
            .eq('id_usuario', userId);

        if (error) {
            console.error("Supabase error fetching user member projects:", error.message);
            throw new Error(error.message || 'Error al obtener los proyectos del usuario.');
        }

        // Filtra items donde el proyecto relacionado no sea null (por si acaso RLS lo ocultó)
        const validData = data?.filter(item => item[PROJECTS_TABLE] !== null) || [];

        console.log("Fetched user member projects:", validData.length);
        return validData;

    } catch (error) {
        if (!error.message.includes('Supabase')) {
            console.error("Error en fetchUserMemberProjects:", error.message);
        }
        throw error;
    }
};


/**
 * Obtiene los detalles de un proyecto específico por ID.
 * (Depende de RLS sobre 'proyectos').
 */
export const fetchProyectoById = async (idProyecto) => {
    if (!isValidProjectId(idProyecto)) {
        console.error("fetchProyectoById: ID de proyecto inválido:", idProyecto);
        throw new Error('ID de proyecto inválido.');
    }
    console.log(`projectService: Fetching project by ID: ${idProyecto}`);

    try {
        const { data, error } = await supabase
            .from(PROJECTS_TABLE)
            // Incluye también el nombre del creador al buscar por ID
            .select(`
                *,
                ${USUARIOS_TABLE} ( nombre )
            `)
            .eq('id_proyecto', idProyecto)
            .maybeSingle(); // Devuelve null si no se encuentra, no error 406

        if (error) {
            console.error(`Supabase error fetching project ID ${idProyecto}:`, error.message);
            throw new Error(error.message || `Error al obtener el proyecto ${idProyecto}.`);
        }

        // Procesar para añadir nombre_creador si se encontró el proyecto
        if (data) {
            return {
                ...data,
                nombre_creador: data[USUARIOS_TABLE]?.nombre || 'Creador Desconocido'
            };
        }

        console.log(`Project ID ${idProyecto} not found.`);
        return null; // Devuelve null si no se encontró

    } catch (error) {
        if (!error.message.includes('Supabase')) {
            console.error(`Error en fetchProyectoById for ID ${idProyecto}:`, error.message);
        }
        throw error;
    }
};

/**
 * Crea un nuevo proyecto en Supabase.
 */
export const createProyecto = async (proyectoData) => {
    if (!proyectoData || typeof proyectoData.nombre !== 'string' || proyectoData.nombre.trim() === '') {
        throw new Error("El nombre del proyecto es obligatorio.");
    }

    let estadoFinal = DEFAULT_PROJECT_STATUS;
    if (proyectoData.estado !== undefined) {
        if (VALID_PROJECT_STATUSES.has(proyectoData.estado)) {
            estadoFinal = proyectoData.estado;
        } else {
            console.warn(`createProyecto: Estado inválido '${proyectoData.estado}'. Usando estado por defecto '${DEFAULT_PROJECT_STATUS}'.`);
        }
    }

    const payload = {
        nombre: proyectoData.nombre.trim(),
        descripcion: proyectoData.descripcion || null,
        fecha_inicio: formatSupabaseDate(proyectoData.fecha_inicio),
        fecha_fin: formatSupabaseDate(proyectoData.fecha_fin),
        estado: estadoFinal,
        // id_usuario_creador se establece por defecto en la BD con auth.uid()
    };

    // Eliminar propiedades undefined antes de enviar
    Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);
    console.log("projectService (createProyecto): Creating project with payload:", payload);

    try {
        const { data, error } = await supabase
            .from(PROJECTS_TABLE)
            .insert([payload])
            .select(`*, ${USUARIOS_TABLE} ( nombre )`) // Pide también el creador al insertar
            .single(); // Espera un solo resultado

        if (error) {
            console.error("Supabase error creating project:", error.message, error.details);
            throw new Error(error.message || 'Error al crear el proyecto.');
        }

        // Procesar para añadir nombre_creador
        const processedData = {
            ...data,
            nombre_creador: data[USUARIOS_TABLE]?.nombre || 'Creador Desconocido'
        };

        console.log("Project created successfully:", processedData);
        return processedData;

    } catch (error) {
        if (!error.message.includes('Supabase')) {
            console.error("Error en createProyecto:", error.message);
        }
        throw error;
    }
};

/**
 * Actualiza un proyecto existente en Supabase.
 */
export const updateProyecto = async (idProyecto, proyectoData) => {
    if (!isValidProjectId(idProyecto)) {
        throw new Error('ID de proyecto inválido para actualizar.');
    }
    if (!proyectoData || Object.keys(proyectoData).length === 0) {
        console.warn("updateProyecto: No se proporcionaron datos para actualizar.");
        // Devuelve los datos actuales si no hay nada que actualizar
        return fetchProyectoById(idProyecto);
    }

    const payload = {};
    // Construye el payload solo con los campos proporcionados
    if (proyectoData.nombre !== undefined) payload.nombre = proyectoData.nombre.trim();
    if (proyectoData.descripcion !== undefined) payload.descripcion = proyectoData.descripcion; // Permitir descripción vacía si se envía
    if (proyectoData.fecha_inicio !== undefined) payload.fecha_inicio = formatSupabaseDate(proyectoData.fecha_inicio);
    if (proyectoData.fecha_fin !== undefined) payload.fecha_fin = formatSupabaseDate(proyectoData.fecha_fin);

    if (proyectoData.estado !== undefined) {
        if (VALID_PROJECT_STATUSES.has(proyectoData.estado)) {
            payload.estado = proyectoData.estado;
        } else {
            console.warn(`updateProyecto: Estado inválido '${proyectoData.estado}' proporcionado. No se actualizará el estado.`);
        }
    }

    // Eliminar claves que no deben ir en el update
    delete payload.id_proyecto;
    delete payload.id_usuario_creador;
    delete payload.fecha_creacion;
    delete payload[USUARIOS_TABLE]; // Eliminar la relación anidada si existe

    // Si después de filtrar, no queda nada por actualizar
    if (Object.keys(payload).length === 0) {
        console.warn(`updateProyecto: No hay campos válidos para actualizar el proyecto ID ${idProyecto}.`);
        return fetchProyectoById(idProyecto); // Devuelve datos actuales
    }

    console.log(`projectService (updateProyecto): Updating project ID ${idProyecto} with payload:`, payload);

    try {
        // Realiza el UPDATE
        const { error: updateError, count } = await supabase
            .from(PROJECTS_TABLE)
            .update(payload)
            .eq('id_proyecto', idProyecto)
            .select({ count: 'exact' }); // Usar select con count para obtener el número de filas afectadas

        if (updateError) {
            console.error(`Supabase error updating project ID ${idProyecto}:`, updateError.message, updateError.details);
            if (updateError.code === '42501') { // Error de RLS
                 throw new Error('No tienes permiso para actualizar este proyecto.');
            }
            throw new Error(updateError.message || 'Error al actualizar el proyecto.');
        }

        // Verificar si la actualización afectó alguna fila
        if (count === 0) {
            console.warn(`Project ${idProyecto} update attempted, but no rows were affected. Check ID and RLS UPDATE policy.`);
            // Intenta refetchear para dar un mensaje más específico
            const existingData = await fetchProyectoById(idProyecto);
            if (existingData) {
                // El proyecto existe, pero el UPDATE no lo modificó (probablemente RLS o los datos eran iguales)
                 throw new Error(`No se pudo actualizar el proyecto ${idProyecto}. Verifica tus permisos o si los datos ya eran iguales.`);
            } else {
                // El proyecto no existe
                 throw new Error(`No se encontró el proyecto con ID ${idProyecto} para actualizar.`);
            }
        }

        // Si el update tuvo éxito (count > 0), refetchea los datos actualizados
        console.log(`Project ID ${idProyecto} update affected ${count} row(s). Refetching data...`);
        const updatedData = await fetchProyectoById(idProyecto);

        if (!updatedData) {
             // Esto sería raro si count > 0, podría indicar un problema con la política SELECT de RLS
             console.error(`Project ${idProyecto} was updated, but could not be refetched. Check RLS SELECT policy.`);
             throw new Error('El proyecto se actualizó, pero no se pudo recuperar la información actualizada.');
        }

        console.log(`Project ID ${idProyecto} updated and refetched successfully:`, updatedData);
        return updatedData; // Devuelve los datos frescos

    } catch (error) {
        // Evita loguear errores que ya tienen mensajes claros o son de Supabase
        if (!error.message.includes('Supabase') && !error.message.includes('permiso') && !error.message.includes('encontró') && !error.message.includes('iguales') && !error.message.includes('RLS')) {
            console.error(`Error en updateProyecto for ID ${idProyecto}:`, error.message);
        }
        throw error;
    }
};

/**
 * Elimina un proyecto en Supabase.
 */
export const deleteProyecto = async (idProyecto) => {
    if (!isValidProjectId(idProyecto)) {
        throw new Error('ID de proyecto inválido para eliminar.');
    }

    console.log(`projectService (deleteProyecto): Deleting project ID ${idProyecto}`);

    try {
        // Considera eliminar dependencias manualmente si no usas CASCADE
        // await supabase.from('tareas').delete().eq('id_proyecto', idProyecto);
        // await supabase.from('equipos').delete().eq('id_proyecto', idProyecto);

        const { error, count } = await supabase
            .from(PROJECTS_TABLE)
            .delete({ count: 'exact' }) // Pide el conteo exacto de filas eliminadas
            .eq('id_proyecto', idProyecto);

        if (error) {
             if (error.code === '23503') { // Violación de Foreign Key
                 console.error(`Supabase FK violation deleting project ID ${idProyecto}:`, error.message);
                 throw new Error('No se puede eliminar el proyecto porque tiene elementos asociados (tareas, miembros, etc.). Elimínalos primero.');
             }
             if (error.code === '42501') { // Violación de RLS
                 console.error(`Supabase RLS violation deleting project ID ${idProyecto}:`, error.message);
                 throw new Error('No tienes permiso para eliminar este proyecto.');
             }
            // Otro error de Supabase
            console.error(`Supabase error deleting project ID ${idProyecto}:`, error.message);
            throw new Error(error.message || 'Error al eliminar el proyecto.');
        }

        // Si no se eliminó ninguna fila
        if (count === 0) {
            console.warn(`Attempted to delete project ID ${idProyecto}, but it was not found or RLS prevented deletion.`);
            // Podría ser que no exista o que RLS lo impida
            throw new Error(`No se encontró el proyecto con ID ${idProyecto} para eliminar o no tienes permiso.`);
        }

        console.log(`Project ID ${idProyecto} deleted successfully. Count: ${count}`);
        return { success: true, message: 'Proyecto eliminado correctamente.' };

    } catch (error) {
        // Evita loguear errores que ya tienen mensajes claros o son de Supabase
        if (!error.message.includes('Supabase') && !error.message.includes('permiso') && !error.message.includes('encontró') && !error.message.includes('elementos asociados')) {
            console.error(`Error en deleteProyecto for ID ${idProyecto}:`, error.message);
        }
        throw error;
    }
};
