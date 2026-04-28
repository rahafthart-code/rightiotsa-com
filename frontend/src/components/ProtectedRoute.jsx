import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ensureMockUser } from '../utils/mockData';

/**
 * Auth guard. Uses Supabase session via useAuth().
 * Falls back to demo mock user (preview mode) so the dashboard
 * stays accessible without a real login during development.
 */
export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const { user, loading } = useAuth();

  // Demo mode fallback: if Supabase has no session, accept the mock user.
  ensureMockUser();
  const hasMockUser = !!localStorage.getItem('user');

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--color-bg-primary, #faf7f0)' }}
      >
        <div
          className="animate-spin h-10 w-10 rounded-full border-4 border-t-transparent"
          style={{ borderColor: '#006c35', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  if (!user && !hasMockUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
