import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Top connection-status banner.
 * Subscribes to a lightweight Supabase Realtime channel and watches
 * its status. When disconnected, shows an amber banner with the
 * timestamp of the last successful update. Hides when reconnected.
 */
export default function ConnectionStatusBanner() {
  const [online, setOnline] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(() => new Date());

  useEffect(() => {
    let cancelled = false;

    const handleBrowserOffline = () => !cancelled && setOnline(false);
    const handleBrowserOnline = () => {
      if (cancelled) return;
      setOnline(true);
      setLastUpdate(new Date());
    };

    window.addEventListener('offline', handleBrowserOffline);
    window.addEventListener('online', handleBrowserOnline);

    let channel;
    try {
      channel = supabase
        .channel('connection-status-probe')
        .subscribe((status) => {
          if (cancelled) return;
          if (status === 'SUBSCRIBED') {
            setOnline(true);
            setLastUpdate(new Date());
          } else if (
            status === 'CHANNEL_ERROR' ||
            status === 'TIMED_OUT' ||
            status === 'CLOSED'
          ) {
            setOnline(false);
          }
        });
    } catch (e) {
      // If realtime can't init, fall back to navigator.onLine only.
      // eslint-disable-next-line no-console
      console.warn('[ConnectionStatusBanner] realtime init failed', e);
    }

    // Refresh "last update" stamp every minute while online
    const tick = setInterval(() => {
      if (!cancelled && navigator.onLine) setLastUpdate(new Date());
    }, 60_000);

    return () => {
      cancelled = true;
      window.removeEventListener('offline', handleBrowserOffline);
      window.removeEventListener('online', handleBrowserOnline);
      clearInterval(tick);
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  if (online) return null;

  const time = lastUpdate.toLocaleTimeString('ar-SA', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      role="status"
      aria-live="polite"
      dir="rtl"
      className="sticky top-0 z-50 w-full text-center text-sm font-semibold py-2 px-4"
      style={{
        background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)',
        color: '#1a1300',
        borderBottom: '1px solid #b45309',
        fontFamily: "'Cairo', sans-serif",
        boxShadow: '0 2px 10px rgba(217,119,6,0.35)',
      }}
    >
      وضع عدم الاتصال — آخر تحديث: {time}
    </div>
  );
}
