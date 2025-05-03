// src/services/authService.js
import { supabase } from '../utils/supabase.js'; // Asegúrate que la ruta a tu cliente Supabase sea correcta

/**
 * Inicia sesión de un usuario usando Supabase Auth.
 * @param {string} email - El email del usuario.
 * @param {string} password - La contraseña del usuario.
 * @returns {Promise<{user: object}>} Una promesa que resuelve con el objeto de usuario de Supabase si el login es exitoso.
 * @throws {Error} Lanza un error si el login falla.
 */
export const loginUser = async (email, password) => {
    try {
        // Llama a Supabase para iniciar sesión
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        // Si Supabase devuelve un error
        if (error) {
            console.error("Supabase login error:", error.message);
            throw new Error(error.message || "Error al iniciar sesión.");
        }

        // Si el login es exitoso, data contiene { user, session }
        if (data?.user) {
            console.log("Login successful for user:", data.user.email);
            return { user: data.user };
        } else {
            throw new Error("No se recibió información del usuario tras el login.");
        }

    } catch (error) {
        console.error("Error en authService.loginUser:", error.message);
        throw error;
    }
};

/**
 * Registra un nuevo usuario usando Supabase Auth.
 * @param {string} email - El email del nuevo usuario.
 * @param {string} password - La contraseña para el nuevo usuario.
 * @param {object} [additionalData={}] - Datos adicionales como { nombre, avatar_url }. `avatar_url` es opcional.
 * @returns {Promise<{user: object}>} Una promesa que resuelve con el objeto del nuevo usuario.
 * @throws {Error} Lanza un error si el registro falla.
 */
export const registerUser = async (email, password, additionalData = {}) => {
    try {
        // Prepara los datos para options.data. Si avatar_url no viene, será null.
        const userData = {
            nombre: additionalData.nombre || null,
            avatar_url: additionalData.avatar_url || null
        };

        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                // Pasa los datos preparados a raw_user_meta_data
                data: userData
            }
        });

        if (error) {
            console.error("Supabase signup error:", error.message);
            throw new Error(error.message || "Error al registrar el usuario.");
        }

        // data.user existirá, pero data.session será null si se requiere confirmación.
        if (data?.user) {
             console.log("Signup successful for user:", data.user.email, "Requires confirmation:", data.session === null);
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

    } catch (error) {
        console.error("Error en authService.logoutUser:", error.message);
        throw error;
    }
};

/**
 * Obtiene la sesión actual del usuario.
 * @returns {Promise<{session: object | null, user: object | null}>} Sesión y usuario, o nulls.
 */
export const getCurrentSession = async () => {
    try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
            console.error("Error fetching session:", error.message);
            return { session: null, user: null };
        }
        return { session: data?.session, user: data?.session?.user ?? null };
    } catch (error) {
        console.error("Unexpected error in authService.getCurrentSession:", error.message);
        return { session: null, user: null };
    }
};

/**
 * Obtiene solo los datos del usuario actual si hay una sesión activa.
 * @returns {Promise<object | null>} Objeto de usuario o null.
 */
export const getCurrentUser = async () => {
    try {
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
 * Escucha los cambios en el estado de autenticación.
 * @param {function(string, object | null): void} callback - Callback con evento y sesión.
 * @returns {{ data: { subscription: object } }} Objeto con la suscripción.
 */
export const onAuthStateChange = (callback) => {
    return supabase.auth.onAuthStateChange((_event, session) => {
        callback(_event, session);
    });
};
