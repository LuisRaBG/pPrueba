// src/hooks/useDocumentService.js
import * as documentService from '../services/documentService.js'; // Ajusta ruta

/**
 * Hook para acceder fácilmente a las funciones del servicio de documentos.
 */
export const useDocumentService = () => {
    // Simplemente devuelve un objeto con las funciones importadas del servicio.
    // Esto facilita la inyección de dependencias o el mocking en pruebas si fuera necesario.
    return {
        uploadDocument: documentService.uploadDocument,
        getDocuments: documentService.getDocuments,
        deleteDocument: documentService.deleteDocument,
        downloadDocument: documentService.downloadDocument,
        getDocumentUrl: documentService.getDocumentUrl,
        // Añade aquí cualquier otra función que agregues al servicio
    };
};
