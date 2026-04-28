import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Auth hook: tracks the current Supabase user, exposes signOut,
 * and updates profiles.last_seen_at on each session open.
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up listener BEFORE getSession to avoid missing events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Touch last_seen_at whenever the active user changes
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('profiles')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .then(({ error }) => {
        if (error) console.warn('last_seen_at update failed:', error.message);
      });
  }, [user?.id]);

  const signOut = () => supabase.auth.signOut();

  return { user, loading, signOut };
}
