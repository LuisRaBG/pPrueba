// src/hooks/useGlobalDocuments.js
import { useState, useEffect, useCallback } from 'react';
// Importa el servicio, pero necesitará adaptación para una consulta global real
import { getDocuments } from '../services/documentService.js'; // Ajusta la ruta si es necesario
import { useAuth } from '../contexts/AuthContext.js'; // Ajusta la ruta si es necesario

/**
 * Hook para obtener documentos globales.
 * NOTA IMPORTANTE: La función `getDocuments` en `documentService.js` actualmente
 * requiere un ID de proyecto. Necesitarás adaptar esa función o crear una nueva
 * (`getGlobalDocuments`) que implemente la lógica deseada para obtener documentos
 * "globales" (ej: los más recientes, los no asociados, etc.).
 * Por ahora, este hook devolverá una lista vacía.
 */
export const useGlobalDocuments = (limit = 20) => { // Límite opcional para la consulta
    const [globalDocs, setGlobalDocs] = useState([]);
    const [loadingGlobalDocs, setLoadingGlobalDocs] = useState(false);
    const [errorGlobalDocs, setErrorGlobalDocs] = useState(null);
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

    const fetchGlobalDocs = useCallback(async () => {
        // No intentar cargar si no está autenticado o la autenticación está en proceso
        if (isAuthLoading || !isAuthenticated) {
            setGlobalDocs([]);
            setLoadingGlobalDocs(false);
            setErrorGlobalDocs(null);
            return;
        }

        setLoadingGlobalDocs(true);
        setErrorGlobalDocs(null);
        console.log("useGlobalDocuments: Fetching global documents (Placeholder)...");

        try {
            // --- ¡¡IMPLEMENTACIÓN PENDIENTE EN documentService.js!! ---
            // Aquí deberías llamar a tu función de servicio adaptada/nueva.
            // Ejemplo (si adaptas getDocuments para aceptar null):
            // const data = await getDocuments(null, null, limit);
            // Ejemplo (si creas una nueva función):
            // const data = await getGlobalDocuments(limit);

            // *** Placeholder Actual ***
            console.warn("useGlobalDocuments: Lógica de obtención global no implementada en documentService.js. Mostrando lista vacía.");
            await new Promise(resolve => setTimeout(resolve, 500)); // Simular pequeña demora
            const data = { documentos: [] }; // Devuelve vacío por ahora
            // --- Fin Placeholder ---

            setGlobalDocs(data.documentos || []);

        } catch (err) {
            console.error("Error fetching global documents:", err);
            setErrorGlobalDocs(err.message || 'Error al cargar documentos globales.');
            setGlobalDocs([]);
        } finally {
            setLoadingGlobalDocs(false);
        }
    }, [isAuthenticated, isAuthLoading, limit]); // Dependencias del useCallback

    // Efecto para cargar los documentos cuando el hook se monta o cambian las dependencias
    useEffect(() => {
        fetchGlobalDocs();
    }, [fetchGlobalDocs]); // fetchGlobalDocs es estable gracias a useCallback

    // Devuelve el estado y la función para refrescar
    return {
        globalDocs,
        loadingGlobalDocs,
        errorGlobalDocs,
        refreshGlobalDocs: fetchGlobalDocs,
    };
};
