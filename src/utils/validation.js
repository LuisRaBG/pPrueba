// src/utils/validation.js

/**
 * Valida si un ID (como id_proyecto o id_tarea) es un número entero positivo válido.
 * Útil si *algunos* de tus IDs son numéricos.
 * @param {any} id - El valor a validar.
 * @returns {boolean} - True si es un número entero positivo válido, false en caso contrario.
 */
const isValidNumericId = (id) => {
    if (id === null || id === undefined) return false;
    const numId = Number(id);
    return !isNaN(numId) && isFinite(numId) && Number.isInteger(numId) && numId > 0;
};

/**
 * Valida si un ID es un UUID válido (formato string).
 * @param {any} id - El ID a validar.
 * @returns {boolean} - True si es un string UUID válido, false en caso contrario.
 */
const isValidUUID = (id) => {
    // Verifica que sea un string no vacío.
    if (typeof id !== 'string' || !id) {
        return false;
    }
    // Expresión regular simple para el formato UUID estándar.
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
};


/**
 * Valida si un ID de proyecto es válido (asumiendo que es UUID).
 * @param {any} id - El ID a validar.
 * @returns {boolean} - True si es válido, false en caso contrario.
 */
export const isValidProjectId = (id) => {
    // *** CORREGIDO: Usa la validación de UUID ***
    return isValidUUID(id);
};

/**
 * Valida si un ID de tarea es válido (asumiendo que es numérico).
 * AJUSTA ESTO SI TUS IDs DE TAREA TAMBIÉN SON UUIDs.
 * @param {any} id - El ID a validar.
 * @returns {boolean} - True si es válido, false en caso contrario.
 */
export const isValidTaskId = (id) => {
    // Mantenemos la validación numérica aquí, ¡pero cámbiala a isValidUUID si es necesario!
    return isValidNumericId(id);
};

/**
 * Valida si un ID de usuario es un UUID válido (formato string).
 * @param {any} id - El ID a validar.
 * @returns {boolean} - True si es un string UUID válido, false en caso contrario.
 */
export const isValidUserId = (id) => {
    // Reutiliza la función genérica para UUIDs.
    return isValidUUID(id);
};

// Puedes añadir más funciones de validación aquí
