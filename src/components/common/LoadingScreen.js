import React from 'react';
import { Box, CircularProgress } from '@mui/material';

const LoadingScreen = () => (
    <Box
        sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            width: '100vw', // Asegura ancho completo también
            backgroundColor: 'background.default'
        }}
    >
        <CircularProgress size={60} />
    </Box>
);

export default LoadingScreen;