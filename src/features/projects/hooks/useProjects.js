// src/features/projects/hooks/useProjects.js
import { useState, useEffect, useCallback, useMemo } from 'react';
import * as projectService from '../services/projectService.js';
import { useProject } from '../../../contexts/ProjectContext.js'; // Ajusta la ruta si es necesario
// --- Añadido: Importar funciones de date-fns y formateador ---
import { format as formatDateFns } from 'date-fns'; // Renombrado para evitar colisión
// *** CORREGIDO: Importar endOfDay ***
import { parseISO, isValid, differenceInMilliseconds, startOfDay, endOfDay } from 'date-fns';

// --- Añadido: Función para calcular el progreso basado en tiempo ---
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
        // *** CORREGIDO: Obtener el FINAL (23:59:59.999) del día de fin. ***
        const end = endOfDay(parseISO(endDateString));
        // Momento actual.
        const now = new Date();

        // Validar que las fechas sean válidas y que el inicio sea antes o igual al fin.
        // (endOfDay maneja el caso de inicio y fin el mismo día)
        if (!isValid(start) || !isValid(end) || start > end) {
            console.warn("calculateProjectTimeProgress: Invalid date range.", { startDateString, endDateString, start, end });
            return 0;
        }

        // Calcular la duración total en milisegundos (desde inicio de 'start' hasta final de 'end').
        const totalDuration = differenceInMilliseconds(end, start);
        // Calcular el tiempo transcurrido desde el inicio hasta ahora.
        const elapsedDuration = differenceInMilliseconds(now, start);

        // Si la duración total es 0 o negativa (solo si start > end, ya validado).
        if (totalDuration <= 0) {
             console.warn("calculateProjectTimeProgress: Zero or negative total duration.", { start, end, totalDuration });
             // Si ya estamos en o después de la fecha de inicio, progreso es 100, si no, 0.
             return (now >= start) ? 100 : 0;
        }

        // Calcular el porcentaje de tiempo transcurrido.
        const progressPercent = (elapsedDuration / totalDuration) * 100;

        // Asegurar que el progreso esté dentro del rango [0, 100] y redondear.
        const roundedProgress = Math.round(Math.max(0, Math.min(100, progressPercent)));
        // console.log("Progress Calculation:", { startDateString, endDateString, start, end, now, totalDuration, elapsedDuration, progressPercent, roundedProgress }); // Descomenta para depurar
        return roundedProgress;

    } catch (error) {
        // Loguear cualquier error durante el parseo o cálculo.
        console.error("Error calculating project time progress:", error, { startDateString, endDateString });
        // Devolver 0 en caso de cualquier error inesperado.
        return 0;
    }
};

const useProyectos = () => {
    const { currentProjectId } = useProject();

    const [proyectos, setProyectos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [operationLoading, setOperationLoading] = useState(false);
    const [operationError, setOperationError] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [proyectoToDelete, setProyectoToDelete] = useState(null);

    const cargarProyectos = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await projectService.fetchProyectos();
            // --- Añadido: Calcular progreso para cada proyecto ---
            const projectsWithProgress = (data || []).map(project => ({
                ...project,
                // Añadir la propiedad 'progress' calculada
                progress: calculateProjectTimeProgress(project.fecha_inicio, project.fecha_fin)
            }));
            // --- Fin Cálculo Progreso ---
            setProyectos(projectsWithProgress);
        } catch (err) {
            console.error("Error en useProyectos - cargarProyectos:", err);
            setError(err.message || 'Error al cargar los proyectos.');
            setProyectos([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        cargarProyectos();
    }, [cargarProyectos]);

    const handleOpenForm = useCallback((proyecto = null) => {
        const initialData = proyecto
            ? {
                ...proyecto,
                // Asegura que las fechas para el formulario estén en formato YYYY-MM-DD
                fecha_inicio: proyecto.fecha_inicio ? projectService.formatDateForInput(proyecto.fecha_inicio) : '',
                fecha_fin: proyecto.fecha_fin ? projectService.formatDateForInput(proyecto.fecha_fin) : '',
              }
            // *** CORREGIDO: Inicializar fecha_inicio con la fecha actual para nuevos proyectos ***
            : { nombre: '', descripcion: '',
                fecha_inicio: formatDateFns(new Date(), 'yyyy-MM-dd'), // <-- Fecha actual formateada
                fecha_fin: '', estado: 'Planificado' };
        setFormData(initialData);
        setOperationError(null);
        setIsFormOpen(true);
    }, []);

    const handleAddNewProject = useCallback(() => {
        handleOpenForm(null);
    }, [handleOpenForm]);

    const handleCloseForm = useCallback(() => {
        setIsFormOpen(false);
        setFormData(null);
        setOperationError(null);
    }, []);

    const handleInputChange = useCallback((event) => {
        const { name, value } = event.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    }, []);

    const handleSubmit = useCallback(async (event) => {
        event.preventDefault();
        if (!formData) return Promise.reject(new Error("No form data"));

        setOperationLoading(true);
        setOperationError(null);

        try {
            let result;
            // Prepara los datos, asegurándose que las fechas vacías sean null
            const dataToSend = {
                ...formData,
                fecha_inicio: formData.fecha_inicio || null, // Ahora formData.fecha_inicio tendrá la fecha actual o la modificada
                fecha_fin: formData.fecha_fin || null,
            };

            if (dataToSend.id_proyecto) {
                result = await projectService.updateProyecto(dataToSend.id_proyecto, dataToSend);
            } else {
                result = await projectService.createProyecto(dataToSend);
            }
            console.log("Resultado operación proyecto:", result);
            handleCloseForm();
            await cargarProyectos(); // Recarga la lista (que recalculará progresos)
            return Promise.resolve(result);
        } catch (err) {
            console.error("Error en useProyectos - handleSubmit:", err);
            setOperationError(err.message || 'Error al guardar el proyecto.');
            return Promise.reject(err);
        } finally {
            setOperationLoading(false);
        }
    }, [formData, handleCloseForm, cargarProyectos]);

    const handleOpenDeleteDialog = useCallback((proyecto) => {
        setProyectoToDelete(proyecto);
        setOperationError(null);
        setIsDeleteDialogOpen(true);
    }, []);

    const handleCloseDeleteDialog = useCallback(() => {
        setIsDeleteDialogOpen(false);
        setProyectoToDelete(null);
        setOperationError(null);
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        if (!proyectoToDelete?.id_proyecto) return Promise.reject(new Error("No hay proyecto seleccionado para eliminar."));

        setOperationLoading(true);
        setOperationError(null);

        try {
            const result = await projectService.deleteProyecto(proyectoToDelete.id_proyecto);
            console.log("Resultado eliminación proyecto:", result);
            handleCloseDeleteDialog();
            await cargarProyectos(); // Recarga la lista
            return Promise.resolve(result);
        } catch (err) {
            console.error("Error en useProyectos - handleDeleteConfirm:", err);
            setOperationError(err.message || 'Error al eliminar el proyecto.');
            return Promise.reject(err);
        } finally {
            setOperationLoading(false);
        }
    }, [proyectoToDelete, handleCloseDeleteDialog, cargarProyectos]);

     const updateProjectStatus = useCallback(async (projectId, newStatus) => {
        setOperationLoading(true);
        setOperationError(null);
        try {
            const result = await projectService.updateProyecto(projectId, { estado: newStatus });
            console.log(`Estado del proyecto ${projectId} actualizado a ${newStatus}:`, result);
            await cargarProyectos(); // Recarga la lista
            return Promise.resolve(result);
        } catch (err) {
            console.error(`Error actualizando estado del proyecto ${projectId}:`, err);
            setOperationError(err.message || 'Error al actualizar el estado del proyecto.');
            return Promise.reject(err);
        } finally {
            setOperationLoading(false);
        }
    }, [cargarProyectos]);

    // Obtiene el proyecto actualmente seleccionado basado en el contexto
    const selectedProyecto = useMemo(() => {
        if (!currentProjectId || !proyectos || proyectos.length === 0) {
            return null;
        }
        // Busca en la lista de proyectos (que ya incluye el progreso)
        return proyectos.find(p => p.id_proyecto === currentProjectId) || null;
    }, [currentProjectId, proyectos]);

    // --- Añadido: Función para buscar un proyecto por ID ---
    const findProjectById = useCallback((projectId) => {
        if (!projectId || !proyectos) return null;
        // Busca en la lista de proyectos (que ya incluye el progreso)
        return proyectos.find(p => p.id_proyecto === projectId) || null;
    }, [proyectos]);

    // Valores retornados por el hook
    return {
        proyectos, // Lista de proyectos, ahora con la propiedad 'progress'
        loading,   // Estado de carga inicial de la lista
        error,     // Error al cargar la lista inicial
        selectedProyecto, // El proyecto completo (con progreso) que coincide con currentProjectId
        proyectoToDelete, // Proyecto seleccionado para eliminar
        formData,         // Datos del formulario (crear/editar)
        isFormOpen,       // Estado para mostrar/ocultar formulario
        isDeleteDialogOpen, // Estado para mostrar/ocultar diálogo de eliminación
        operationLoading, // Estado de carga para operaciones CUD
        operationError,   // Error durante operaciones CUD
        handleInputChange, // Handler para cambios en inputs del formulario
        handleOpenForm,    // Handler para abrir formulario (editar)
        handleCloseForm,   // Handler para cerrar formulario
        handleOpenDeleteDialog, // Handler para abrir diálogo de eliminación
        handleCloseDeleteDialog,// Handler para cerrar diálogo de eliminación
        handleSubmit,      // Handler para enviar formulario (crear/editar)
        handleDeleteConfirm,// Handler para confirmar eliminación
        updateProjectStatus,// Handler para actualizar solo el estado
        refreshProyectos: cargarProyectos, // Función para recargar la lista manualmente
        handleAddNewProject, // Handler para abrir formulario (crear)
        findProjectById    // <-- Exponer la nueva función
    };
};

export default useProyectos;
