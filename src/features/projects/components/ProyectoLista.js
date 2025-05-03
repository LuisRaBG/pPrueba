// src/features/projects/components/ProyectoLista.js
import React from 'react';
import {
    List,
    Box,
    // Paper, // No se usa directamente aquí
    Typography,
    Button,
    CircularProgress,
    Alert,
    alpha,
} from '@mui/material';
import { Add as AddIcon, FolderOffOutlined as FolderOffIcon } from '@mui/icons-material'; // Use a relevant icon
import { useTheme } from '@mui/material/styles';
import ProyectoItem from './ProyectoItem.js'; // Importa el item

const ProyectoLista = ({
    proyectos,
    loading, // Loading general del hook
    error,   // Error general del hook
    compact, // Prop para modo compacto (menos padding/margen)
    ultraCompact, // Prop para modo ultra compacto (aún menos padding/margen)
    selectedProjectId,
    onProjectSelect, // Callback cuando se selecciona un proyecto
    onEditProject,   // Callback para editar
    onDeleteProject, // Callback para borrar
    onAddNewProject, // Callback para abrir diálogo de creación
}) => {
    const theme = useTheme();
    // Determina si se usa algún modo compacto
    const isCompactOrUltra = compact || ultraCompact;

    // --- Renderizado Condicional ---

    // 1. Estado de Carga
    if (loading) {
        return (
             <Box sx={{
                 display: 'flex',
                 justifyContent: 'center',
                 alignItems: 'center',
                 // *** AJUSTADO: Padding consistente con theme.spacing ***
                 p: theme.spacing(isCompactOrUltra ? 2 : 4),
                 minHeight: 150, // Altura mínima para que el spinner sea visible
                 width: '100%', // Asegura que ocupe el ancho
             }}>
                 <CircularProgress size={isCompactOrUltra ? 30 : 40} />
             </Box>
         );
    }

    // 2. Estado de Error
    if (error) {
         return (
            // *** AJUSTADO: Padding consistente con theme.spacing ***
            <Alert severity="error" sx={{ m: theme.spacing(isCompactOrUltra ? 1 : 2) }}>
                 {error}
            </Alert>
         );
    }

    // 3. Estado Vacío (Sin Proyectos)
    if (proyectos.length === 0) {
        return (
             <Box sx={{
                 // *** AJUSTADO: Padding consistente ***
                 p: theme.spacing(isCompactOrUltra ? 2 : 3),
                 textAlign: 'center',
                 // *** AJUSTADO: borderRadius consistente ***
                 borderRadius: theme.shape.borderRadius * 1.5,
                 border: `1px dashed ${theme.palette.divider}`,
                 // *** AJUSTADO: Fondo sutil consistente ***
                 bgcolor: alpha(theme.palette.grey[500], 0.04),
                 mt: 1, // Margen superior
                 display: 'flex',
                 flexDirection: 'column',
                 alignItems: 'center',
                 justifyContent: 'center',
                 minHeight: 100,
                 color: 'text.secondary' // Color del texto secundario
             }}>
                 <FolderOffIcon sx={{ fontSize: isCompactOrUltra ? 28 : 32, mb: 1, color: 'text.disabled' }} />
                 <Typography variant={isCompactOrUltra ? "body2" : "body1"} gutterBottom>
                    No se encontraron proyectos.
                 </Typography>
                 {/* Botón "Crear el primero" (solo si no es compacto y hay callback) */}
                 {!isCompactOrUltra && onAddNewProject && (
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={onAddNewProject}
                        sx={{ mt: 1.5 }}
                        color="primary" // Usar color primario
                    >
                        Crear el primero
                    </Button>
                 )}
             </Box>
        );
    }

    // 4. Renderizado de la Lista (si hay proyectos)
    return (
        // La lista en sí no necesita mucho estilo, ProyectoItem se encarga
        <List disablePadding sx={{ width: '100%' }}>
            {proyectos.map((proyecto) => (
                <ProyectoItem
                    key={proyecto.id_proyecto}
                    proyecto={proyecto}
                    isSelected={proyecto.id_proyecto === selectedProjectId}
                    onClick={onProjectSelect}
                    onEdit={onEditProject}
                    onDelete={onDeleteProject}
                    // *** PASANDO ultraCompact a ProyectoItem ***
                    ultraCompact={ultraCompact}
                />
            ))}
        </List>
    );
};

export default ProyectoLista;
