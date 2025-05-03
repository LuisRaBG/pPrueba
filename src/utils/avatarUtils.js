// src/utils/avatarUtils.js
import React from 'react'; // Necesario para React.createElement

// --- Iconos Predefinidos de react-icons/fc ---
import {
    FcBusinessman, FcBusinesswoman, FcLinux, FcAndroidOs, FcMultipleDevices,
    FcBearish, FcBullish, FcLike, FcGlobe, FcLandscape, FcNightLandscape,
    FcSportsMode, FcVlc, FcMindMap, FcBiotech
    // Puedes añadir más iconos válidos de la lista si quieres
} from "react-icons/fc";
// --- Fin Iconos Predefinidos ---

// --- Configuración de Iconos ---
// Mapea nombres (que guardarás en Supabase) a los componentes de icono
export const predefinedIcons = {
    businessman: FcBusinessman,
    businesswoman: FcBusinesswoman,
    linux: FcLinux, // Pingüino de Linux
    android: FcAndroidOs,
    devices: FcMultipleDevices,
    bear: FcBearish,
    bull: FcBullish,
    like: FcLike,
    globe: FcGlobe,
    landscape: FcLandscape,
    night: FcNightLandscape,
    sports: FcSportsMode,
    vlc: FcVlc,
    mindmap: FcMindMap,
    biotech: FcBiotech,
};

// Icono por defecto si no se encuentra o no se ha seleccionado ninguno
export const defaultIconName = 'linux';

/**
 * Obtiene el componente de icono React basado en su nombre.
 * @param {string | null | undefined} iconName - El nombre del icono guardado en user_metadata.
 * @returns {React.ComponentType} El componente de icono React (o el default).
 */
export const getIconComponent = (iconName) => {
    // Asegura que se use el default si iconName es null, undefined o no está en la lista
    const effectiveIconName = iconName || defaultIconName;
    return predefinedIcons[effectiveIconName] || predefinedIcons[defaultIconName];
};

/**
 * Genera las iniciales a partir de un nombre.
 * @param {string | null | undefined} name - El nombre del usuario.
 * @returns {string} Las iniciales (ej: "JD") o "?".
 */
export const getInitials = (name) => {
    if (!name) return '?';
    const names = name.trim().split(' ').filter(n => n); // Filtra partes vacías
    if (names.length === 0) return '?';
    if (names.length === 1) return names[0][0]?.toUpperCase() || '?';
    // Toma la primera letra del primer nombre y la primera del último nombre
    const firstInitial = names[0][0] || '';
    const lastInitial = names[names.length - 1]?.[0] || '';
    return (firstInitial + lastInitial).toUpperCase();
};


/**
 * Renderiza el contenido del Avatar basado en la prioridad: Icono > URL > Iniciales.
 * @param {object | null | undefined} user - El objeto user de Supabase Auth o un objeto similar con user_metadata.
 * @param {object} [iconStyle={ fontSize: '1.5rem' }] - Estilos a aplicar al icono si se renderiza.
 * @returns {React.ReactNode | null} El contenido para el Avatar (Icono, null si usa src, o Iniciales).
 */
export const renderAvatarContent = (user, iconStyle = { fontSize: '1.5rem' }) => {
    // Accede a user_metadata de forma segura
    const metadata = user?.user_metadata;
    const iconName = metadata?.icon_name;
    const avatarUrl = metadata?.avatar_url; // O user?.avatar_url si lo usas directamente
    const nombre = metadata?.nombre;

    // Prioridad 1: Icono predefinido
    if (iconName && predefinedIcons[iconName]) {
        const IconComponent = getIconComponent(iconName);
        // Usamos React.createElement para poder pasar props dinámicamente
        return React.createElement(IconComponent, { style: iconStyle });
    }
    // Prioridad 2: URL de Avatar (si existe, el Avatar usará `src`, devolvemos null)
    else if (avatarUrl) {
        // El componente Avatar se encargará de mostrar la imagen usando la prop `src`.
        // Devolvemos null para que no intente renderizar iniciales encima.
        return null;
    }
    // Prioridad 3: Iniciales (si no hay icono ni URL)
    else {
        return getInitials(nombre);
    }
};
