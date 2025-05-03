// src/features/tasks/components/GlobalTaskListDisplay.js
import React, { useMemo } from 'react';
import { Box, Typography, CircularProgress, Alert, useTheme, alpha } from '@mui/material';
import TaskList from './TaskList.js';
import InboxIcon from '@mui/icons-material/Inbox';
import { isBefore, startOfDay, parseISO, isValid } from 'date-fns';
// *** AÑADIDO: Importa las constantes de estado ***
// Asegúrate que la ruta sea correcta y que taskService.js exporte TASK_STATUS
import { TASK_STATUS } from '../services/taskService.js';

/**
 * Componente contenedor para mostrar la lista de tareas globales.
 * Maneja los estados de carga y error, y pasa los datos a TaskList.
 * Ordena las tareas para mostrar las vencidas (no completadas/canceladas) al final.
 */
const GlobalTaskListDisplay = ({
    tasks,
    loading,
    error,
    onTaskClick,
    onEditTask,      // <-- Add prop
    onDeleteTask,    // <-- Add prop
    onUploadProof    // <-- Add prop
}) => {
    const theme = useTheme();

    // --- Lógica de Ordenamiento ---
    const sortedTasks = useMemo(() => {
        if (!tasks) return [];

        const today = startOfDay(new Date());

        const isTaskOverdueForSorting = (task) => {
            // Excluye tareas ya finalizadas (Completada o Cancelada)
            // *** IMPORTANTE: Verifica que TASK_STATUS.COMPLETADA y TASK_STATUS.CANCELADA coincidan con tus valores reales ***
            if (task.estado === TASK_STATUS.COMPLETADA || task.estado === TASK_STATUS.CANCELADA) {
                return false;
            }
            const dueDate = task.fecha_vencimiento ? parseISO(task.fecha_vencimiento) : null;
            // Verifica que la fecha sea válida y anterior a hoy
            return dueDate && isValid(dueDate) && isBefore(dueDate, today);
        };

        // Crea una copia y ordena
        return [...tasks].sort((a, b) => {
            const aIsOverdue = isTaskOverdueForSorting(a);
            const bIsOverdue = isTaskOverdueForSorting(b);

            if (aIsOverdue && !bIsOverdue) return 1;  // Vencidas van al final
            if (!aIsOverdue && bIsOverdue) return -1; // No vencidas van al principio

            // Orden secundario: por fecha de vencimiento (más antiguas primero)
            const dateA = a.fecha_vencimiento ? parseISO(a.fecha_vencimiento) : null;
            const dateB = b.fecha_vencimiento ? parseISO(b.fecha_vencimiento) : null;
            if (dateA && dateB && isValid(dateA) && isValid(dateB)) {
                return dateA.getTime() - dateB.getTime();
            }
            // Fallback: mantener orden relativo si no hay fechas válidas
            return 0;
        });
    }, [tasks]);
    // --- Fin Lógica de Ordenamiento ---


    // Muestra indicador de carga
    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: theme.spacing(3) }}><CircularProgress size={24} /></Box>;
    }

    // Muestra mensaje de error
    if (error) {
        return <Alert severity="error" sx={{ mt: theme.spacing(1), fontSize: '0.8rem' }}>{error}</Alert>;
    }

    // Muestra mensaje si no hay tareas
    if (!sortedTasks || sortedTasks.length === 0) {
        return (
            <Box sx={{
                p: theme.spacing(3),
                textAlign: 'center',
                mt: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 100,
                color: 'text.secondary'
            }}>
                <InboxIcon sx={{ fontSize: 32, mb: 1, color: 'text.disabled' }} />
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    No hay tareas globales para mostrar.
                </Typography>
            </Box>
        );
    }

    // Renderiza TaskList con las tareas globales ORDENADAS
    return (
        <TaskList
            tareas={sortedTasks} // Pasa la lista ordenada
            loading={false}
            error={null}
            idProyectoContext={null}
            onTaskClick={onTaskClick}
            onEditTask={onEditTask}       // <-- Pass down
            onDeleteTask={onDeleteTask}     // <-- Pass down
            onUploadProof={onUploadProof}    // <-- Pass down
            hideAddButton={true}
            // Puedes pasar ultraCompact si lo necesitas
            // ultraCompact={true}
        />
    );
};

export default GlobalTaskListDisplay;
