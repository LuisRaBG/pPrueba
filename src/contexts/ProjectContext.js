// src/contexts/ProjectContext.js
import React, { createContext, useState, useContext, useMemo, useCallback } from 'react';
import * as equiposService from '../features/equipos/services/equiposService.js'; // Importa el servicio

const ProjectContext = createContext(null);

export const ProjectProvider = ({ children }) => {
    const [currentProjectId, setCurrentProjectId] = useState(null);
    const [currentProjectMembers, setCurrentProjectMembers] = useState([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [errorMembers, setErrorMembers] = useState(null);
    const [isTeamPanelOpen, setIsTeamPanelOpen] = useState(false); // <--- **NUEVO**: Estado para el panel

    // Función para cargar miembros (sin cambios)
    const loadProjectMembers = useCallback(async (projectId) => {
        if (!projectId) {
            setCurrentProjectMembers([]);
            setErrorMembers(null);
            setLoadingMembers(false);
            return;
        }
        setLoadingMembers(true);
        setErrorMembers(null);
        try {
            console.log(`ProjectContext: Fetching members for project ${projectId}`);
            const members = await equiposService.fetchMiembrosProyecto(projectId);
            setCurrentProjectMembers(members);
        } catch (error) {
            console.error(`ProjectContext: Error fetching members for project ${projectId}:`, error);
            setErrorMembers(error.message || 'Error al cargar miembros.');
            setCurrentProjectMembers([]);
        } finally {
            setLoadingMembers(false);
        }
    }, []);

    // Función para establecer el proyecto activo (sin cambios)
    const setActiveProject = useCallback((projectId) => {
        setCurrentProjectId(projectId);
        // Cierra el panel de equipo si se cambia o deselecciona el proyecto
        setIsTeamPanelOpen(false);
        loadProjectMembers(projectId);
    }, [loadProjectMembers]);

    // --- **NUEVO**: Funciones para controlar el panel ---
    const openTeamPanel = useCallback(() => {
        if (currentProjectId) { // Solo abre si hay un proyecto activo
            setIsTeamPanelOpen(true);
        } else {
            console.warn("ProjectContext: Intento de abrir panel de equipo sin proyecto seleccionado.");
        }
    }, [currentProjectId]);

    const closeTeamPanel = useCallback(() => {
        setIsTeamPanelOpen(false);
    }, []);

    // --- **NUEVO**: Función para refrescar miembros (llamada desde el panel) ---
    const refreshMembers = useCallback(() => {
        if (currentProjectId) {
            loadProjectMembers(currentProjectId);
        }
    }, [currentProjectId, loadProjectMembers]);
    // --- Fin Nuevas Funciones ---

    const value = useMemo(() => ({
        currentProjectId,
        setActiveProject,
        currentProjectMembers,
        loadingMembers,
        errorMembers,
        isTeamPanelOpen, // <--- Exponer estado del panel
        openTeamPanel,   // <--- Exponer función para abrir
        closeTeamPanel,  // <--- Exponer función para cerrar
        refreshMembers,  // <--- Exponer función para refrescar
    }), [
        currentProjectId,
        setActiveProject,
        currentProjectMembers,
        loadingMembers,
        errorMembers,
        isTeamPanelOpen,
        openTeamPanel,
        closeTeamPanel,
        refreshMembers, // Añadir a dependencias
    ]);

    return (
        <ProjectContext.Provider value={value}>
            {children}
        </ProjectContext.Provider>
    );
};

export const useProject = () => {
    const context = useContext(ProjectContext);
    if (context === undefined || context === null) {
        throw new Error('useProject debe ser usado dentro de un ProjectProvider');
    }
    return context;
};
