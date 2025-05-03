// src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect, useCallback, useMemo, useRef } from 'react';
// Importa el cliente Supabase
import { supabase } from '../utils/supabase.js';
// Importa la función de logout del servicio (si quieres mantener la abstracción)
import { logoutUser as serviceLogout } from '../services/authService.js'; // Asegúrate que la ruta sea correcta

const AuthContext = createContext(null);

// --- Constantes para Inactividad ---
const INACTIVITY_TIMEOUT_DURATION = 15 * 60 * 1000; // 15 minutos

export const AuthProvider = ({ children }) => {
    // Estado para el objeto de sesión completo de Supabase (incluye user, token, etc.)
    const [session, setSession] = useState(undefined); // Usar undefined para estado inicial desconocido
    // Estado para el objeto de usuario de Supabase
    const [user, setUser] = useState(undefined); // Usar undefined para estado inicial desconocido
    // Estado para indicar si se está verificando la sesión inicial
    const [isLoading, setIsLoading] = useState(true); // Empezar cargando
    // Estado para errores específicos de autenticación
    const [authError, setAuthError] = useState(null);

    // Función para cerrar sesión (llama al servicio)
    const logout = useCallback(async () => {
        console.log("AuthContext: Iniciando cierre de sesión...");
        setAuthError(null); // Limpia errores al intentar cerrar sesión
        try {
            await serviceLogout();
            console.log("AuthContext: Llamada al servicio de logout exitosa.");
        } catch (error) {
            console.error("AuthContext: Error durante la llamada al servicio de logout:", error);
            setAuthError(error.message || "Error al cerrar sesión.");
        } finally {
            // Limpia el temporizador de inactividad al cerrar sesión
            if (idleTimeoutId.current) {
                clearTimeout(idleTimeoutId.current);
                idleTimeoutId.current = null;
            }
        }
    }, []);

    // --- Lógica de Inactividad ---
    const idleTimeoutId = useRef(null);
    const resetIdleTimer = useCallback(() => {
        if (idleTimeoutId.current) {
            clearTimeout(idleTimeoutId.current);
        }
        // Solo establece el temporizador si el usuario está autenticado (no cargando y user existe)
        if (!isLoading && !!user) {
            idleTimeoutId.current = setTimeout(logout, INACTIVITY_TIMEOUT_DURATION);
            // console.log("AuthContext: Idle timer reset."); // Descomenta para depurar timer
        }
    }, [logout, user, isLoading]); // Depende de logout, user, isLoading

    // Efecto principal para manejar el estado de autenticación con Supabase
    useEffect(() => {
        let isMounted = true;
        console.log("AuthContext: useEffect running. Setting up listeners.");

        // 1. Obtener la sesión inicial al cargar el componente
        supabase.auth.getSession().then(({ data: { session: initialSession }, error }) => {
            console.log("AuthContext: getSession() completed.", { initialSession, error });
            if (!isMounted) return;

            if (error) {
                console.error("AuthContext: Error al obtener la sesión inicial:", error);
                setAuthError("Error al verificar la sesión inicial.");
                setUser(null);
                setSession(null);
            } else {
                console.log("AuthContext: Sesión inicial obtenida:", initialSession);
                setUser(initialSession?.user ?? null);
                setSession(initialSession);
            }
            // Si la sesión inicial ya está definida (incluso si es null),
            // y el listener aún no ha marcado la carga como completa, lo hacemos aquí.
            if (isLoading) {
                console.log("AuthContext: Setting isLoading to false after getSession().");
                setIsLoading(false);
            }

        }).catch(err => {
             if (isMounted) {
                 console.error("AuthContext: Error inesperado en getSession:", err);
                 setAuthError("Error crítico al verificar la sesión.");
                 setUser(null);
                 setSession(null);
                 if (isLoading) { // Asegura que isLoading sea falso en caso de error catch
                    console.log("AuthContext: Setting isLoading to false after getSession() catch.");
                    setIsLoading(false);
                 }
             }
        });


        // 2. Suscribirse a los cambios en el estado de autenticación
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, currentSession) => {
                if (isMounted) {
                    console.log(`AuthContext: onAuthStateChange triggered. Event: ${_event}. Current isLoading: ${isLoading}`, { currentSession });
                    setSession(currentSession);
                    setUser(currentSession?.user ?? null);

                    // Limpiar errores en eventos relevantes
                    if (_event === 'SIGNED_IN' || _event === 'SIGNED_OUT' || _event === 'USER_UPDATED') {
                        setAuthError(null);
                    }

                    // Reiniciar el temporizador en eventos relevantes
                    if (_event === 'SIGNED_IN' || _event === 'TOKEN_REFRESHED' || _event === 'USER_UPDATED') {
                        // Llamamos directamente a resetIdleTimer aquí, ya que user/isLoading pueden no haberse actualizado aún en este ciclo
                        resetIdleTimer();
                    }

                    // Asegura que isLoading sea falso después del primer evento del listener
                    if (isLoading) {
                        console.log("AuthContext: Setting isLoading to false inside onAuthStateChange.");
                        setIsLoading(false);
                    }
                }
            }
        );

        // --- Event Listeners para Inactividad ---
        const activityEvents = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
        activityEvents.forEach(event => {
            window.addEventListener(event, resetIdleTimer);
        });

        // Inicia el temporizador una vez después de la carga inicial si hay usuario
        // Se usa un pequeño timeout para asegurar que el estado isLoading se haya propagado
        const initialTimerTimeout = setTimeout(() => {
            // Usamos una verificación directa del estado actual en el momento del timeout
            // en lugar de depender de las variables 'user' e 'isLoading' del closure del useEffect
            const currentState = supabase.auth.getSession(); // Obtiene el estado síncrono si es posible (puede variar según versión/config)
            // O mejor, verifica los estados de React directamente si es necesario,
            // pero la lógica de resetIdleTimer ya lo hace internamente.
            resetIdleTimer(); // resetIdleTimer ya verifica isLoading y user internamente
        }, 100);


        // Función de limpieza
        return () => {
            isMounted = false;
            if (subscription) {
                subscription.unsubscribe();
                console.log("AuthContext: Desuscrito de los cambios de estado de autenticación.");
            }
            activityEvents.forEach(event => window.removeEventListener(event, resetIdleTimer));
            clearTimeout(initialTimerTimeout);
            if (idleTimeoutId.current) clearTimeout(idleTimeoutId.current);
            console.log("AuthContext: Cleaned up listeners and timers.");
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // <-- ¡QUITAR resetIdleTimer de aquí! El efecto debe correr solo una vez.

    // Memoizar el valor del contexto
    const value = useMemo(() => ({
        session,
        user,
        userId: user?.id,
        isAuthenticated: !!user,
        // isAuthenticated: !isLoading && !!user, // Considera esta versión si necesitas asegurarte que la carga terminó
        // isLoading debe ser true solo durante la verificación inicial muy breve
        isLoading: isLoading,
        authError,
        setAuthError,
        logout,
    }), [session, user, isLoading, authError, logout]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook para consumir el contexto
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) { // Solo chequear undefined es suficiente
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }
    return context;
};
