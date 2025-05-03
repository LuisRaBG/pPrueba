// src/features/schedule/components/GlobalDocumentListDisplay.js
import React, { useCallback } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
// Ajusta la ruta si DocumentList está en otro lugar, pero basado en tu ruta, parece estar bien
import DocumentList from './DocumentList.js';
import { useDocumentService } from '../../../services/documentService.js'; // Ajusta ruta si es necesario

/**
 * Componente contenedor para mostrar la lista de documentos globales.
 * Maneja estados de carga/error y las acciones de descarga/eliminación.
 */
const GlobalDocumentListDisplay = ({ documents, loading, error, refreshList }) => {
    // Obtiene las funciones de acción del servicio
    const { deleteDocument, downloadDocument } = useDocumentService();

    // Handler para la eliminación de documentos
    const handleDelete = useCallback(async (filePath) => {
        console.log("Intentando eliminar documento global:", filePath);
        // Considera añadir un diálogo de confirmación aquí
        if (!window.confirm(`¿Estás seguro de eliminar el documento "${filePath.split('/').pop()}"?`)) {
            return;
        }
        try {
            await deleteDocument(filePath);
            // Llama a la función de refresco si se proporcionó
            if (typeof refreshList === 'function') {
                refreshList();
            } else {
                // Fallback si no hay función de refresco (menos ideal)
                alert("Documento eliminado. Refresca la página para ver los cambios.");
            }
        } catch (err) {
            console.error("Error al eliminar documento global:", err);
            alert(`Error al eliminar: ${err.message}`); // Muestra error simple
        }
    }, [deleteDocument, refreshList]); // Dependencias

    // Handler para la descarga de documentos
    const handleDownload = useCallback(async (filePath, filename) => {
        console.log("Intentando descargar documento global:", filePath);
        try {
            await downloadDocument(filePath, filename);
        } catch (err) {
            console.error("Error al descargar documento global:", err);
            alert(`Error al descargar: ${err.message}`); // Muestra error simple
        }
    }, [downloadDocument]); // Dependencia

    // Muestra indicador de carga
    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}><CircularProgress size={24} /></Box>;
    }

    // Muestra mensaje de error
    if (error) {
        return <Alert severity="error" sx={{ mt: 1, fontSize: '0.8rem' }}>{error}</Alert>;
    }

    // Muestra mensaje si no hay documentos
    if (!documents || documents.length === 0) {
        return <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center', fontStyle: 'italic' }}>No hay documentos globales para mostrar.</Typography>;
    }

    // Renderiza DocumentList con los documentos globales y los handlers
    return (
        <DocumentList
            documents={documents}
            onDelete={handleDelete} // Pasa el handler de eliminación
            onDownload={handleDownload} // Pasa el handler de descarga
        />
    );
};

export default GlobalDocumentListDisplay;
