// c:\Users\Prueb\Documents\projects\proyecto\src\features\tasks\components\TaskList.js
import React from 'react';
import {
    List, Box, Typography, Button, CircularProgress, Alert, alpha
} from '@mui/material';
import { Add as AddIcon, Inbox as InboxIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import TaskItem from './TaskItem.js'; // Importa el item

const TaskList = ({
    tareas,
    loading, // Loading general del hook
    error,   // Error general del hook
    compact, // Prop para vista compacta (si se usa)
    ultraCompact, // Prop para vista ultra compacta (si se usa)
    idProyectoContext, // ID del proyecto actual (null si es vista general)
    onTaskClick,      // Callback general al hacer click en una tarea
    onEditTask,       // Callback para editar (viene de DashboardPage)
    onDeleteTask,     // Callback para borrar (viene de DashboardPage) // <-- Corrected comment
    onUploadProof,    // <-- NUEVO: Callback para subir prueba
    onAddTask,        // Callback para abrir diálogo de creación
    hideAddButton = false, // Prop para ocultar botón de añadir (usado en GlobalTaskListDisplay)
    // showEmptyStateAddButton = true, // Prop opcional
}) => {
    const theme = useTheme();
    const isCompactOrUltra = compact || ultraCompact;

    // Renderizado condicional principal
    if (loading) {
        return (
             <Box sx={{
                 display: 'flex',
                 justifyContent: 'center',
                 alignItems: 'center',
                 p: theme.spacing(isCompactOrUltra ? 2 : 4),
                 minHeight: 150
             }}>
                 <CircularProgress size={isCompactOrUltra ? 30 : 40} />
             </Box>
         );
    }

    if (error) {
         return (
            <Alert severity="error" sx={{ m: theme.spacing(isCompactOrUltra ? 1 : 2) }}>
                 {error}
            </Alert>
         );
    }

    if (!tareas || tareas.length === 0) {
         const noTasksMessage = idProyectoContext
           ? "Este proyecto aún no tiene tareas."
           : "No se encontraron tareas.";

         // Botón para añadir solo se muestra si hay un proyecto activo, no es ultra compacto y se pasó el handler
         const showAddButton = idProyectoContext && !ultraCompact && typeof onAddTask === 'function' && !hideAddButton;

         return (
            <Box sx={{
                textAlign: 'center',
                p: theme.spacing(isCompactOrUltra ? 2 : 3),
                color: 'text.secondary',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 100,
                // Estilos opcionales consistentes
                // borderRadius: theme.shape.borderRadius * 1.5,
                // border: `1px dashed ${theme.palette.divider}`,
                // bgcolor: alpha(theme.palette.grey[500], 0.04),
                // mt: 1,
            }}>
                 <InboxIcon sx={{ fontSize: 32, mb: 1, color: 'text.disabled' }} />
                 <Typography variant="body1">
                    {noTasksMessage}
                 </Typography>
                 {showAddButton && (
                    <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={onAddTask}
                        size="small"
                        sx={{ mt: 2 }}
                        color="primary"
                    >
                        Crear la primera tarea
                    </Button>
                 )}
            </Box>
        );
    }

    // Renderiza la lista si hay tareas
    return (
        <List disablePadding sx={{ width: '100%' }}>
            {tareas.map((tarea) => (
               <TaskItem
                   key={tarea.id_tarea}
                   tarea={tarea}
                   // Mostrar chip de proyecto solo si no estamos filtrando por proyecto y no es ultra compacto
                   showProjectChip={idProyectoContext === null && !ultraCompact}
                   onClick={onTaskClick} // Handler para click general en el item
                   onEdit={onEditTask}   // Pasa onEditTask como onEdit
                   onDelete={onDeleteTask} // Pasa onDeleteTask como onDelete // <-- Corrected comment
                   onUploadProof={onUploadProof} // <-- NUEVO: Pasa el handler de subir prueba
                   ultraCompact={ultraCompact} // Pasa la prop ultraCompact
               />
            ))}
            {/* Botón flotante o fijo opcional */}
            {/* {!hideAddButton && idProyectoContext && onAddTask && ( ... Button ... ) } */}
        </List>
    );
};

export default TaskList;
