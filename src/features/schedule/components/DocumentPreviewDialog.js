// src/features/schedule/components/DocumentPreviewDialog.js
import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button,
    Box, CircularProgress, Alert, Typography, IconButton, useTheme, alpha
} from '@mui/material';
import { Close as CloseIcon, BrokenImageOutlined, DescriptionOutlined } from '@mui/icons-material';
import { useDocumentService } from '../../../services/documentService.js'; // Ajusta ruta

const DocumentPreviewDialog = ({ open, onClose, document }) => {
    const theme = useTheme();
    const { getDocumentUrl } = useDocumentService();
    const [previewUrl, setPreviewUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [contentType, setContentType] = useState(null);

    useEffect(() => {
        // Resetear estado cuando el diálogo se cierra o el documento cambia
        if (!open || !document) {
            setPreviewUrl(null);
            setLoading(false);
            setError(null);
            setContentType(null);
            return;
        }

        const fetchUrl = async () => {
            setLoading(true);
            setError(null);
            setPreviewUrl(null);
            setContentType(document.tipo_archivo?.toLowerCase() || null); // Guardar tipo MIME

            try {
                const url = await getDocumentUrl(document.ruta_archivo);
                setPreviewUrl(url);
            } catch (err) {
                console.error("Error getting preview URL:", err);
                setError(`No se pudo cargar la vista previa: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchUrl();

    }, [open, document, getDocumentUrl]); // Dependencias del efecto

    const renderPreviewContent = () => {
        if (loading) {
            return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}><CircularProgress /></Box>;
        }
        if (error) {
            return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
        }
        if (!previewUrl || !contentType) {
            return <Alert severity="info" sx={{ m: 2 }}>No hay contenido para mostrar.</Alert>;
        }

        // Vista previa para Imágenes
        if (contentType.startsWith('image/')) {
            return (
                <Box sx={{ textAlign: 'center', p: 1 }}>
                    <img
                        src={previewUrl}
                        alt={`Vista previa de ${document.nombre_archivo}`}
                        style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
                        onError={(e) => { setError('No se pudo cargar la imagen.'); e.target.style.display='none'; }}
                    />
                     {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
                </Box>
            );
        }

        // Vista previa para PDFs
        if (contentType === 'application/pdf') {
            return (
                <Box sx={{ height: '75vh', width: '100%' }}>
                    <iframe
                        src={previewUrl}
                        title={`Vista previa de ${document.nombre_archivo}`}
                        width="100%"
                        height="100%"
                        style={{ border: 'none' }}
                        onError={() => setError('No se pudo cargar el PDF.')}
                    />
                     {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
                </Box>
            );
        }

        // Vista previa para Texto simple (ej: .txt, .js, .css, .html) - ¡Experimental!
        // Podría fallar por CORS si el bucket no está configurado adecuadamente.
        if (contentType.startsWith('text/')) {
             return (
                 <Box sx={{ height: '70vh', width: '100%', overflow: 'auto', border: `1px solid ${theme.palette.divider}`, p:1, bgcolor: alpha(theme.palette.grey[500], 0.05) }}>
                    <Typography component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '0.8rem' }}>
                        Cargando contenido de texto... (Puede fallar por CORS)
                        {/* Aquí podrías intentar un fetch(previewUrl).then(res => res.text()).then(setTextContent) */}
                        {/* Por simplicidad, mostramos un mensaje y la opción de descargar */}
                    </Typography>
                     <Alert severity="info" sx={{mt: 1}}>La vista previa de texto puede no funcionar directamente. Intenta descargar el archivo.</Alert>
                 </Box>
             );
        }


        // Si no es soportado
        return (
            <Alert severity="info" icon={<DescriptionOutlined />} sx={{ m: 2 }}>
                Vista previa no disponible para este tipo de archivo ({contentType}). Puedes descargarlo para verlo.
            </Alert>
        );
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="lg" // Permitir más espacio
            fullWidth
            scroll="paper"
        >
            <DialogTitle sx={{ borderBottom: `1px solid ${theme.palette.divider}`, pb: 1.5, pr: 5 }}>
                <Typography variant="h6" component="span" noWrap>
                    Vista Previa: {document?.nombre_archivo || 'Archivo'}
                </Typography>
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{ position: 'absolute', right: 8, top: 8, color: (theme) => theme.palette.grey[500] }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0, bgcolor: alpha(theme.palette.grey[500], 0.04) }}>
                {renderPreviewContent()}
            </DialogContent>
            <DialogActions sx={{ borderTop: `1px solid ${theme.palette.divider}`, pt: 1.5, pb: 1.5, px: 2 }}>
                <Button onClick={onClose} variant="outlined">Cerrar</Button>
                {/* Podrías añadir un botón de descarga aquí también si quieres */}
                {/* <Button onClick={() => downloadDocument(document?.ruta_archivo, document?.nombre_archivo)} startIcon={<DownloadIcon />}>Descargar</Button> */}
            </DialogActions>
        </Dialog>
    );
};

export default DocumentPreviewDialog;
