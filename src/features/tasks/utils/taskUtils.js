// c:\Users\Prueb\Documents\projects\proyecto\src\features\tasks\utils\taskUtils.js
import React from 'react';
import { parseISO, isValid, format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    PriorityHigh as PriorityHighIcon,
    Flag as FlagIcon,
    CheckCircleOutline as CheckCircleOutlineIcon,
    Autorenew as AutorenewIcon,
    RadioButtonUnchecked as RadioButtonUncheckedIcon,
    HelpOutline as HelpIcon,
    ErrorOutline, // Usado para Vencida y Bloqueada
    Block as BlockedIconMUI,
    CancelOutlined as CancelledIcon,
    WarningAmberOutlined as WarningIcon, // Para prioridad Alta
} from '@mui/icons-material';

// --- Mapeos de Texto ---
export const prioridadMapping = {
    Baja: 'Baja',
    Media: 'Media',
    Alta: 'Alta',
    Urgente: 'Urgente',
    Vencida: 'Vencida', // *** AÑADIDO ***
    default: 'Normal'
};

export const estadoMapping = {
    Pendiente: 'Pendiente',
    'En Progreso': 'En Progreso',
    Completada: 'Completada',
    Bloqueada: 'Bloqueada',
    Cancelada: 'Cancelada',
    Vencida: 'Vencida',
    default: 'Desconocido'
};

// --- Mapeos de Color ---
export const prioridadColors = {
    Baja: 'success',
    Media: 'info',
    Alta: 'warning',
    Urgente: 'error',
    Vencida: 'error', // *** AÑADIDO: Vencida usa color de error ***
    default: 'grey',
};

export const estadoColors = {
    Pendiente: 'grey',
    'En Progreso': 'info',
    Completada: 'success',
    Bloqueada: 'warning',
    Cancelada: 'error',
    Vencida: 'error',
    default: 'grey',
};


// --- Funciones de Formato de Fecha (sin cambios) ---
export const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'N/A';
    try {
        const date = parseISO(dateString);
        return isValid(date) ? format(date, 'd MMM yy', { locale: es }) : 'Inválida';
    } catch (error) { return 'Inválida'; }
};
export const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
        const date = parseISO(dateString);
        return isValid(date) ? format(date, 'yyyy-MM-dd') : '';
    } catch (error) { return ''; }
};
export const formatSimpleDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = parseISO(dateString);
    return isValid(date) ? format(date, 'dd MMM yyyy', { locale: es }) : 'N/A';
  } catch (error) { return 'N/A'; }
};


// --- Funciones para Obtener Iconos ---

/**
 * Devuelve el componente de icono MUI correspondiente a la prioridad.
 * @param {string} prioridad - La clave de prioridad ('Baja', 'Media', 'Alta', 'Urgente', 'Vencida').
 * @returns {JSX.Element} - El componente de icono.
 */
export const getPrioridadIcon = (prioridad) => {
    switch (prioridad) {
        case 'Urgente':
            return <PriorityHighIcon fontSize="inherit" color="error" />;
        case 'Alta':
            // Usar WarningIcon para diferenciarla de Urgente
            return <WarningIcon fontSize="inherit" color="warning" />;
        case 'Media':
            return <FlagIcon fontSize="inherit" color="info" />;
        case 'Baja':
            return <FlagIcon fontSize="inherit" color="success" />;
        case 'Vencida': // *** AÑADIDO: Icono para Vencida ***
            return <ErrorOutline fontSize="inherit" color="error" />;
        default:
            return <FlagIcon fontSize="inherit" color="disabled" />;
    }
};

/**
 * Devuelve el componente de icono MUI correspondiente al estado.
 * @param {string} estado - La clave de estado.
 * @returns {JSX.Element} - El componente de icono.
 */
export const getEstadoIcon = (estado) => {
    switch (estado) {
        case 'Completada':
            return <CheckCircleOutlineIcon fontSize="inherit" color="success" />;
        case 'En Progreso':
            return <AutorenewIcon fontSize="inherit" color="info" />;
        case 'Pendiente':
            return <RadioButtonUncheckedIcon fontSize="inherit" color="action" />;
        case 'Bloqueada':
             return <BlockedIconMUI fontSize="inherit" color="warning" />;
        case 'Cancelada':
             return <CancelledIcon fontSize="inherit" color="error" />;
        case 'Vencida': // Si es un estado real, usa el mismo icono que la prioridad
             return <ErrorOutline fontSize="inherit" color="error" />;
        default:
            return <HelpIcon fontSize="inherit" color="disabled" />;
    }
};


// --- Función de Ordenamiento (Opcional aquí) ---
export const sortTasksByPriorityAndDate = (tasks) => {
    return [...tasks].sort((a, b) => {
        // *** ACTUALIZADO: Incluye Vencida en el orden ***
        const prioridadOrder = { Urgente: 5, Alta: 3, Media: 2, Baja: 1, Vencida: 0, default: 0 };
        const prioA = prioridadOrder[a.prioridad] ?? prioridadOrder.default;
        const prioB = prioridadOrder[b.prioridad] ?? prioridadOrder.default;
        if (prioA !== prioB) return prioB - prioA;

        const dateAString = a.fecha_vencimiento_orig || a.fecha_vencimiento;
        const dateBString = b.fecha_vencimiento_orig || b.fecha_vencimiento;
        const dateA = dateAString ? parseISO(dateAString) : null;
        const dateB = dateBString ? parseISO(dateBString) : null;
        const isValidA = dateA && isValid(dateA);
        const isValidB = dateB && isValid(dateB);
        if (isValidA && isValidB) {
             if (dateA.getTime() !== dateB.getTime()) return dateA.getTime() - dateB.getTime();
        } else if (isValidA) return -1;
        else if (isValidB) return 1;
        return 0;
    });
};
