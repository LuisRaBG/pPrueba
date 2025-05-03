// src/features/projects/components/MyProjectsList.js
import React, { useState, useEffect } from 'react';
// Asegúrate que la ruta al servicio sea correcta
import { fetchUserMemberProjects } from '../services/projectService';
import { List, ListItem, ListItemText, CircularProgress, Alert, Typography, Box } from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder'; // Icono opcional

function MyProjectsList({ onProjectSelect }) { // Añadir onProjectSelect si quieres que sea clickeable
    const [myProjects, setMyProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadProjects = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await fetchUserMemberProjects();
                // Extraer solo la información del proyecto y el rol
                const projects = data.map(item => ({
                    ...(item.proyectos || {}), // Datos del proyecto (asegura que no sea null)
                    userRole: item.rol // Añadir el rol del usuario
                })).filter(proj => proj.id_proyecto); // Filtrar por si el proyecto era null
                setMyProjects(projects);
            } catch (err) {
                setError(err.message || 'Error al cargar mis proyectos');
            } finally {
                setLoading(false);
            }
        };
        loadProjects();
    }, []);

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}><CircularProgress size={25} /></Box>;
    if (error) return <Alert severity="error" sx={{ m: 1 }}>{error}</Alert>;
    if (myProjects.length === 0) return <Typography sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>No eres miembro de ningún proyecto.</Typography>;

    return (
        <List dense> {/* Usar dense para una lista más compacta */}
            {myProjects.map(proj => (
                <ListItem
                    key={proj.id_proyecto}
                    // Hacer el item clickeable si se pasa la función onProjectSelect
                    button={!!onProjectSelect}
                    onClick={() => onProjectSelect && onProjectSelect(proj.id_proyecto)}
                    sx={{ borderRadius: 1, mb: 0.5 }}
                >
                     <FolderIcon sx={{ mr: 1.5, color: 'action.active' }} fontSize="small"/>
                    <ListItemText
                        primary={proj.nombre}
                        secondary={`Tu rol: ${proj.userRole}`}
                        primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                    />
                </ListItem>
            ))}
        </List>
    );
}

export default MyProjectsList;
