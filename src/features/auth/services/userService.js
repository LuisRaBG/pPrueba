// src/features/auth/services/userService.js
import { supabase } from '../../../utils/supabase.js'; // Asegúrate que la ruta sea correcta

const USERS_TABLE = 'usuarios'; // Nombre de tu tabla

/**
 * Obtiene los datos de perfil/usuario desde la tabla 'usuarios'.
 * @param {string} userId - El ID del usuario (UUID de supabase.auth.user.id).
 * @returns {Promise<object | null>} Una promesa que resuelve con los datos del usuario o null si no se encuentra.
 * @throws {Error} Lanza un error si la obtención falla.
 */
export const getUserData = async (userId) => {
    if (!userId) {
        console.warn("userService.getUserData: Se requiere userId (UUID).");
        return null;
    }

    // *** CORREGIDO: Selecciona las columnas correctas de 'usuarios' ***
    //    Asegúrate que estas columnas existan en tu tabla.
    const selectColumns = `
        id,
        nombre,
        email,
        avatar_url,
        estado,
        fecha_registro,
        ultimo_login
    `;
    // Quita 'id_usuario' y 'avatar' si no existen o se llaman diferente.

    try {
        const { data, error, status } = await supabase
            .from(USERS_TABLE)
            .select(selectColumns)
            // *** CORREGIDO: Filtra usando la columna 'id' (UUID) que enlaza con auth.users.id ***
            .eq('id', userId)
            .single(); // Espera un único resultado

        // Manejo de error 406 (Not Found) es normal si el perfil aún no existe
        if (error && status !== 406) {
            console.error(`Supabase error fetching user data for user ${userId}:`, error.message);
            throw new Error(error.message || 'Error al obtener los datos del usuario.');
        }

        // Devuelve los datos del usuario (puede ser null si no se encontró)
        return data;

    } catch (error) {
        if (!error.message.includes('Supabase')) {
            console.error(`Error en userService.getUserData for user ${userId}:`, error.message);
        }
        throw error;
    }
};

/**
 * Actualiza datos en la tabla 'usuarios'.
 * NO USAR para actualizar email o contraseña (usar supabase.auth.updateUser).
 * @param {string} userId - El ID del usuario (UUID) cuyo perfil se actualizará.
 * @param {object} userData - Objeto con los campos a actualizar (ej: { nombre: 'Nuevo Nombre', avatar_url: '...', estado: 'activo' }).
 * @returns {Promise<object>} Una promesa que resuelve con los datos actualizados.
 * @throws {Error} Lanza un error si la actualización falla.
 */
export const updateUserData = async (userId, userData) => {
    if (!userId) {
        throw new Error("Se requiere userId (UUID) para actualizar datos de usuario.");
    }
    if (!userData || Object.keys(userData).length === 0) {
        console.warn("userService.updateUserData: No se proporcionaron datos para actualizar.");
        return null;
    }

    // Filtra los campos permitidos para actualizar
    const allowedUpdates = {};
    if (userData.nombre !== undefined) allowedUpdates.nombre = userData.nombre;
    // *** CORREGIDO: Usa avatar_url ***
    if (userData.avatar_url !== undefined) allowedUpdates.avatar_url = userData.avatar_url;
    if (userData.estado !== undefined) allowedUpdates.estado = userData.estado;
    // Añade otros campos actualizables aquí

    if (Object.keys(allowedUpdates).length === 0) {
         console.warn("userService.updateUserData: Ningún campo válido para actualizar proporcionado.");
         return null;
    }

    console.log(`userService.updateUserData: Attempting to update user ${userId} with:`, allowedUpdates);

    try {
        const { data, error } = await supabase
            .from(USERS_TABLE)
            .update(allowedUpdates)
            .eq('id', userId) // Filtra por el ID UUID
            .select()
            .single();

        if (error) {
            console.error(`Supabase error updating user data for user ${userId}:`, error.message);
            throw new Error(error.message || 'Error al actualizar los datos del usuario.');
        }

        console.log(`User data updated successfully for user ${userId}:`, data);
        return data;

    } catch (error) {
        if (!error.message.includes('Supabase')) {
            console.error(`Error en userService.updateUserData for user ${userId}:`, error.message);
        }
        throw error;
    }
};

// --- Recordatorio Importante ---
// (Sin cambios en el recordatorio)
