// c:\Users\Prueb\Documents\projects\proyecto\src\features\projects\utils\projectUtils.js
import { parseISO, isValid, format } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Formatea una cadena de fecha (ej. 'YYYY-MM-DD') para mostrarla al usuario de forma simple.
 * @param {string | null | undefined} dateString - La cadena de fecha.
 * @returns {string} - La fecha formateada (ej. '15 Abr 2024') o 'N/A'.
 */
export const formatSimpleDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = parseISO(dateString); // date-fns parsea YYYY-MM-DD correctamente
    return isValid(date) ? format(date, 'dd MMM yyyy', { locale: es }) : 'N/A';
  } catch (error) {
    console.error("Error formateando fecha simple:", dateString, error);
    return 'N/A'; // Devuelve 'N/A' si falla
  }
};

/**
 * Formatea una cadena de fecha para usarla en un input[type="date"].
 * @param {string | null | undefined} dateString - La cadena de fecha.
 * @returns {string} - La fecha en formato 'YYYY-MM-DD' o ''.
 */
export const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
        const date = parseISO(dateString);
        return isValid(date) ? format(date, 'yyyy-MM-dd') : '';
    } catch (error) {
        console.error("Error formateando fecha para input:", dateString, error);
        return '';
    }
};

/**
 * Calcula el progreso de un proyecto basado en sus tareas (si se proporcionan).
 * Esta es una función de ejemplo, necesitarás adaptarla a cómo calculas el progreso.
 * @param {Array<object>} tasks - Array de tareas asociadas al proyecto.
 * @returns {number} - El progreso como un porcentaje (0-100).
 */
export const calculateProjectProgress = (tasks = []) => {
    if (!tasks || tasks.length === 0) {
        return 0; // Sin tareas, progreso 0
    }
    const completedTasks = tasks.filter(task => task.estado === 'completada').length;
    const progress = Math.round((completedTasks / tasks.length) * 100);
    return progress;
};

/**
 * Devuelve un color de la paleta MUI basado en el estado del proyecto.
 * @param {string} estado - El estado del proyecto ('activo', 'pausado', etc.).
 * @returns {string} - El nombre del color en la paleta MUI (ej. 'success', 'warning').
 */
export const getProjectStatusColor = (estado) => {
    switch (estado?.toLowerCase()) {
        case 'activo': return 'success';
        case 'pausado': return 'warning';
        case 'completado': return 'info';
        case 'cancelado': return 'error';
        default: return 'grey';
    }
};

// Puedes añadir más funciones de utilidad específicas para proyectos aquí.
// Por ejemplo, para ordenar proyectos, validar datos, etc.
