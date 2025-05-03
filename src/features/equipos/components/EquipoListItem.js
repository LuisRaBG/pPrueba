// src/features/equipos/components/EquipoListItem.js
import React from 'react';
import {
    ListItem,
    ListItemAvatar,
    Avatar,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Typography,
    Tooltip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person'; // Icono por defecto

const EquipoListItem = ({ miembro, onEdit, onRemove }) => {

    const handleEdit = () => {
        onEdit(miembro); // Pasa el objeto miembro completo
    };

    const handleRemove = () => {
        // Considera añadir un diálogo de confirmación aquí antes de llamar a onRemove
        if (window.confirm(`¿Estás seguro de que quieres eliminar a ${miembro.nombre} (${miembro.email}) del equipo?`)) {
            onRemove(miembro.id_proyecto, miembro.id_usuario);
        }
    };

    // Formatear fecha si existe
    const fechaUnionFormateada = miembro.fecha_union
        ? new Date(miembro.fecha_union.replace(' ', 'T') + 'Z').toLocaleDateString() // Asume UTC si no hay zona
        : 'N/A';

    return (
        <ListItem divider>
            <ListItemAvatar>
                <Avatar alt={miembro.nombre} src={miembro.avatar || undefined}>
                    {!miembro.avatar && <PersonIcon />}
                </Avatar>
            </ListItemAvatar>
            <ListItemText
                primary={miembro.nombre || 'Nombre no disponible'}
                secondary={
                    <React.Fragment>
                        <Typography component="span" variant="body2" color="text.primary">
                            {miembro.email || 'Email no disponible'}
                        </Typography>
                        {` - Rol: ${miembro.rol || 'N/A'} (Unido: ${fechaUnionFormateada})`}
                    </React.Fragment>
                }
            />
            <ListItemSecondaryAction>
                <Tooltip title="Editar Rol">
                    <IconButton edge="end" aria-label="editar" onClick={handleEdit} sx={{ mr: 1 }}>
                        <EditIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Eliminar Miembro">
                    <IconButton edge="end" aria-label="eliminar" onClick={handleRemove}>
                        <DeleteIcon color="error" />
                    </IconButton>
                </Tooltip>
                {/* Aquí podrías añadir lógica condicional para deshabilitar botones
                    basado en permisos del usuario logueado vs el miembro */}
            </ListItemSecondaryAction>
        </ListItem>
    );
};

export default EquipoListItem;
