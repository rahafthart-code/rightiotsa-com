import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../hooks/useAuth';
import { ADMIN_BG, ADMIN_RED } from './theme';

/**
 * Admin guard.
 * Reads `user_roles` for the current user; allows access only when
 * an `admin` role row exists. Otherwise redirects to /dashboard.
 */
export default function AdminGuard({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState({ loading: true, isAdmin: false });

  useEffect(() => {
    let cancelled = false;
    async function check() {
      if (!user?.id) {
        if (!cancelled) setState({ loading: false, isAdmin: false });
        return;
      }
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        console.warn('admin role check failed:', error.message);
        setState({ loading: false, isAdmin: false });
      } else {
        setState({ loading: false, isAdmin: !!data });
      }
    }
    if (!authLoading) check();
    return () => { cancelled = true; };
  }, [user?.id, authLoading]);

  if (authLoading || state.loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: ADMIN_BG }}
      >
        <div
          className="animate-spin h-10 w-10 rounded-full border-4 border-t-transparent"
          style={{ borderColor: ADMIN_RED, borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!state.isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}
