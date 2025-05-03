// src/features/schedule/components/DocumentUpload.js
import React, { useState, useRef, useCallback } from 'react';
import {
    Box, Button, Typography, LinearProgress, Alert, Stack, IconButton, Tooltip, alpha, useTheme
} from '@mui/material';
import { UploadFileOutlined, Clear as ClearIcon, CheckCircleOutline, ErrorOutline } from '@mui/icons-material';
// *** ACTUALIZADO: Importa el hook del servicio ***
import { useDocumentService } from '../../../services/documentService.js'; // Ajusta ruta

const DocumentUpload = ({ contextType, contextId, onUploadSuccess, onUploadError }) => {
    const theme = useTheme();
    const [selectedFile, setSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0); // Sigue siendo simulado
    const [uploadError, setUploadError] = useState(null);
    const [uploadSuccess, setUploadSuccess] = useState(false);
    const fileInputRef = useRef(null);
    // *** ACTUALIZADO: Obtiene la función del hook ***
    const { uploadDocument } = useDocumentService();

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            setUploadError(null);
            setUploadSuccess(false);
            setUploadProgress(0);
        }
    };

    const clearSelection = () => {
        setSelectedFile(null);
        setUploadError(null);
        setUploadSuccess(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleUpload = useCallback(async () => {
        if (!selectedFile || !contextId) return;

        setIsUploading(true);
        setUploadError(null);
        setUploadSuccess(false);
        setUploadProgress(50); // Simular progreso

        try {
            // *** ACTUALIZADO: Llama a la función del servicio Supabase ***
            // Pasamos el archivo, tipo de contexto y ID
            const result = await uploadDocument(selectedFile, contextType, contextId);

            setUploadProgress(100);
            setUploadSuccess(true);
            setSelectedFile(null);
             if (fileInputRef.current) { fileInputRef.current.value = ''; }
            if (onUploadSuccess) {
                onUploadSuccess(result);
            }
            setTimeout(() => setUploadSuccess(false), 4000);

        } catch (err) {
            console.error("Error en subida:", err);
            setUploadError(err.message || 'Ocurrió un error al subir el archivo.');
            if (onUploadError) {
                onUploadError(err);
            }
            setUploadProgress(0); // Resetear progreso en error
        } finally {
            setIsUploading(false);
        }
    }, [selectedFile, contextType, contextId, uploadDocument, onUploadSuccess, onUploadError]);

    // --- JSX (sin cambios visuales) ---
    return (
        <Box sx={{ mb: 2, p: 1.5, border: `1px dashed ${theme.palette.divider}`, borderRadius: theme.shape.borderRadius }}>
            <Stack spacing={1.5}>
                <Stack direction="row" spacing={1} alignItems="center">
                    <Button
                        component="label"
                        variant="outlined"
                        size="small"
                        startIcon={<UploadFileOutlined />}
                        disabled={isUploading}
                    >
                        Seleccionar Archivo
                        <input
                            type="file"
                            hidden
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            disabled={isUploading}
                        />
                    </Button>
                    {selectedFile && !isUploading && (
                        <Tooltip title="Quitar selección">
                            <IconButton onClick={clearSelection} size="small" sx={{ color: 'text.secondary' }}>
                                <ClearIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    )}
                    {selectedFile && (
                         <Typography variant="body2" sx={{ color: 'text.secondary', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexGrow: 1 }}>
                            {selectedFile.name}
                         </Typography>
                    )}
                </Stack>

                {selectedFile && !isUploading && !uploadSuccess && !uploadError && (
                    <Button
                        variant="contained"
                        size="small"
                        onClick={handleUpload}
                        disabled={!selectedFile || isUploading}
                    >
                        Subir Archivo
                    </Button>
                )}

                {isUploading && (
                    <Box sx={{ width: '100%' }}>
                        <LinearProgress variant="determinate" value={uploadProgress} />
                        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 0.5 }}>Subiendo...</Typography>
                    </Box>
                )}

                {uploadSuccess && (
                    <Alert severity="success" icon={<CheckCircleOutline fontSize="inherit" />} sx={{ fontSize: '0.8rem', py: 0.5 }}>
                        Archivo subido correctamente.
                    </Alert>
                )}

                {uploadError && (
                    <Alert severity="error" icon={<ErrorOutline fontSize="inherit" />} sx={{ fontSize: '0.8rem', py: 0.5 }}>
                        {uploadError}
                    </Alert>
                )}
            </Stack>
        </Box>
    );
};

export default DocumentUpload;
