// src/contexts/NotificationContext.js
import React, { createContext, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext.js'; // Asume que tienes un AuthContext en esta ruta
import { supabase } from '../utils/supabase.js'; // Importa el cliente Supabase
import {
    fetchUnreadNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    subscribeToNotifications // Asegúrate que esta función esté exportada en tu servicio
} from '../services/notificationService.js'; // Ajusta la ruta a tu servicio

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth(); // Obtiene el usuario actual del AuthContext
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Función para cargar las notificaciones no leídas
    const loadNotifications = useCallback(async () => {
        if (!user) {
            setNotifications([]); // Limpia si no hay usuario
            return;
        }
        setLoading(true);
        setError(null);
        try {
            console.log("NotificationContext: Fetching unread notifications...");
            const data = await fetchUnreadNotifications();
            setNotifications(data);
            console.log("NotificationContext: Notifications loaded:", data.length);
        } catch (err) {
            console.error("NotificationContext: Error loading notifications:", err);
            setError(err.message);
            setNotifications([]); // Limpia en caso de error
        } finally {
            setLoading(false);
        }
    }, [user]); // Depende del usuario

    // Efecto para carga inicial y suscripción a tiempo real
    useEffect(() => {
        loadNotifications(); // Carga inicial al montar o cambiar usuario

        if (!user) return; // No suscribir si no hay usuario

        console.log("NotificationContext: Subscribing to real-time notifications...");
        // Suscripción a tiempo real para NUEVAS notificaciones
        const channel = subscribeToNotifications((newNotification) => {
            console.log("NotificationContext: Real-time notification received:", newNotification);
            // Añade la nueva notificación al principio de la lista
            // Asegúrate que la notificación no esté ya en la lista (por si acaso)
            setNotifications(prev => {
                if (!prev.some(n => n.id_notificacion === newNotification.id_notificacion)) {
                    return [newNotification, ...prev];
                }
                return prev;
            });
            // Aquí podrías disparar un sonido o un toast si quisieras
        });

        // Función de limpieza al desmontar o cambiar usuario
        return () => {
            console.log("NotificationContext: Unsubscribing from real-time notifications.");
            if (channel) {
                supabase.removeChannel(channel).catch(err => console.error("Error removing channel:", err));
            }
        };

    }, [user, loadNotifications]); // Se ejecuta cuando cambia el usuario o la función loadNotifications

    // Función para marcar una notificación como leída
    const markAsRead = useCallback(async (notificationId) => {
        try {
            await markNotificationAsRead(notificationId);
            // Elimina la notificación de la lista local para actualizar la UI
            setNotifications(prev => prev.filter(n => n.id_notificacion !== notificationId));
            console.log(`NotificationContext: Marked notification ${notificationId} as read.`);
        } catch (err) {
            console.error("NotificationContext: Failed to mark notification as read:", err);
            // Podrías mostrar un error al usuario aquí
        }
    }, []); // No tiene dependencias externas directas

    // Función para marcar todas como leídas
    const markAllAsRead = useCallback(async () => {
         try {
            await markAllNotificationsAsRead();
            setNotifications([]); // Limpia la lista local
            console.log("NotificationContext: Marked all notifications as read.");
        } catch (err) {
            console.error("NotificationContext: Failed to mark all notifications as read:", err);
            // Podrías mostrar un error al usuario aquí
        }
    }, []); // No tiene dependencias externas directas

    // Calcula el número de notificaciones no leídas (es simplemente el tamaño del array)
    const unreadCount = useMemo(() => notifications.length, [notifications]);

    // Memoiza el valor del contexto
    const value = useMemo(() => ({
        notifications,
        unreadCount,
        loading,
        error,
        markAsRead,
        markAllAsRead,
        reloadNotifications: loadNotifications // Expone función para recargar manualmente si es necesario
    }), [notifications, unreadCount, loading, error, markAsRead, markAllAsRead, loadNotifications]);

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

// Hook para consumir el contexto
export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined || context === null) {
        throw new Error('useNotifications debe ser usado dentro de un NotificationProvider');
    }
    return context;
};
