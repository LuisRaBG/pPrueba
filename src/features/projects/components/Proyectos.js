// src/features/projects/components/Proyectos.js
import React from 'react';
import {
    List, ListItemButton, ListItemText, ListItemIcon, Typography, Box, IconButton, Menu, MenuItem, CircularProgress, Alert, useTheme, alpha
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FolderOffIcon from '@mui/icons-material/FolderOffOutlined'; // Icono para estado vacío

const Proyectos = ({
    proyectos = [],
    loading,
    error,
    selectedProjectId,
    onProjectSelect,
    onEditProject,
    onDeleteProject
}) => {
    const theme = useTheme();
    const [anchorEl, setAnchorEl] = React.useState(null);
    const [currentProject, setCurrentProject] = React.useState(null);
    const open = Boolean(anchorEl);

    const handleClick = (event, proyecto) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
        setCurrentProject(proyecto);
    };
    const handleClose = () => {
        setAnchorEl(null);
        setCurrentProject(null);
    };

    const handleEdit = () => {
        if (currentProject && onEditProject) {
            onEditProject(currentProject);
        }
        handleClose();
    };

    const handleDelete = () => {
        if (currentProject && onDeleteProject) {
            onDeleteProject(currentProject);
        }
        handleClose();
    };

    // --- Renderizado Condicional (Ajustado) ---

    // 1. Estado de Carga
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: theme.spacing(3) }}> {/* Padding con theme */}
                <CircularProgress size={30} />
            </Box>
        );
    }

    // 2. Estado de Error
    if (error) {
        return (
            <Alert severity="error" sx={{ m: theme.spacing(1) }}> {/* Margen con theme */}
                {error}
            </Alert>
        );
    }

    // 3. Estado Vacío
    if (!proyectos || proyectos.length === 0) {
        return (
            <Box sx={{ p: theme.spacing(2), textAlign: 'center', color: 'text.secondary' }}> {/* Padding y color */}
                <FolderOffIcon sx={{ fontSize: 32, mb: 1, color: 'text.disabled' }} />
                <Typography variant="body2">No hay proyectos.</Typography>
            </Box>
        );
    }

    // 4. Renderizado de la Lista
    return (
        <>
            <List component="nav" dense sx={{ p: 0 }}> {/* Padding 0 para control total */}
                {proyectos.map((proyecto) => (
                    <ListItemButton
                        key={proyecto.id_proyecto}
                        selected={selectedProjectId === proyecto.id_proyecto}
                        onClick={() => onProjectSelect(proyecto.id_proyecto)}
                        sx={{
                            // *** AJUSTADO: Consistencia con Sidebar/ProyectoItem ***
                            borderRadius: 1.5, // Mismo borderRadius que NavItem
                            mb: 0.5,
                            mx: 1.5, // Margen horizontal como NavItem
                            px: 2, // Padding horizontal ajustado
                            py: 1, // Padding vertical ajustado
                            transition: theme.transitions.create(['background-color', 'color']),
                            '&.Mui-selected': {
                                // *** AJUSTADO: Estilo de selección primario ***
                                backgroundColor: alpha(theme.palette.primary.main, 0.08), // Fondo primario sutil
                                color: theme.palette.primary.dark, // Texto primario oscuro
                                '& .MuiListItemIcon-root': { // Icono primario
                                    color: theme.palette.primary.main,
                                },
                                '&:hover': { // Hover cuando está seleccionado
                                    backgroundColor: alpha(theme.palette.primary.main, 0.12),
                                }
                            },
                             '&:hover': { // Hover general
                                 backgroundColor: alpha(theme.palette.action.hover, 0.04),
                                 color: 'text.primary', // Texto primario en hover
                                 '& .MuiListItemIcon-root': { // Icono primario en hover
                                     color: 'primary.main',
                                 },
                             }
                        }}
                    >
                        <ListItemIcon sx={{
                            minWidth: 32, // Espacio mínimo
                            mr: 1, // Margen derecho
                            color: 'inherit' // Hereda color (cambia con selección/hover)
                        }}>
                            <FolderIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                            primary={proyecto.nombre || "Proyecto sin nombre"}
                            primaryTypographyProps={{
                                noWrap: true,
                                variant: 'body2',
                                // *** AJUSTADO: fontWeight basado en selección ***
                                fontWeight: selectedProjectId === proyecto.id_proyecto ? 500 : 400,
                                color: 'inherit', // Hereda color
                                mr: 0.5
                            }}
                        />
                        {/* Botón de acciones */}
                        <IconButton
                            edge="end"
                            aria-label="actions"
                            size="small"
                            onClick={(e) => handleClick(e, proyecto)}
                            sx={{
                                // *** AJUSTADO: Padding y margen consistentes ***
                                p: 0.5, // Padding interno
                                mr: -1, // Margen negativo para alinear al borde
                                color: 'text.secondary',
                                '&:hover': {
                                    backgroundColor: alpha(theme.palette.action.hover, 0.08), // Hover más visible
                                    color: 'text.primary',
                                }
                            }}
                        >
                            <MoreVertIcon fontSize="small" />
                        </IconButton>
                    </ListItemButton>
                ))}
            </List>

            {/* Menú de Acciones (Estilos consistentes) */}
            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{ 'aria-labelledby': 'project-actions-button' }}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                slotProps={{
                    paper: {
                        elevation: 3,
                        sx: {
                            minWidth: 160,
                            borderRadius: 1.5, // Consistente
                            '& .MuiMenuItem-root': {
                                fontSize: '0.875rem',
                                py: 1, // Padding vertical
                                px: 1.5, // Padding horizontal
                                '&:hover': { // Hover sutil
                                    backgroundColor: alpha(theme.palette.action.hover, 0.05)
                                }
                            },
                            '& .MuiListItemIcon-root': {
                                minWidth: 36, // Espacio para icono
                                color: 'text.secondary',
                            }
                        }
                    }
                }}
            >
                <MenuItem onClick={handleEdit} dense>
                    <ListItemIcon>
                        <EditIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Editar</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleDelete} dense sx={{ color: 'error.main', '&:hover': { backgroundColor: alpha(theme.palette.error.main, 0.08) } }}> {/* Hover rojo */}
                    <ListItemIcon sx={{ color: 'error.main' }}> {/* Icono rojo */}
                        <DeleteIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Eliminar</ListItemText>
                </MenuItem>
            </Menu>
        </>
    );
};

export default Proyectos;
