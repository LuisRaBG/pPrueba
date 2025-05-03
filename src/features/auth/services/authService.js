// src/features/auth/services/authService.js
// Importa el cliente Supabase en lugar de apiClient
import { supabase } from '../../../utils/supabase.js'; // Asegúrate que la ruta a tu cliente Supabase sea correcta

/**
 * Inicia sesión de un usuario usando Supabase Auth.
 * @param {string} email - El email del usuario (Supabase usa email, no username).
 * @param {string} password - La contraseña del usuario.
 * @returns {Promise<{user: object}>} Una promesa que resuelve con el objeto de usuario de Supabase si el login es exitoso.
 * @throws {Error} Lanza un error si el login falla.
 */
export const loginUser = async (email, password) => {
    try {
        // Llama a Supabase para iniciar sesión con email y contraseña
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        // Si Supabase devuelve un error (ej. credenciales inválidas)
        if (error) {
            console.error("Supabase login error:", error.message);
            // Puedes personalizar el mensaje si quieres, pero el de Supabase suele ser claro
            throw new Error(error.message || "Error al iniciar sesión.");
        }

        // Si el login es exitoso, data contiene { user, session }
        // Devolvemos solo el objeto 'user' para que el AuthContext lo maneje.
        // Supabase gestiona la sesión y el token internamente.
        if (data?.user) {
            console.log("Login successful for user:", data.user.email);
            return { user: data.user }; // Devuelve el objeto de usuario
        } else {
            // Salvaguarda por si no hay error pero tampoco usuario (poco probable)
            throw new Error("No se recibió información del usuario tras el login.");
        }

    } catch (error) {
        // Captura errores lanzados por nosotros o errores inesperados
        console.error("Error en authService.loginUser:", error.message);
        // Relanzar para que el componente que llama (ej. Login) pueda manejarlo
        throw error;
    }
};

/**
 * Registra un nuevo usuario usando Supabase Auth.
 * @param {string} email - El email del nuevo usuario.
 * @param {string} password - La contraseña para el nuevo usuario.
 * @param {object} [additionalData={}] - Datos adicionales para almacenar (ej. nombre completo).
 *                                      Se guardarán en auth.users.raw_user_meta_data
 *                                      o puedes usar triggers para copiarlos a una tabla 'profiles'.
 * @returns {Promise<{user: object}>} Una promesa que resuelve con el objeto del nuevo usuario.
 * @throws {Error} Lanza un error si el registro falla.
 */
export const registerUser = async (email, password, additionalData = {}) => {
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                // Pasa datos adicionales aquí (ej: { full_name: 'Juan Pérez' })
                data: additionalData
            }
        });

        if (error) {
            console.error("Supabase signup error:", error.message);
            throw new Error(error.message || "Error al registrar el usuario.");
        }

        // Importante: Si tienes habilitada la confirmación por email en Supabase (recomendado),
        // data.user existirá, pero data.session será null hasta que se confirme.
        // Tu UI debe manejar esto (ej. mostrar mensaje "Revisa tu email para confirmar").
        if (data?.user) {
             console.log("Signup successful for user:", data.user.email, "- Requires confirmation:", data.session === null);
            return { user: data.user };
        } else {
            throw new Error("No se recibió información del usuario tras el registro.");
        }

    } catch (error) {
        console.error("Error en authService.registerUser:", error.message);
        throw error;
    }
};

/**
 * Cierra la sesión del usuario actual en Supabase.
 * @returns {Promise<void>} Una promesa que resuelve cuando el logout se completa.
 * @throws {Error} Lanza un error si el logout falla.
 */
export const logoutUser = async () => {
    try {
        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error("Supabase logout error:", error.message);
            throw new Error(error.message || "Error al cerrar sesión.");
        }
        console.log("Logout successful");
        // No devuelve nada en caso de éxito

    } catch (error) {
        console.error("Error en authService.logoutUser:", error.message);
        throw error;
    }
};

/**
 * Obtiene la sesión actual del usuario desde Supabase (incluye token y datos del usuario).
 * Útil para verificar si el usuario ya está logueado al cargar la app.
 * @returns {Promise<{session: object | null, user: object | null}>} Una promesa que resuelve con la sesión y el usuario, o null si no hay sesión activa.
 */
export const getCurrentSession = async () => {
    try {
        // getSession lee la sesión almacenada por Supabase (localStorage por defecto)
        const { data, error } = await supabase.auth.getSession();

        if (error) {
            console.error("Error fetching session:", error.message);
            // No lanzamos error aquí, simplemente devolvemos nulls para que AuthContext lo maneje
            return { session: null, user: null };
        }

        // Devuelve la sesión y el usuario (pueden ser null si no hay sesión)
        return { session: data?.session, user: data?.session?.user ?? null };

    } catch (error) {
        // Error inesperado durante la obtención de la sesión
        console.error("Unexpected error in authService.getCurrentSession:", error.message);
        return { session: null, user: null };
    }
};

/**
 * Obtiene solo los datos del usuario actual si hay una sesión activa.
 * @returns {Promise<object | null>} Una promesa que resuelve con el objeto de usuario o null.
 */
export const getCurrentUser = async () => {
    try {
        // getUser es similar a getSession pero solo devuelve el usuario
        const { data, error } = await supabase.auth.getUser();

        if (error) {
            console.error("Error fetching user:", error.message);
            return null;
        }
        return data?.user ?? null;

    } catch (error) {
        console.error("Unexpected error in authService.getCurrentUser:", error.message);
        return null;
    }
};

/**
 * Escucha los cambios en el estado de autenticación de Supabase (login, logout, refresh).
 * Esta es la forma recomendada para mantener sincronizado el estado de autenticación en React,
 * usualmente se usa dentro de un AuthContext.
 * @param {function(string, object | null): void} callback - Función que se llamará cuando cambie el estado. Recibe el evento ('SIGNED_IN', 'SIGNED_OUT', 'TOKEN_REFRESHED', etc.) y la sesión actual (o null).
 * @returns {{ data: { subscription: object } }} Un objeto con la suscripción, que tiene un método .unsubscribe() para limpiar el listener.
 */
export const onAuthStateChange = (callback) => {
    // Devuelve directamente el resultado de onAuthStateChange, que incluye
    // la suscripción para poder cancelarla (importante en useEffect de AuthContext).
    return supabase.auth.onAuthStateChange((_event, session) => {
        // Puedes añadir logs aquí si quieres depurar los eventos
        // console.log('Auth state changed:', _event, session);
        callback(_event, session);
    });
};
