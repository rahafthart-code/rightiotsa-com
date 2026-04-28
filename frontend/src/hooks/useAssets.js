import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Live owner asset list. Subscribes to INSERT/UPDATE/DELETE on assets
 * filtered by owner_id and reflects stability_index/status in real time.
 */
export function useAssets(ownerId) {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!ownerId) {
      setLoading(false);
      return;
    }

    let active = true;

    (async () => {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('assets')
        .select('*')
        .eq('owner_id', ownerId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (!active) return;
      if (err) setError(err.message);
      else setAssets(data || []);
      setLoading(false);
    })();

    const channel = supabase
      .channel(`assets-${ownerId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assets',
          filter: `owner_id=eq.${ownerId}`,
        },
        (payload) => {
          setAssets((prev) => {
            if (payload.eventType === 'INSERT') {
              return [payload.new, ...prev.filter((a) => a.id !== payload.new.id)];
            }
            if (payload.eventType === 'UPDATE') {
              return prev.map((a) => (a.id === payload.new.id ? { ...a, ...payload.new } : a));
            }
            if (payload.eventType === 'DELETE') {
              return prev.filter((a) => a.id !== payload.old.id);
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, [ownerId]);

  return { assets, loading, error };
}
