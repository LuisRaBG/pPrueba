// src/services/notificationService.js
import { supabase } from '../utils/supabase.js'; // Ajusta la ruta

/**
 * Obtiene las notificaciones no leídas para el usuario actual.
 * @returns {Promise<Array<object>>} Lista de notificaciones.
 */
export const fetchUnreadNotifications = async () => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return []; // No hay usuario, no hay notificaciones

        const { data, error } = await supabase
            .from('notificaciones')
            .select('*') // Selecciona todas las columnas
            .eq('id_usuario_destino', user.id)
            .eq('leida', false) // Solo las no leídas
            .order('fecha_creacion', { ascending: false }); // Más recientes primero

        if (error) {
            console.error("Error fetching notifications:", error);
            throw new Error(error.message || 'Error al cargar notificaciones.');
        }
        return data || [];
    } catch (error) {
        console.error("Error en fetchUnreadNotifications:", error);
        throw error;
    }
};

/**
 * Marca una notificación específica como leída.
 * @param {string} notificationId - El ID de la notificación (UUID).
 * @returns {Promise<object>} La notificación actualizada.
 */
export const markNotificationAsRead = async (notificationId) => {
    try {
        const { data, error } = await supabase
            .from('notificaciones')
            .update({ leida: true })
            .eq('id_notificacion', notificationId)
            .select()
            .single(); // Espera un solo resultado

        if (error) {
            console.error("Error marking notification as read:", error);
            throw new Error(error.message || 'Error al marcar notificación.');
        }
        return data;
    } catch (error) {
        console.error("Error en markNotificationAsRead:", error);
        throw error;
    }
};

/**
 * Marca todas las notificaciones del usuario como leídas.
 * @returns {Promise<{count: number}>} El número de notificaciones actualizadas.
 */
export const markAllNotificationsAsRead = async () => {
     try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { count: 0 };

        const { count, error } = await supabase
            .from('notificaciones')
            .update({ leida: true })
            .eq('id_usuario_destino', user.id)
            .eq('leida', false); // Solo actualiza las no leídas

        if (error) {
            console.error("Error marking all notifications as read:", error);
            throw new Error(error.message || 'Error al marcar todas las notificaciones.');
        }
        return { count: count || 0 };
    } catch (error) {
        console.error("Error en markAllNotificationsAsRead:", error);
        throw error;
    }
};

/**
 * Escucha nuevas notificaciones en tiempo real para el usuario actual.
 * @param {function(object): void} callback - Función a llamar cuando llega una nueva notificación.
 * @returns {RealtimeChannel} El canal de Supabase para poder desuscribirse.
 */
export const subscribeToNotifications = (callback) => {
    const channel = supabase
        .channel('public:notificaciones')
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'notificaciones',
                // Filtra por el ID del usuario actual en el servidor
                // filter: `id_usuario_destino=eq.${supabase.auth.user()?.id}` // Asegúrate que user() esté disponible o pasa el ID
            },
            (payload) => {
                console.log('New notification received:', payload.new);
                // Podrías necesitar verificar el ID de usuario aquí si el filtro no funciona como esperas
                if (payload.new.id_usuario_destino === supabase.auth.user()?.id) {
                     callback(payload.new);
                }
            }
        )
        .subscribe((status, err) => {
            if (status === 'SUBSCRIBED') {
                console.log('Subscribed to notification changes!');
            }
            if (status === 'CHANNEL_ERROR') {
                console.error('Notification subscription error:', err);
            }
             if (status === 'TIMED_OUT') {
                console.warn('Notification subscription timed out.');
            }
        });

    return channel;
};
