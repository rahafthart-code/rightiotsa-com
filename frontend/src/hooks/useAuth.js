import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

/**
 * Auth hook: tracks Supabase user + profile, exposes signOut,
 * touches profiles.last_seen_at, and redirects new users (zero assets)
 * to /onboarding on sign-in.
 *
 * Demo-mode (mock localStorage user) is preserved — it skips Supabase
 * profile/asset queries since RLS would block them anyway.
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;

    // 1) Listener FIRST so we never miss an auth event.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const u = session?.user ?? null;
        setUser(u);

        if (event === 'SIGNED_OUT') {
          setProfile(null);
          // Don't navigate if we never had a real session (e.g. mock demo user)
          if (location.pathname !== '/login') navigate('/login');
          return;
        }

        if (u) {
          // Defer Supabase calls so we don't block the auth callback.
          setTimeout(() => {
            if (cancelled) return;
            void hydrateUser(u.id, { redirectIfEmpty: event === 'SIGNED_IN' });
          }, 0);
        }
      }
    );

    // 2) Then read existing session.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (cancelled) return;
      const u = session?.user ?? null;
      setUser(u);
      if (u) await hydrateUser(u.id, { redirectIfEmpty: false });
      setLoading(false);
    });

    async function hydrateUser(userId, { redirectIfEmpty }) {
      // Profile lookup — note: profiles.user_id (not .id) per schema.
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (!cancelled) setProfile(prof ?? null);

      // Touch last_seen_at (best-effort).
      supabase
        .from('profiles')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('user_id', userId)
        .then(({ error }) => {
          if (error) console.warn('last_seen_at update failed:', error.message);
        });

      // Onboarding redirect — only on fresh sign-in, never if already there.
      if (redirectIfEmpty && location.pathname !== '/onboarding') {
        const { count } = await supabase
          .from('assets')
          .select('id', { count: 'exact', head: true })
          .eq('owner_id', userId);
        if (!cancelled && !count) navigate('/onboarding');
      }
    }

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = () => supabase.auth.signOut();

  return { user, profile, loading, signOut };
}
