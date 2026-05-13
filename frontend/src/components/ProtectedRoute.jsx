import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSubscription } from '../hooks/useSubscription';
import { ensureMockUser } from '../utils/mockData';

/**
 * Auth + subscription guard.
 *  - Requires a real Supabase session.
 *  - Requires an active or trial-with-future-end subscription, otherwise → /subscribe.
 */
export default function ProtectedRoute({ children }) {
  const location = useLocation();
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

  // Allow access to /subscribe and /payment/success even without an active subscription
  const path = location.pathname;
  const isSubscribeFlow = path.startsWith('/subscribe') || path.startsWith('/payment');

  if (!isActive && !isSubscribeFlow) {
    return <Navigate to="/subscribe" state={{ from: location, reason: 'inactive_subscription' }} replace />;
  }

  return children;
}
