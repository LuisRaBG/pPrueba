// src/features/auth/services/userService.js
import { supabase } from '../utils/supabase.js'; // Asegúrate que la ruta sea correcta

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

    // Selecciona las columnas existentes en tu tabla 'usuarios'
    const selectColumns = `
        id,
        nombre,
        email,
        avatar_url,
        estado,
        created_at
    `;
    // Nota: 'fecha_registro' y 'ultimo_login' no están en tu schema, se usa 'created_at'

    try {
        const { data, error, status } = await supabase
            .from(USERS_TABLE)
            .select(selectColumns)
            // Filtra usando la columna 'id' (UUID) que coincide con auth.users.id
            .eq('id', userId)
            .maybeSingle(); // Usa maybeSingle para obtener null en lugar de error si no existe

        // Error si no es un "no encontrado" (que puede ser normal si el perfil se crea después)
        if (error && status !== 406) {
            console.error(`Supabase error fetching user data for user ${userId}:`, error.message);
            throw new Error(error.message || 'Error al obtener los datos del usuario.');
        }

        // Devuelve los datos del usuario (puede ser null)
        return data;

    } catch (error) {
        // Evita duplicar logs si ya es un error de Supabase
        if (!error.message.includes('Supabase')) {
            console.error(`Error en userService.getUserData for user ${userId}:`, error.message);
        }
        throw error; // Relanza para que el llamador lo maneje
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
        // Podrías devolver los datos actuales o null
        return getUserData(userId);
    }

    // Filtra los campos permitidos para actualizar en la tabla 'usuarios'
    const allowedUpdates = {};
    if (userData.nombre !== undefined) allowedUpdates.nombre = userData.nombre.trim(); // Limpia espacios
    if (userData.avatar_url !== undefined) allowedUpdates.avatar_url = userData.avatar_url; // Permite null o URL
    if (userData.estado !== undefined) allowedUpdates.estado = userData.estado;
    // Añade otros campos de 'usuarios' que quieras permitir actualizar aquí
    // ¡NO incluyas 'id', 'email', 'created_at'!

    if (Object.keys(allowedUpdates).length === 0) {
         console.warn("userService.updateUserData: Ningún campo válido para actualizar proporcionado.");
         return getUserData(userId); // Devuelve datos actuales
    }

    console.log(`userService.updateUserData: Attempting to update user ${userId} with:`, allowedUpdates);

    try {
        // Usa maybeSingle para obtener null si RLS impide leer después de actualizar
        const { data, error } = await supabase
            .from(USERS_TABLE)
            .update(allowedUpdates)
            .eq('id', userId) // Filtra por el ID UUID
            .select() // Selecciona la fila actualizada
            .maybeSingle();

        if (error) {
            console.error(`Supabase error updating user data for user ${userId}:`, error.message);
            if (error.code === '42501') { // permission denied
                 throw new Error('No tienes permiso para actualizar este perfil.');
            }
            throw new Error(error.message || 'Error al actualizar los datos del usuario.');
        }

        if (!data) {
            // Esto podría pasar si RLS bloquea la lectura después de un update exitoso
            console.warn(`User data for ${userId} might have been updated, but could not be read back. Check RLS SELECT policy.`);
            // Intenta obtener los datos de nuevo como fallback
            return getUserData(userId);
        }

        console.log(`User data updated successfully for user ${userId}:`, data);
        return data; // Devuelve los datos actualizados

    } catch (error) {
        if (!error.message.includes('Supabase') && !error.message.includes('permiso')) {
            console.error(`Error en userService.updateUserData for user ${userId}:`, error.message);
        }
        throw error; // Relanza
    }
};

// --- Funciones para actualizar user_metadata en supabase.auth ---
// Estas son las que probablemente necesites para nombre y avatar si los guardas ahí

/**
 * Actualiza los metadatos del usuario autenticado en Supabase Auth.
 * @param {object} metadataUpdates - Objeto con los campos a actualizar en user_metadata (ej: { nombre: 'Nuevo', avatar_url: '...' }).
 * @returns {Promise<object>} Una promesa que resuelve con el objeto user actualizado de Supabase Auth.
 * @throws {Error} Lanza un error si la actualización falla.
 */
export const updateUserMetadata = async (metadataUpdates) => {
    if (!metadataUpdates || Object.keys(metadataUpdates).length === 0) {
        console.warn("updateUserMetadata: No updates provided.");
        return null; // O el usuario actual
    }

    // Limpia los datos si es necesario (ej. trim nombre)
    const cleanUpdates = { ...metadataUpdates };
    if (cleanUpdates.nombre) {
        cleanUpdates.nombre = cleanUpdates.nombre.trim();
    }

    console.log("updateUserMetadata: Attempting to update auth user metadata with:", cleanUpdates);

    try {
        const { data, error } = await supabase.auth.updateUser({
            data: cleanUpdates // Supabase guarda esto en user.user_metadata
        });

        if (error) {
            console.error("Supabase error updating user metadata:", error.message);
            throw new Error(error.message || "Error al actualizar la información del perfil.");
        }

        console.log("User metadata updated successfully:", data.user);
        return data.user; // Devuelve el objeto user actualizado

    } catch (error) {
        if (!error.message.includes('Supabase')) {
            console.error(`Error en updateUserMetadata:`, error.message);
        }
        throw error;
    }
};

// --- Funciones de Avatar (Ejemplo Básico) ---
// Necesitarás adaptar esto a tu configuración de Supabase Storage

const AVATAR_BUCKET = 'avatars'; // Nombre de tu bucket de avatares

/**
 * Sube un archivo de avatar a Supabase Storage.
 * @param {File} file - El archivo a subir.
 * @param {string} userId - El ID del usuario para nombrar el archivo.
 * @returns {Promise<string>} La URL pública del archivo subido.
 */
export const uploadAvatar = async (file, userId) => {
    if (!file || !userId) {
        throw new Error("Se requiere archivo y userId para subir avatar.");
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`; // Ruta dentro del bucket

    console.log(`Uploading avatar to ${AVATAR_BUCKET}/${filePath}`);

    const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(filePath, file, { upsert: true }); // upsert: true sobrescribe si ya existe

    if (uploadError) {
        console.error("Error uploading avatar:", uploadError);
        throw new Error(uploadError.message || "Error al subir la imagen.");
    }

    // Obtener la URL pública
    const { data } = supabase.storage
        .from(AVATAR_BUCKET)
        .getPublicUrl(filePath);

    if (!data?.publicUrl) {
         console.error("Could not get public URL for uploaded avatar:", filePath);
         throw new Error("No se pudo obtener la URL pública de la imagen subida.");
    }

    console.log("Avatar uploaded successfully. Public URL:", data.publicUrl);
    return data.publicUrl;
};
