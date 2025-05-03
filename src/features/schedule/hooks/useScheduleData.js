// src/features/schedule/hooks/useScheduleData.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext.js'; // *** Importa useAuth ***
import * as projectService from '../../projects/services/projectService.js'; // Asume adaptado
import * as taskService from '../../tasks/services/taskService.js'; // Asume adaptado
import { useActivityLog } from '../../../hooks/useActivityLog.js';
import {
    transformTaskToTimelineItem, // calculateProgress ya no se usa aquí directamente para el proyecto
    getUrgencyInfo,
    formatDisplayDate,
} from '../utils/scheduleUtils.js';
// *** AÑADIDO: Importaciones necesarias para calculateProjectTimeProgress ***
import { isValid, parseISO, differenceInMilliseconds, startOfDay, endOfDay } from 'date-fns';
import { isValidProjectId } from '../../../utils/validation.js';

// Helper para asegurar que una fecha sea válida o null (sin cambios)
const safeParseDate = (dateInput) => {
    if (!dateInput) return null;
    try {
        const directDate = new Date(dateInput);
        if (isValid(directDate)) {
            return dateInput;
        } else {
            const isoDate = parseISO(dateInput.includes(' ') ? dateInput.replace(' ', 'T') : dateInput);
            return isValid(isoDate) ? dateInput : null;
        }
    } catch (e) {
        console.warn(`safeParseDate: Error parsing date string "${dateInput}"`, e);
        return null;
    }
};

// Helper para asegurar que un string no sea null/undefined/vacío (sin cambios)
const ensureString = (value, defaultValue = '') => {
    return (value !== null && value !== undefined) ? String(value) : defaultValue;
};

// *** COPIADO/MOVIDO: Función calculateProjectTimeProgress (de useProjects.js) ***
/**
 * Calcula el progreso de un proyecto basado en el tiempo transcurrido.
 * Considera el inicio del día de inicio y el final (23:59:59) del día de fin como el rango total.
 * @param {string | null} startDateString - Fecha de inicio (YYYY-MM-DD o formato parseable por parseISO).
 * @param {string | null} endDateString - Fecha de fin (YYYY-MM-DD o formato parseable por parseISO).
 * @returns {number} - Porcentaje de progreso (0-100).
 */
const calculateProjectTimeProgress = (startDateString, endDateString) => {
    // Si faltan fechas, el progreso es 0.
    if (!startDateString || !endDateString) return 0;

    try {
        // Obtener el inicio (00:00:00) del día de inicio.
        const start = startOfDay(parseISO(startDateString));
        // Obtener el FINAL (23:59:59.999) del día de fin.
        const end = endOfDay(parseISO(endDateString));
        // Momento actual.
        const now = new Date();

        // Validar que las fechas sean válidas y que el inicio sea antes o igual al fin.
        if (!isValid(start) || !isValid(end) || start > end) {
            console.warn("calculateProjectTimeProgress (in useScheduleData): Invalid date range.", { startDateString, endDateString, start, end });
            return 0;
        }

        // Calcular la duración total en milisegundos.
        const totalDuration = differenceInMilliseconds(end, start);
        // Calcular el tiempo transcurrido.
        const elapsedDuration = differenceInMilliseconds(now, start);

        if (totalDuration <= 0) {
             console.warn("calculateProjectTimeProgress (in useScheduleData): Zero or negative total duration.", { start, end, totalDuration });
             return (now >= start) ? 100 : 0;
        }

        // Calcular el porcentaje.
        const progressPercent = (elapsedDuration / totalDuration) * 100;

        // Asegurar rango [0, 100] y redondear.
        const roundedProgress = Math.round(Math.max(0, Math.min(100, progressPercent)));
        return roundedProgress;

    } catch (error) {
        console.error("Error calculating project time progress (in useScheduleData):", error, { startDateString, endDateString });
        return 0;
    }
};

export const useScheduleData = (selectedProjectId = null) => {
    // *** Obtén isAuthenticated y isAuthLoading en lugar de token ***
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const [rawTasks, setRawTasks] = useState([]);
    const [selectedProjectDetails, setSelectedProjectDetails] = useState(null);
    const [generalProjectsData, setGeneralProjectsData] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [errorData, setErrorData] = useState(null);
    const [filters, setFilters] = useState({ priority: 'all' });

    // Hook para el LOG ESPECÍFICO del proyecto (sin cambios)
    const {
        logEntries: specificLogEntries,
        loading: loadingSpecificLog,
        error: errorSpecificLog,
        refreshLog: refreshSpecificLog
    } = useActivityLog(
        selectedProjectId && isValidProjectId(selectedProjectId) ? 'proyectos' : null,
        selectedProjectId && isValidProjectId(selectedProjectId) ? selectedProjectId : null
    );

    // --- Fetch Data (Proyectos y Tareas) ---
    const fetchData = useCallback(async () => {
        // *** Verifica isAuthenticated y isAuthLoading en lugar de token ***
        if (isAuthLoading || !isAuthenticated) {
            console.log("useScheduleData: Esperando autenticación...");
            setErrorData(null); // Limpia error si es por falta de auth
            setLoadingData(false); // No está cargando datos si no está autenticado
            setRawTasks([]);
            setSelectedProjectDetails(null);
            setGeneralProjectsData([]);
            return;
        }

        setLoadingData(true);
        setErrorData(null);
        console.log(`useScheduleData: Starting fetch for ${selectedProjectId ? `Project ID ${selectedProjectId}` : 'Global View'}`);

        let projectDetailsResult = null;
        let projectsForSummary = [];
        let tasksDataArray = [];

        try {
            const isProjectView = selectedProjectId !== null && isValidProjectId(selectedProjectId);

            if (isProjectView) {
                // --- Vista de Proyecto Seleccionado ---
                console.log(`useScheduleData: Fetching project/task data for project ID: ${selectedProjectId}`);
                setGeneralProjectsData([]);

                // Llama a los servicios adaptados a Supabase
                const [projectResult, tasksResult] = await Promise.all([
                    projectService.fetchProyectoById(selectedProjectId),
                    taskService.getTareas(selectedProjectId)
                ]);

                projectDetailsResult = projectResult;
                tasksDataArray = tasksResult || [];

                if (!projectDetailsResult) {
                    throw new Error(`Proyecto con ID ${selectedProjectId} no encontrado o acceso denegado.`);
                }

                // Procesar detalles del proyecto (sin cambios lógicos)
                const validStartDateOrig = safeParseDate(projectDetailsResult.fecha_inicio);
                const validEndDateOrig = safeParseDate(projectDetailsResult.fecha_fin);
                const processedProjectDetails = {
                    ...projectDetailsResult,
                    nombre: ensureString(projectDetailsResult.nombre, 'Proyecto sin nombre'),
                    descripcion: ensureString(projectDetailsResult.descripcion),
                    estado: ensureString(projectDetailsResult.estado?.toLowerCase().replace(/\s+/g, '_'), 'desconocido'),
                    // Asume que fetchProyectoById ya no devuelve nombre_usuario_creador o ajústalo
                    // nombre_usuario_creador: ensureString(projectDetailsResult.nombre_usuario_creador, 'Desconocido'),
                    fecha_inicio_orig: validStartDateOrig,
                    fecha_fin_orig: validEndDateOrig,
                    fecha_inicio_display: formatDisplayDate(validStartDateOrig),
                    fecha_fin_display: formatDisplayDate(validEndDateOrig),
                };
                setSelectedProjectDetails(processedProjectDetails);
                console.log("Processed Project Details:", processedProjectDetails);

                // Procesar tareas (sin cambios lógicos)
                const processedTasks = tasksDataArray.map(task => {
                    const validTaskStartOrig = safeParseDate(task.fecha_inicio);
                    const validTaskDueOrig = safeParseDate(task.fecha_vencimiento);
                    return {
                        ...task,
                        titulo: ensureString(task.titulo, 'Tarea sin título'),
                        descripcion: ensureString(task.descripcion),
                        estado: ensureString(task.estado?.toLowerCase().replace(/\s+/g, '_'), 'pendiente'),
                        prioridad: ensureString(task.prioridad?.toLowerCase(), 'media'),
                        nombre_proyecto: ensureString(processedProjectDetails.nombre, 'Proyecto sin nombre'),
                        fecha_inicio_orig: validTaskStartOrig,
                        fecha_vencimiento_orig: validTaskDueOrig,
                        fecha_inicio_display: formatDisplayDate(validTaskStartOrig),
                        fecha_vencimiento_display: formatDisplayDate(validTaskDueOrig),
                        status: ensureString(task.estado?.toLowerCase().replace(/\s+/g, '_'), 'pendiente'),
                    };
                });
                setRawTasks(processedTasks);
                console.log("Processed Tasks (Specific):", processedTasks);

            } else {
                // --- Vista General ---
                console.log("useScheduleData: Fetching data for Global View.");
                setSelectedProjectDetails(null);

                // Llama a los servicios adaptados a Supabase
                const [projectsResult, tasksResult] = await Promise.all([
                    projectService.fetchProyectos(),
                    taskService.getTareas() // Asume que getTareas sin ID trae todas las visibles
                ]);

                projectsForSummary = projectsResult || [];
                tasksDataArray = tasksResult || [];

                // Procesar proyectos para resumen (sin cambios lógicos)
                const processedProjects = projectsForSummary.map(proj => {
                     const validProjStartOrig = safeParseDate(proj.fecha_inicio);
                     const validProjEndOrig = safeParseDate(proj.fecha_fin);
                     return {
                        ...proj,
                        nombre: ensureString(proj.nombre, 'Proyecto sin nombre'),
                        descripcion: ensureString(proj.descripcion),
                        estado: ensureString(proj.estado?.toLowerCase().replace(/\s+/g, '_'), 'activo'),
                        // nombre_usuario_creador: ensureString(proj.nombre_usuario_creador, 'Desconocido'),
                        fecha_inicio_orig: validProjStartOrig,
                        fecha_fin_orig: validProjEndOrig,
                        fecha_inicio_display: formatDisplayDate(validProjStartOrig),
                        fecha_fin_display: formatDisplayDate(validProjEndOrig),
                    };
                });
                setGeneralProjectsData(processedProjects);
                console.log("Processed Projects for Summary (Global):", processedProjects);

                // Procesar TODAS las tareas (sin cambios lógicos)
                const projectNamesMap = processedProjects.reduce((map, proj) => {
                    if (proj.id_proyecto) map[proj.id_proyecto] = proj.nombre;
                    return map;
                }, {});
                const processedTasks = tasksDataArray.map(task => {
                    const validTaskStartOrig = safeParseDate(task.fecha_inicio);
                    const validTaskDueOrig = safeParseDate(task.fecha_vencimiento);
                    return {
                        ...task,
                        titulo: ensureString(task.titulo, 'Tarea sin título'),
                        descripcion: ensureString(task.descripcion),
                        estado: ensureString(task.estado?.toLowerCase().replace(/\s+/g, '_'), 'pendiente'),
                        prioridad: ensureString(task.prioridad?.toLowerCase(), 'media'),
                        nombre_proyecto: ensureString(projectNamesMap[task.id_proyecto], 'Proyecto Desconocido'),
                        fecha_inicio_orig: validTaskStartOrig,
                        fecha_vencimiento_orig: validTaskDueOrig,
                        fecha_inicio_display: formatDisplayDate(validTaskStartOrig),
                        fecha_vencimiento_display: formatDisplayDate(validTaskDueOrig),
                        status: ensureString(task.estado?.toLowerCase().replace(/\s+/g, '_'), 'pendiente'),
                    };
                });
                setRawTasks(processedTasks);
                console.log("Processed Tasks (Global):", processedTasks);
            }

        } catch (err) {
            console.error("useScheduleData: Error during fetchData:", err);
            const message = err?.message || 'Error al cargar datos del cronograma.';
            setErrorData(message);
            setRawTasks([]);
            setSelectedProjectDetails(null);
            setGeneralProjectsData([]);
        } finally {
            setLoadingData(false);
            console.log("useScheduleData: Fetch finished.");
        }
        // *** Añade isAuthenticated y isAuthLoading como dependencias ***
    }, [selectedProjectId, isAuthenticated, isAuthLoading]);

    useEffect(() => {
        fetchData();
        // *** fetchData ahora depende de isAuthenticated/isAuthLoading ***
    }, [fetchData]);

    // --- Filtrado y Transformación (sin cambios) ---
    const filteredAndTransformedItems = useMemo(() => {
        const items = rawTasks
            .filter(task => {
                const passesPriority = filters.priority === 'all' || task.prioridad === filters.priority;
                return passesPriority;
            })
            .map(task => {
                const timelineItem = transformTaskToTimelineItem(task);
                if (!timelineItem || !timelineItem.date || !isValid(timelineItem.date) || !timelineItem.title) {
                     console.warn(`Task ${task.id_tarea || 'ID missing'} resulted in invalid timeline item.`);
                     return null;
                }
                return timelineItem;
            })
            .filter(item => item !== null);
        return items.sort((a, b) => (a.date?.getTime() ?? 0) - (b.date?.getTime() ?? 0));
    }, [rawTasks, filters]);

    // --- Manejador para cambiar filtros (sin cambios) ---
    const handleFilterChange = useCallback((filterName, value) => {
        if (value !== null && value !== undefined) {
            setFilters(prevFilters => ({ ...prevFilters, [filterName]: value }));
        } else {
            console.warn(`handleFilterChange received null/undefined value for filter '${filterName}'`);
        }
    }, []);

    // --- Calcular detalles para la cabecera (sin cambios) ---
    const projectHeaderData = useMemo(() => {
        if (selectedProjectDetails) {
            // *** CORREGIDO: Usa la función correcta con las fechas originales del proyecto ***
            const progress = calculateProjectTimeProgress(selectedProjectDetails.fecha_inicio, selectedProjectDetails.fecha_fin);
            const urgency = getUrgencyInfo(selectedProjectDetails.fecha_inicio_orig, selectedProjectDetails.fecha_fin_orig, selectedProjectDetails.estado, true);
            return { progress, urgency };
        }
        return { progress: 0, urgency: null };
    }, [selectedProjectDetails]);

    // --- Combinar estados de carga y error (sin cambios) ---
    const combinedLoading = loadingData || (!!selectedProjectId && loadingSpecificLog);
    const combinedError = errorData || (!!selectedProjectId && errorSpecificLog ? `Error en log: ${errorSpecificLog}` : null);

    return {
        timelineItems: filteredAndTransformedItems,
        selectedProjectDetails,
        generalProjectsData,
        projectProgress: projectHeaderData.progress,
        projectUrgencyInfo: projectHeaderData.urgency,
        loading: combinedLoading,
        error: combinedError,
        filters,
        handleFilterChange,
        projectActivityLog: {
            entries: specificLogEntries,
            loading: loadingSpecificLog,
            error: errorSpecificLog,
            refreshLog: refreshSpecificLog
        },
        refreshScheduleData: fetchData
    };
};
