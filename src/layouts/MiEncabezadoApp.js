// Ejemplo: src/components/layout/MiEncabezadoApp.js (Archivo hipotético)
import React from 'react';
import { AppBar, Toolbar, Box, Typography } from '@mui/material';

const MiEncabezadoApp = () => {
  return (
    <AppBar position="static">
      <Toolbar>
        {/* Logo */}
        <Box
          component="img"
          sx={{
            height: 40, // Ajusta el tamaño según necesites
            mr: 2,      // Margen a la derecha
          }}
          alt="Logo de la App"
          src="/logo ito.png" // Ruta relativa a la carpeta public
        />

        {/* Título de la App (Opcional) */}
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Título de Mi Aplicación
        </Typography>

        {/* Otros elementos del AppBar */}
      </Toolbar>
    </AppBar>
  );
};

export default MiEncabezadoApp;
