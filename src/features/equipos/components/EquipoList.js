// src/features/equipos/components/EquipoList.js
import React from 'react';
import { List, Typography, Box, Paper } from '@mui/material';
import EquipoListItem from './EquipoListItem.js';

const EquipoList = ({ miembros, onEditMiembro, onRemoveMiembro }) => {

    if (!miembros || miembros.length === 0) {
        return (
            <Typography variant="body1" sx={{ mt: 2, fontStyle: 'italic' }}>
                No hay miembros en este equipo.
            </Typography>
        );
    }

    return (
        <Paper elevation={2} sx={{ mt: 2 }}>
            <Box sx={{ width: '100%', bgcolor: 'background.paper' }}>
                <List>
                    {miembros.map((miembro) => (
                        <EquipoListItem
                            key={miembro.id_equipo || `user-${miembro.id_usuario}`} // id_equipo es preferible si existe
                            miembro={miembro}
                            onEdit={onEditMiembro}
                            onRemove={onRemoveMiembro}
                        />
                    ))}
                </List>
            </Box>
        </Paper>
    );
};

export default EquipoList;
