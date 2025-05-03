// src/utils/auth.js
/**
 * Obtiene el token de autenticación almacenado.
 * @returns {string | null} El token o null si no existe.
 */
export const getToken = () => {
    return localStorage.getItem('authToken'); // O sessionStorage si lo usas ahí
};

/**
 * Guarda el token de autenticación.
 * @param {string} token - El token a guardar.
 */
export const setToken = (token) => {
    localStorage.setItem('authToken', token);
};

/**
 * Elimina el token de autenticación almacenado.
 */
export const removeToken = () => {
    localStorage.removeItem('authToken');
};

// Puedes añadir más funciones relacionadas con la autenticación aquí si es necesario
