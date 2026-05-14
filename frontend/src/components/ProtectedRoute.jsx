import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import { ensureMockUser, isDemoMode } from '../utils/mockData';

/**
 * Auth + subscription guard.
 *  - Demo mode (localStorage demo_mode=1) bypasses all checks for inspection.
 *  - Otherwise requires a real Supabase session + active/trial subscription.
 */
export default function ProtectedRoute({ children }) {
  const location = useLocation();

  // Demo / bypass mode short-circuit — full access for inspection.
  if (isDemoMode()) return children;

  const { user, loading: authLoading } = useAuth();
  const { isActive, loading: subLoading } = useSubscription();

  // Clear any legacy mock token so /dashboard truly requires auth.
  ensureMockUser();

  if (authLoading || (user && subLoading)) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--color-bg-primary, #F5F5DC)' }}
      >
        <div
          className="animate-spin h-10 w-10 rounded-full border-4 border-t-transparent"
          style={{ borderColor: '#006c35', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const path = location.pathname;
  const isSubscribeFlow = path.startsWith('/subscribe') || path.startsWith('/payment');

  if (!isActive && !isSubscribeFlow) {
    return <Navigate to="/subscribe" state={{ from: location, reason: 'inactive_subscription' }} replace />;
  }

  return children;
}

