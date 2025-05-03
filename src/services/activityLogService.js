// src/services/activityLogService.js
import { supabase } from '../utils/supabase.js'; // Importa tu cliente Supabase configurado

// Define el nombre CORRECTO de tu tabla de registros en Supabase
const ACTIVITY_LOG_TABLE = 'historial_cambios';
// Nombres de tablas relacionales (¡AJUSTADOS A TU ESQUEMA!)
const PROYECTOS_USUARIOS_TABLE = 'equipos'; // Usamos 'equipos' como tabla de relación proyecto-usuario
const TAREAS_TABLE = 'tareas';
const DOCUMENTOS_TABLE = 'documentos'; // Tabla de documentos
const INVITACIONES_TABLE = 'invitaciones'; // Tabla de invitaciones

/**
 * Obtiene los registros de actividad relevantes para el usuario actual.
 * Incluye:
 * 1. Registros creados por el usuario actual.
 * 2. Registros (de cualquier usuario/sistema) sobre entidades (proyectos, tareas, equipos, documentos, invitaciones)
 *    en las que el usuario actual está involucrado.
 *
 * Puede filtrar adicionalmente por una entidad específica o traer todos los registros relevantes.
 * Incluye el nombre del usuario responsable si está disponible.
 *
 * @param {string | null} entityType - Tipo de entidad ('proyectos', 'tareas', 'equipos', 'documentos', 'invitaciones') o null para global.
 * @param {string | null} entityId - ID de la entidad (UUID) o null para global.
 * @param {number} [limit=50] - Número máximo de registros a obtener.
 * @returns {Promise<Array<object>>} Una promesa que resuelve con un array de registros procesados.
 * @throws {Error} Lanza un error si la obtención falla.
 */
export const getActivityLogByEntity = async (entityType, entityId, limit = 50) => {
    // --- 1. OBTENER USUARIO ACTUAL ---
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        console.warn("getActivityLogByEntity: No user logged in or error fetching user.", userError?.message);
        return []; // Devuelve vacío si no hay usuario o hay error al obtenerlo
    }
    const userId = user.id;

    // --- 2. OBTENER IDs DE ENTIDADES ASOCIADAS AL USUARIO ---
    let userProjectIds = [];
    let userTaskIds = [];
    let userDocumentIds = []; // IDs de documentos subidos por el usuario
    let userInvitationIds = []; // IDs de invitaciones creadas o aceptadas por el usuario

    try {
        // Proyectos del usuario (obtenidos de la tabla 'equipos')
        const { data: projectsData, error: projectsError } = await supabase
            .from(PROYECTOS_USUARIOS_TABLE) // Usa la tabla 'equipos'
            .select('id_proyecto')
            .eq('id_usuario', userId);
        if (projectsError) throw projectsError;
        userProjectIds = projectsData?.map(p => p.id_proyecto) || [];
        console.log(`User ${userId} is member of projects:`, userProjectIds);

        // Tareas de los proyectos del usuario
        if (userProjectIds.length > 0) {
            const { data: tasksData, error: tasksError } = await supabase
                .from(TAREAS_TABLE)
                .select('id_tarea')
                .in('id_proyecto', userProjectIds); // Tareas de sus proyectos
            if (tasksError) throw tasksError;
            userTaskIds = tasksData?.map(t => t.id_tarea) || [];
            console.log(`Relevant task IDs for user ${userId}:`, userTaskIds);
        }

        // Documentos subidos por el usuario
        const { data: docsData, error: docsError } = await supabase
            .from(DOCUMENTOS_TABLE)
            .select('id_documento')
            .eq('id_usuario_subio', userId);
        if (docsError) throw docsError;
        userDocumentIds = docsData?.map(d => d.id_documento) || [];
        console.log(`Document IDs uploaded by user ${userId}:`, userDocumentIds);

        // Invitaciones creadas o aceptadas por el usuario
        const { data: invData, error: invError } = await supabase
            .from(INVITACIONES_TABLE)
            .select('id') // PK de invitaciones es 'id'
            .or(`id_usuario_invitador.eq.${userId},accepted_by_user_id.eq.${userId}`);
        if (invError) throw invError;
        userInvitationIds = invData?.map(i => i.id) || [];
        console.log(`Invitation IDs related to user ${userId}:`, userInvitationIds);


    } catch (relatedError) {
        console.error(`Error fetching related entity IDs for user ${userId}:`, relatedError.message);
        // Continuamos, pero el log podría estar incompleto si falla aquí
    }

    // --- 3. CONSTRUIR LA CONSULTA PRINCIPAL ---
    const selectColumns = `
        id_cambio, tabla_afectada, id_registro_afectado, tipo_cambio,
        id_usuario_responsable, descripcion, campo_modificado, valor_anterior,
        valor_nuevo, fecha_cambio,
        usuarios:id_usuario_responsable ( nombre )
    `;

    let query = supabase
        .from(ACTIVITY_LOG_TABLE)
        .select(selectColumns);

    // --- 4. CONSTRUIR CONDICIÓN OR ---
    const orConditions = [`id_usuario_responsable.eq.${userId}`]; // Siempre incluir logs creados por el usuario

    // Añadir condición para proyectos relevantes
    if (userProjectIds.length > 0) {
        orConditions.push(`and(tabla_afectada.eq.proyectos,id_registro_afectado.in.(${userProjectIds.join(',')}))`);
    }

    // Añadir condición para tareas relevantes
    if (userTaskIds.length > 0) {
        orConditions.push(`and(tabla_afectada.eq.tareas,id_registro_afectado.in.(${userTaskIds.join(',')}))`);
    }

    // Añadir condición para la tabla 'equipos' (cambios en membresías/roles)
    // Asumiendo que el trigger loguea el id_proyecto como id_registro_afectado para 'equipos'
    if (userProjectIds.length > 0) {
         orConditions.push(`and(tabla_afectada.eq.equipos,id_registro_afectado.in.(${userProjectIds.join(',')}))`);
    }

    // Añadir condición para documentos subidos por el usuario
    if (userDocumentIds.length > 0) {
        orConditions.push(`and(tabla_afectada.eq.documentos,id_registro_afectado.in.(${userDocumentIds.join(',')}))`);
    }
    // NOTA: Filtrar documentos por proyecto/tarea requeriría cambios en el trigger/tabla de historial
    // o una lógica de consulta mucho más compleja (RPC/RLS recomendado).

    // Añadir condición para invitaciones relacionadas con el usuario
    if (userInvitationIds.length > 0) {
        orConditions.push(`and(tabla_afectada.eq.invitaciones,id_registro_afectado.in.(${userInvitationIds.join(',')}))`);
    }

    // Aplicar el filtro OR combinado
    console.log("Applying OR conditions:", orConditions.join(','));
    query = query.or(orConditions.join(','));

    // --- 5. APLICAR FILTROS ADICIONALES (entityType, entityId) ---
    let logContext = `relevant to user ${userId}`;
    // Asegúrate que los nuevos tipos estén en la lista
    const validEntityTypes = ['proyectos', 'tareas', 'equipos', 'documentos', 'invitaciones'];

    if (entityType && entityId && validEntityTypes.includes(entityType)) {
        // Filtra DENTRO de los resultados ya relevantes por el OR
        query = query
            .eq('tabla_afectada', entityType)
            .eq('id_registro_afectado', entityId);
        logContext += ` and for ${entityType} ID: ${entityId}`;
        console.log(`Fetching activity log ${logContext} (limit ${limit})`);
    } else if (entityType || entityId) {
        console.warn(`getActivityLogByEntity: Parámetros de entidad inválidos o incompletos (${entityType}, ${entityId}). Fetching all relevant logs for user ${userId}.`);
        logContext += ' globally (fallback)';
        console.log(`Fetching all relevant activity log for user ${userId} (limit ${limit})`);
    } else {
        logContext += ' globally';
        console.log(`Fetching all relevant activity log for user ${userId} (limit ${limit})`);
    }

    // --- 6. ORDENAR Y LIMITAR ---
    query = query
        .order('fecha_cambio', { ascending: false })
        .limit(limit);

    // --- 7. EJECUTAR Y PROCESAR ---
    try {
        const { data, error } = await query;

        if (error) {
            console.error(`Supabase error fetching activity log ${logContext}:`, error.message);
            throw new Error(error.message || 'Error al obtener el historial de actividad desde Supabase.');
        }

        if (data) {
            console.log(`Fetched ${data.length} relevant log entries ${logContext}`);
            // Mapeo para aplanar nombre y añadir fecha Date
            return data.map(log => ({
                ...log,
                // Intenta obtener el nombre del responsable del join, si falla y es el user actual, usa metadata, sino 'Sistema/Otro'
                nombre_usuario_responsable: log.usuarios?.nombre || (log.id_usuario_responsable === userId ? user.user_metadata?.nombre : null) || 'Sistema/Otro',
                usuarios: undefined, // Limpiar el objeto anidado
                fecha_cambio_dt: log.fecha_cambio ? new Date(log.fecha_cambio) : null
            }));
        } else {
            console.log(`No relevant log entries found ${logContext}`);
            return []; // Devuelve array vacío si no hay datos
        }

    } catch (error) {
        // Captura y relanza errores generales o de Supabase
        if (!error.message.includes('Supabase')) {
            console.error(`Error in activityLogService.getActivityLogByEntity ${logContext}:`, error.message);
        }
        // Asegura que siempre se lance un Error
        throw new Error(error.message || 'No se pudo cargar el historial de actividad.');
    }
};

/**
 * (Opcional) Función para crear un nuevo registro de actividad.
 * @param {object} logData - Objeto con los datos a insertar. Debe incluir al menos las columnas NOT NULL.
 * @returns {Promise<object>} - Promesa que resuelve con el registro insertado.
 * @throws {Error} - Lanza un error si la inserción falla.
 */
export const createActivityLog = async (logData) => {
    // Validación básica de datos requeridos
    if (!logData.tabla_afectada || !logData.id_registro_afectado || !logData.tipo_cambio) {
         console.error("createActivityLog: Faltan datos requeridos (tabla_afectada, id_registro_afectado, tipo_cambio).", logData);
         throw new Error("Faltan datos requeridos para crear el registro de actividad.");
    }

    // --- OBTENER Y AÑADIR ID DE USUARIO RESPONSABLE AUTOMÁTICAMENTE ---
    // Asegurado para añadir el ID del usuario logueado si no se proporciona
    const { data: { user } } = await supabase.auth.getUser();
    if (user && !logData.id_usuario_responsable) {
       logData.id_usuario_responsable = user.id;
       console.log(`createActivityLog: Automatically setting id_usuario_responsable to ${user.id}`);
    } else if (!logData.id_usuario_responsable) {
        // Si no hay usuario logueado Y no se proporcionó un ID, podría ser una acción del sistema
        console.warn("createActivityLog: No user logged in and id_usuario_responsable not provided. Log will be anonymous or system-related.");
        // Considera si debes lanzar un error aquí o permitir logs anónimos/sistema
        // throw new Error("No se pudo determinar el usuario responsable para el registro de actividad.");
    }
    // --- FIN OBTENER Y AÑADIR ID ---

    console.log("Creating activity log with data:", logData);

    try {
        const { data, error } = await supabase
            .from(ACTIVITY_LOG_TABLE)
            .insert([logData]) // Supabase espera un array para insert
            .select()
            .single(); // Asume que insertas un solo registro

        if (error) {
            console.error("Supabase error creating activity log:", error.message);
            throw new Error(error.message || 'Error al guardar el registro de actividad.');
        }

        console.log("Activity log created successfully:", data);
        return data;

    } catch (error) {
        if (!error.message.includes('Supabase')) {
             console.error("Error en activityLogService.createActivityLog:", error.message);
        }
        // Asegura que siempre se lance un Error
        throw new Error(error.message || 'No se pudo guardar el registro de actividad.');
    }
};
