// src/hooks/useCalendarData.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabase.js'; // Ajusta ruta
import { useAuth } from '../contexts/AuthContext.js'; // Ajusta ruta
import { parseISO, isValid, addDays } from 'date-fns'; // addDays para eventos allDay

// Función helper para transformar datos a eventos del calendario
const transformToCalendarEvents = (projects = [], tasks = []) => {
    const events = [];

    // Mapear Proyectos
    projects.forEach(proj => {
        const startDate = proj.fecha_inicio ? parseISO(proj.fecha_inicio) : null;
        const endDate = proj.fecha_fin ? parseISO(proj.fecha_fin) : null;

        // Solo añadir si ambas fechas son válidas
        if (startDate && isValid(startDate) && endDate && isValid(endDate)) {
            events.push({
                id: `proj-${proj.id_proyecto}`,
                title: `[P] ${proj.nombre || 'Proyecto sin nombre'}`,
                start: startDate,
                // Para eventos 'allDay', react-big-calendar espera que la fecha final sea el día *después* del último día del evento.
                end: addDays(endDate, 1),
                allDay: true,
                resource: { type: 'project', data: proj } // Guardar datos originales
            });
        } else if (startDate && isValid(startDate)) {
            // Si solo hay fecha de inicio (tratar como evento de un día)
             events.push({
                id: `proj-${proj.id_proyecto}`,
                title: `[P] ${proj.nombre || 'Proyecto sin nombre'} (Inicio)`,
                start: startDate,
                end: addDays(startDate, 1), // Fin al día siguiente para allDay
                allDay: true,
                resource: { type: 'project', data: proj }
            });
        }
    });

    // Mapear Tareas
    tasks.forEach(task => {
        // Usar fecha de vencimiento como fecha principal si no hay inicio
        const startDate = task.fecha_inicio ? parseISO(task.fecha_inicio) : null;
        const endDate = task.fecha_vencimiento ? parseISO(task.fecha_vencimiento) : null;

        if (endDate && isValid(endDate)) {
             // Si hay fecha de fin, usarla como end. Si no hay inicio, usar fin como inicio también.
             const effectiveStartDate = (startDate && isValid(startDate)) ? startDate : endDate;
             events.push({
                id: `task-${task.id_tarea}`,
                title: `[T] ${task.titulo || 'Tarea sin título'}`,
                start: effectiveStartDate,
                end: addDays(endDate, 1), // Fin al día siguiente para allDay
                allDay: true, // Asumimos tareas como eventos de día completo por simplicidad
                resource: { type: 'task', data: task }
            });
        } else if (startDate && isValid(startDate)) {
             // Si solo hay fecha de inicio
             events.push({
                id: `task-${task.id_tarea}`,
                title: `[T] ${task.titulo || 'Tarea sin título'} (Inicio)`,
                start: startDate,
                end: addDays(startDate, 1),
                allDay: true,
                resource: { type: 'task', data: task }
            });
        }
    });

    return events;
};


export const useCalendarData = () => {
    const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        if (!isAuthenticated || !user?.id) {
            setEvents([]);
            setLoading(false);
            setError(null);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // 1. Obtener IDs de proyectos donde el usuario es miembro
            const { data: membershipData, error: membershipError } = await supabase
                .from('equipos')
                .select('id_proyecto')
                .eq('id_usuario', user.id);

            if (membershipError) throw membershipError;
            const memberProjectIds = membershipData.map(m => m.id_proyecto);

            // 2. Obtener Proyectos (creados por el usuario O donde es miembro)
            const { data: projectsData, error: projectsError } = await supabase
                .from('proyectos')
                .select('*')
                .or(`id_usuario_creador.eq.${user.id},id_proyecto.in.(${memberProjectIds.join(',')})`); // Creador O miembro

            if (projectsError) throw projectsError;
            const relevantProjectIds = projectsData.map(p => p.id_proyecto); // Todos los IDs de proyectos relevantes

            // 3. Obtener Tareas (creadas, asignadas O en proyectos relevantes)
            const { data: tasksData, error: tasksError } = await supabase
                .from('tareas')
                .select('*')
                .or(`id_usuario_creador.eq.${user.id},id_usuario_asignado.eq.${user.id},id_proyecto.in.(${relevantProjectIds.join(',')})`); // Creador O asignado O en proyecto relevante

            if (tasksError) throw tasksError;

            // 4. Transformar datos a eventos
            const calendarEvents = transformToCalendarEvents(projectsData || [], tasksData || []);
            setEvents(calendarEvents);

        } catch (err) {
            console.error("Error fetching calendar data:", err);
            setError(err.message || 'Error al cargar datos del calendario.');
            setEvents([]);
        } finally {
            setLoading(false);
        }
    }, [user?.id, isAuthenticated]);

    useEffect(() => {
        if (!isAuthLoading) {
            fetchData();
        }
    }, [fetchData, isAuthLoading]);

    return { events, loading, error, refreshData: fetchData };
};
