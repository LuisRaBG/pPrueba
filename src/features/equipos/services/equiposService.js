// src/features/equipos/services/equiposService.js
import { supabase } from '../../../utils/supabase.js'; // Asegúrate que la ruta sea correcta

// --- Funciones para Miembros ---

/**
 * Obtiene los miembros de un proyecto específico llamando a la función RPC 'get_project_members_details'.
 * @param {string} idProyecto - El ID del proyecto (UUID).
 * @returns {Promise<Array<object>>} - Lista de miembros con detalles.
 */
export const fetchMiembrosProyecto = async (idProyecto) => {
    if (!idProyecto) {
        console.warn("fetchMiembrosProyecto: idProyecto no proporcionado.");
        return [];
    }
    console.log(`Fetching members for project ${idProyecto} via RPC 'get_project_members_details'.`);
    try {
        const { data, error } = await supabase
            .rpc('get_project_members_details', { project_id_param: idProyecto });

        if (error) {
            console.error("Supabase RPC error (get_project_members_details):", error.message);
            throw new Error(error.message || 'Error al cargar miembros del proyecto.');
        }
        return data || [];
    } catch (error) {
        if (!error.message.includes('Supabase')) {
            console.error("Error en fetchMiembrosProyecto (RPC call):", error.message);
        }
        throw error;
    }
};

/**
 * Actualiza el rol de un miembro en un proyecto.
 * @param {string} idProyecto - ID del proyecto (UUID).
 * @param {string} idUsuario - ID del usuario (UUID).
 * @param {string} nuevoRol - El nuevo rol ('lider', 'colaborador', 'observador').
 * @returns {Promise<object>} - El registro actualizado de la tabla 'equipos'.
 */
export const updateRolMiembro = async (idProyecto, idUsuario, nuevoRol) => {
    // Validación básica de roles (opcional pero recomendado)
    const rolesValidos = ['lider', 'colaborador', 'observador'];
    if (!rolesValidos.includes(nuevoRol)) {
        console.error(`updateRolMiembro: Rol inválido proporcionado: ${nuevoRol}`);
        throw new Error('Rol inválido proporcionado.');
    }
    if (!idProyecto || !idUsuario) {
         console.error("updateRolMiembro: idProyecto o idUsuario no proporcionado.");
         throw new Error('Faltan IDs para actualizar el rol.');
    }

    console.log(`Updating role for user ${idUsuario} in project ${idProyecto} to ${nuevoRol}.`);
    try {
        const { data, error } = await supabase
            .from('equipos')
            .update({ rol: nuevoRol })
            .match({ id_proyecto: idProyecto, id_usuario: idUsuario })
            .select()
            .single();

        if (error) {
            console.error("Supabase error updating role:", error.message);
            throw new Error(error.message || 'Error al actualizar el rol.');
        }
        if (!data) {
            // Esto puede pasar si los IDs no coinciden con ningún registro existente
            console.warn(`No se encontró el miembro (usuario: ${idUsuario}, proyecto: ${idProyecto}) para actualizar el rol.`);
            throw new Error('No se encontró el miembro para actualizar el rol.');
        }
        console.log(`Rol actualizado para usuario ${idUsuario} en proyecto ${idProyecto}.`);
        return data;
    } catch (error) {
        if (!error.message.includes('Supabase')) {
            console.error("Error en updateRolMiembro:", error.message);
        }
        throw error;
    }
};

/**
 * Elimina un miembro de un proyecto.
 * @param {string} idProyecto - ID del proyecto (UUID).
 * @param {string} idUsuario - ID del usuario (UUID).
 * @returns {Promise<void>}
 */
export const removeMiembroEquipo = async (idProyecto, idUsuario) => {
     if (!idProyecto || !idUsuario) {
         console.error("removeMiembroEquipo: idProyecto o idUsuario no proporcionado.");
         throw new Error('Faltan IDs para eliminar al miembro.');
    }
    console.log(`Removing user ${idUsuario} from project ${idProyecto}.`);
    try {
        // Usamos count: 'exact' para saber si se eliminó algo
        const { error, count } = await supabase
            .from('equipos')
            .delete({ count: 'exact' }) // Pide contar las filas eliminadas
            .match({ id_proyecto: idProyecto, id_usuario: idUsuario });

        if (error) {
            console.error("Supabase error removing member:", error.message);
            throw new Error(error.message || 'Error al eliminar miembro.');
        }
        // Verifica si realmente se eliminó una fila
        if (count === 0) {
             console.warn(`No se encontró el miembro (usuario: ${idUsuario}, proyecto: ${idProyecto}) para eliminar.`);
             // Podrías lanzar un error o simplemente loguearlo, dependiendo de tu lógica de UI
             // throw new Error('No se encontró el miembro especificado para eliminar.');
        } else {
            console.log(`User ${idUsuario} removed successfully from project ${idProyecto}.`);
        }
        // No se devuelve nada en caso de éxito (void)
    } catch (error) {
        if (!error.message.includes('Supabase')) {
            console.error("Error en removeMiembroEquipo:", error.message);
        }
        throw error;
    }
};

// --- Funciones para Invitaciones ---

/**
 * Llama a la Edge Function para generar un código de invitación.
 * @param {string} idProyecto - ID del proyecto (UUID).
 * @param {string} rolInvitado - Rol para el invitado ('colaborador', 'observador').
 * @returns {Promise<{invitation_code: string}>} - Objeto con el código generado.
 */
export const createInvitation = async (idProyecto, rolInvitado) => {
    const rolesValidos = ['colaborador', 'observador']; // Define roles permitidos para invitar
     if (!idProyecto || !rolInvitado) {
         console.error("createInvitation: idProyecto o rolInvitado no proporcionado.");
         throw new Error('Faltan datos para crear la invitación.');
     }
     if (!rolesValidos.includes(rolInvitado)) {
        console.error(`createInvitation: Rol inválido para invitación: ${rolInvitado}`);
        throw new Error('Rol inválido para la invitación.');
     }

    console.log(`Creating invitation for project ${idProyecto} with role ${rolInvitado}.`);
    try {
        const { data, error } = await supabase.functions.invoke('generate-invitation', {
            // Asegúrate que los nombres de las propiedades coincidan con lo que espera tu Edge Function
            body: { projectId: idProyecto, invitedRole: rolInvitado },
        });

        if (error) {
            console.error('Supabase function error (generate-invitation):', error.message);
            const detail = error.context?.details || error.message;
            throw new Error(detail || 'Error al generar la invitación.');
        }
        if (!data?.invitation_code) {
             console.error('Respuesta inesperada de la Edge Function generate-invitation:', data);
             throw new Error('La función no devolvió un código de invitación válido.');
        }
        console.log("Invitation created successfully:", data);
        return data; // Devuelve { invitation_code: '...' }
    } catch (error) {
         if (!error.message.includes('Supabase') && !error.message.includes('invitación')) {
             console.error("Error en createInvitation:", error.message);
         }
        throw error;
    }
};

/**
 * Llama a la Edge Function para aceptar una invitación.
 * El usuario debe estar autenticado para llamar a esta función.
 * @param {string} invitationCode - El código de invitación.
 * @returns {Promise<object>} - Objeto con mensaje de éxito o detalles del resultado.
 */
export const acceptInvitation = async (invitationCode) => {
    if (!invitationCode || typeof invitationCode !== 'string' || invitationCode.trim().length === 0) {
        console.warn("acceptInvitation: Código de invitación inválido o vacío.");
        throw new Error('Código de invitación inválido.');
    }
    console.log(`Attempting to accept invitation with code: ${invitationCode}`);
    try {
        const { data, error } = await supabase.functions.invoke('accept-invitation', {
            // Asegúrate que el nombre de la propiedad coincida con lo que espera tu Edge Function
            body: { invitationCode: invitationCode },
        });

        if (error) {
            console.error('Supabase function error (accept-invitation):', error.message);
            const detail = error.context?.details || error.message;
            // Intenta dar mensajes más útiles basados en errores comunes
            if (detail.includes('Invitation not found or expired')) {
                 throw new Error('La invitación no es válida, ha expirado o ya fue utilizada.');
            } else if (detail.includes('User already member')) {
                 throw new Error('Ya eres miembro de este proyecto.');
            }
            throw new Error(detail || 'Error al aceptar la invitación.');
        }
        console.log("Invitation accepted successfully:", data);
        // Devuelve la respuesta de la función o un mensaje genérico
        return data || { success: true, message: 'Invitación aceptada con éxito.' };
    } catch (error) {
         if (!error.message.includes('Supabase') && !error.message.includes('invitación')) {
             console.error("Error en acceptInvitation:", error.message);
         }
        throw error;
    }
};

/**
 * (Opcional) Obtiene detalles de una invitación antes de aceptarla.
 * Consulta directamente la tabla 'invitaciones' y une con 'proyectos'.
 * @param {string} invitationCode - El código de invitación.
 * @returns {Promise<object|null>} - Detalles de la invitación (proyecto, rol, inviter) o null si no se encuentra/es inválida.
 */
export const getInvitationDetails = async (invitationCode) => {
     console.log(`Fetching details for invitation code: ${invitationCode}`);
     // Validación básica del código
     if (!invitationCode || typeof invitationCode !== 'string' || invitationCode.trim().length === 0) {
        console.warn("getInvitationDetails: Código de invitación inválido o vacío.");
        throw new Error('Código de invitación inválido.');
     }

     try {
        // Consulta directa a la tabla 'invitaciones'
        const { data, error } = await supabase
            .from('invitaciones') // Asegúrate que el nombre de la tabla sea correcto
            .select(`
                codigo_invitacion,
                rol_invitado,
                status,
                expires_at,
                id_usuario_invitador,
                proyectos ( nombre )
                // Si necesitas los datos del usuario invitador y la relación está configurada:
                // , usuarios:id_usuario_invitador ( nombre, email )
            `) // Asegúrate que las relaciones ('proyectos', 'usuarios') y columnas sean correctas
            .eq('codigo_invitacion', invitationCode)
            .eq('status', 'pendiente') // Solo busca invitaciones pendientes
            // Opcional: Validar expiración aquí también (aunque la Edge Function debería hacerlo)
            // .gt('expires_at', new Date().toISOString())
            .maybeSingle(); // Devuelve un solo objeto o null si no cumple las condiciones

        if (error) {
            console.error("Supabase error fetching invitation details:", error.message);
            throw new Error('Error al obtener detalles de la invitación.');
        }

        if (!data) {
            console.warn(`Invitación no encontrada o no válida para el código: ${invitationCode}`);
            throw new Error('Invitación no encontrada, inválida o ya utilizada.');
        }

        console.log("Invitation details fetched:", data);
        return data;
    } catch (error) {
         if (!error.message.includes('Supabase') && !error.message.includes('invitación')) {
             console.error("Error en getInvitationDetails:", error.message);
         }
        throw error;
    }
};
