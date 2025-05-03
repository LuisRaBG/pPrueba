// src/hooks/useActivityLog.js
import { useState, useEffect, useCallback } from 'react';
import { getActivityLogByEntity } from '../services/activityLogService.js';

const useActivityLog = (entityType, entityId) => { // entityType puede ser null para global
    const [logEntries, setLogEntries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchLog = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Llama al servicio para obtener los logs
            // Pasamos null si no hay tipo/id específico
            const entries = await getActivityLogByEntity(entityType, entityId);
            setLogEntries(entries);
        } catch (err) {
            const entityInfo = entityType && entityId ? `for ${entityType} ${entityId}` : 'globally';
            console.error(`Error fetching activity log ${entityInfo}:`, err);
            setError(err.message || 'No se pudo cargar el historial.');
            setLogEntries([]); // Limpiar en caso de error
        } finally {
            setLoading(false);
        }
    }, [entityType, entityId]); // Dependencias correctas

    useEffect(() => {
        fetchLog();
    }, [fetchLog]); // fetchLog incluye entityType y entityId

    // Función para refrescar manualmente
    const refreshLog = useCallback(() => {
        fetchLog();
    }, [fetchLog]);

    return { logEntries, loading, error, refreshLog };
};

export { useActivityLog };
