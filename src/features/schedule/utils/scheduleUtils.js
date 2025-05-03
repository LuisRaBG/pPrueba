// src/features/schedule/utils/scheduleUtils.js
import {
    parseISO, format, differenceInDays, isValid, startOfDay, isPast, isToday
} from 'date-fns';
import { es } from 'date-fns/locale';
import {
    Event as DefaultIcon,
    CheckCircleOutline as CompletedIcon,
    CancelOutlined as CancelledIcon,
    ErrorOutline as ErrorIcon,
    WarningAmber as WarningIcon,
    InfoOutlined as InfoIcon,
    PlayCircleOutline as NotStartedIcon,
    HourglassTop as StartingSoonIcon,
} from '@mui/icons-material';
// alpha no se usa aquí

// --- Constantes (sin cambios) ---
const URGENCY_THRESHOLDS = { HIGH: 25, MEDIUM: 75 };
const DAYS_STARTING_SOON = 3;

// --- Funciones de Formato (Simplificando parseo) ---
const safeParseDate = (dateInput) => {
    if (!dateInput) return null;
    try {
        // Intentar con new Date() que es más flexible
        const date = new Date(dateInput);
        // Si new Date() falla, intentar con parseISO (para formatos ISO estrictos)
        if (!isValid(date)) {
            const isoDate = parseISO(dateInput.includes(' ') ? dateInput.replace(' ', 'T') : dateInput);
            return isValid(isoDate) ? isoDate : null;
        }
        return date;
    } catch (e) {
        console.error("safeParseDate: Error parsing date:", dateInput, e);
        return null;
    }
};

export const formatDisplayDate = (dateInput) => {
    const date = safeParseDate(dateInput);
    return date ? format(date, 'dd MMM yyyy', { locale: es }) : 'N/A';
};

export const formatDisplayTime = (dateInput) => {
    const date = safeParseDate(dateInput);
    return date ? format(date, 'HH:mm', { locale: es }) : '';
};

// --- calculateProgress (Simplificando parseo) ---
export const calculateProgress = (startDateStr, endDateStr) => {
    const start = safeParseDate(startDateStr);
    const end = safeParseDate(endDateStr);
    const today = startOfDay(new Date());

    if (!start || !end || start > end) return 0;
    if (today > end) return 100;
    if (today < start) return 0;

    const totalDuration = differenceInDays(end, start);
    const elapsedDuration = differenceInDays(today, start);

    if (totalDuration === 0) return today >= start ? 100 : 0;

    const progress = Math.max(0, Math.min(100, (elapsedDuration / totalDuration) * 100));
    return Math.round(progress);
};

// --- getUrgencyInfo (Añadiendo Logs y simplificando parseo) ---
export const getUrgencyInfo = (startDateStr, endDateStr, status, isProject = false) => {
    const safeStatus = status?.toLowerCase() || 'desconocido';
    // Log inicial
    console.log(`getUrgencyInfo called with: start=${startDateStr}, end=${endDateStr}, status=${safeStatus}`);

    // 1. Estados Finales
    if (safeStatus === 'completado' || safeStatus === 'finalizado') {
        return { colorName: 'success', label: 'Completado', icon: CompletedIcon };
    }
    if (safeStatus === 'cancelado' || safeStatus === 'archivado') {
        return { colorName: 'action', label: 'Cancelado', icon: CancelledIcon };
    }

    // 2. Validar Fechas
    const start = safeParseDate(startDateStr);
    const end = safeParseDate(endDateStr);
    const today = startOfDay(new Date());

    // Log de fechas parseadas
    console.log(`getUrgencyInfo parsed dates: start=${start}, end=${end}, today=${today}`);

    if (!start || !end || start > end) {
        console.log("getUrgencyInfo result: Fechas Inválidas");
        return { colorName: 'grey', label: 'Fechas Inválidas', icon: DefaultIcon };
    }

    // 3. Verificar si ya Venció
    if (isPast(end) && !isToday(end)) {
        console.log("getUrgencyInfo result: Vencido");
        return { colorName: 'error', label: 'Vencido', icon: ErrorIcon };
    }

    // 4. Verificar si Aún No Empieza
    if (today < start) {
        const daysUntilStart = differenceInDays(start, today);
        if (daysUntilStart <= DAYS_STARTING_SOON) {
            console.log(`getUrgencyInfo result: Empieza pronto (${daysUntilStart}d)`);
            return { colorName: 'info', label: `Empieza pronto (${daysUntilStart}d)`, icon: StartingSoonIcon };
        }
        console.log("getUrgencyInfo result: Pendiente Inicio");
        return { colorName: 'default', label: 'Pendiente Inicio', icon: NotStartedIcon };
    }

    // 5. Calcular Porcentaje de Tiempo Restante
    const totalDuration = differenceInDays(end, start) + 1;
    const remainingDays = differenceInDays(end, today) + 1;

    console.log(`getUrgencyInfo calculation: totalDuration=${totalDuration}, remainingDays=${remainingDays}`);

    if (totalDuration <= 0) {
        const resultLabel = isToday(end) ? 'Vence Hoy' : 'Duración Inválida';
        const resultColor = isToday(end) ? 'error' : 'grey';
        console.log(`getUrgencyInfo result: ${resultLabel}`);
        return { colorName: resultColor, label: resultLabel, icon: isToday(end) ? ErrorIcon : DefaultIcon };
    }

    const percentageRemaining = Math.max(0, (remainingDays / totalDuration) * 100);
    console.log(`getUrgencyInfo calculation: percentageRemaining=${percentageRemaining}%`);

    // 6. Asignar Urgencia por Porcentaje
    if (percentageRemaining <= URGENCY_THRESHOLDS.HIGH) {
        console.log("getUrgencyInfo result: Urgente (<= HIGH)");
        return { colorName: 'error', label: 'Urgente', icon: ErrorIcon };
    } else if (percentageRemaining <= URGENCY_THRESHOLDS.MEDIUM) {
        console.log("getUrgencyInfo result: Próximo (<= MEDIUM)");
        return { colorName: 'warning', label: 'Próximo', icon: WarningIcon };
    } else {
        console.log("getUrgencyInfo result: Normal (> MEDIUM)");
        return { colorName: 'info', label: 'Normal', icon: InfoIcon };
    }
    // El bloque catch no es necesario aquí si safeParseDate maneja errores
};


// --- transformTaskToTimelineItem (Simplificando parseo y validación) ---
export const transformTaskToTimelineItem = (task) => {
    if (!task || !task.fecha_vencimiento) {
        console.warn("transformTaskToTimelineItem: Tarea inválida o sin fecha de vencimiento:", task);
        return null;
    }

    const date = safeParseDate(task.fecha_vencimiento); // Usar fecha de vencimiento

    if (!date) { // safeParseDate devuelve null si es inválida
        console.warn("transformTaskToTimelineItem: Fecha de vencimiento inválida para tarea:", task.id_tarea, task.fecha_vencimiento);
        return null;
    }

    // Obtener info de urgencia basada en fechas y estado de la TAREA
    // Pasamos las fechas originales (string o null) y el status
    const urgency = getUrgencyInfo(task.fecha_inicio, task.fecha_vencimiento, task.status, false);

    // Construir la descripción
    const descriptionParts = [];
    // Mostrar prioridad si es diferente de 'media'
    if (task.prioridad && task.prioridad !== 'media') {
         descriptionParts.push(`Prioridad: ${task.prioridad}`);
    }
    // Añadir nombre del proyecto si existe
    if (task.nombre_proyecto) {
        descriptionParts.push(`(${task.nombre_proyecto})`);
    }

    return {
        id: `task-${task.id_tarea}`,
        type: 'task',
        date: date, // Objeto Date válido
        title: task.titulo || 'Tarea sin título',
        description: descriptionParts.join('. ') || '', // Asegurar string vacío si no hay partes
        status: task.status,
        priority: task.prioridad,
        colorName: urgency.colorName, // Usar color de la urgencia calculada
        iconComponent: urgency.icon, // Usar icono de la urgencia calculada
        fecha_inicio_orig: task.fecha_inicio_orig,
        fecha_vencimiento_orig: task.fecha_vencimiento_orig,
        fecha_inicio_display: task.fecha_inicio_display,
        fecha_vencimiento_display: task.fecha_vencimiento_display,
    };
    // El bloque catch no es necesario si safeParseDate maneja errores
};
