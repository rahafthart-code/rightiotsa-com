import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Subscribe to a user's notifications with realtime INSERT updates.
 * Fires a `danger-alert` window event when a `danger_alert` arrives so that
 * any overlay component can open instantly.
 *
 * @param {string} ownerId - auth user id (profiles.user_id / notifications.owner_id)
 */
export function useNotifications(ownerId) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!ownerId) return;

    let active = true;

    // Initial fetch
    supabase
      .from('notifications')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        if (!active || error || !data) return;
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.is_read).length);
      });

    // Realtime subscription
    const channel = supabase
      .channel(`notif-${ownerId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `owner_id=eq.${ownerId}`,
        },
        (payload) => {
          const newNotif = payload.new;
          setNotifications((prev) => [newNotif, ...prev]);
          if (!newNotif.is_read) {
            setUnreadCount((prev) => prev + 1);
          }
          if (newNotif.type === 'danger_alert') {
            window.dispatchEvent(
              new CustomEvent('danger-alert', { detail: newNotif })
            );
          }
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [ownerId]);

  const markRead = async (id) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id);
    if (error) return;
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('owner_id', ownerId)
      .eq('is_read', false);
    if (error) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  return { notifications, unreadCount, markRead, markAllRead };
}
