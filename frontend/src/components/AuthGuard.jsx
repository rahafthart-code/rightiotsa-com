// Unified Auth Guard — the single source of truth for protected routes
// across the IoT (and any future Insurance) surfaces.
//
// Layers it enforces:
//   • Valid Supabase session (AAL1).
//   • Optional role gate via `allowedRoles` (resolved against `user_roles`).
//   • Optional MFA (AAL2) gate via `requireMfa` — based on the MFA factors
//     enrolled for the user in Supabase Auth.
//
// While Supabase resolves the session it shows a brand-coloured spinner.
// Demo / preview mode (mock localStorage user) is preserved as a fallback so
// the IoT dashboard stays previewable during development.

import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { ensureMockUser } from "../utils/mockData";

const SPINNER_BG = "var(--color-bg-primary, #faf7f0)";
const SPINNER_RING = "#006c35";

function Spinner({ label }) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-3"
      style={{ background: SPINNER_BG }}
      role="status"
      aria-live="polite"
    >
      <div
        className="animate-spin h-10 w-10 rounded-full border-4 border-t-transparent"
        style={{ borderColor: SPINNER_RING, borderTopColor: "transparent" }}
      />
      {label ? (
        <p className="text-xs" style={{ color: "var(--color-text-tertiary, #666)" }}>
          {label}
        </p>
      ) : null}
    </div>
  );
}

/**
 * @param {{
 *   children: React.ReactNode,
 *   allowedRoles?: ('owner'|'admin'|'ceo')[],
 *   requireMfa?: boolean,
 *   redirectTo?: string,
 * }} props
 */
export default function AuthGuard({
  children,
  allowedRoles,
  requireMfa = false,
  redirectTo = "/login",
}) {
  const location = useLocation();
  const [state, setState] = useState({
    loading: true,
    session: null,
    aal: null,
    roles: [],
    error: null,
  });

  // Demo fallback so previews still work without a real session.
  ensureMockUser();
  const hasMockUser = !!localStorage.getItem("user");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;

      if (!session) {
        setState({ loading: false, session: null, aal: null, roles: [], error: null });
        return;
      }

      // Roles: query the user_roles table directly (RLS lets the user see their own).
      const { data: roleRows } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id);
      const roles = (roleRows ?? []).map((r) => r.role);

      // MFA assurance level via Supabase Auth.
      let aal = "aal1";
      try {
        const { data: aalData } =
          await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        aal = aalData?.currentLevel ?? "aal1";
      } catch (err) {
        // If MFA API is unavailable, fall back to claim from JWT when present.
        aal = session?.user?.aal ?? "aal1";
      }

      setState({ loading: false, session, aal, roles, error: null });
    }

    load();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // Re-evaluate on any auth event (sign-in, sign-out, MFA challenge).
        if (!session) {
          setState({ loading: false, session: null, aal: null, roles: [], error: null });
        } else {
          setTimeout(load, 0);
        }
      },
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  if (state.loading) return <Spinner />;

  // Real Supabase session preferred.
  if (state.session) {
    // Always allow access to MFA enrollment / required pages — otherwise
    // an MFA-gated route would create an infinite redirect loop for users
    // who haven't enrolled yet.
    const isMfaSetupRoute =
      location.pathname.startsWith("/security/mfa-enroll") ||
      location.pathname.startsWith("/security/mfa-required");

    if (requireMfa && state.aal !== "aal2" && !isMfaSetupRoute) {
      return (
        <Navigate
          to="/security/mfa-required"
          state={{ from: location }}
          replace
        />
      );
    }
    if (allowedRoles && allowedRoles.length > 0) {
      const ok = state.roles.some((r) => allowedRoles.includes(r));
      if (!ok) return <Navigate to="/dashboard" replace />;
    }
    return children;
  }

  // Demo / preview fallback (no MFA / no real role enforcement).
  if (hasMockUser && !requireMfa && !allowedRoles) {
    return children;
  }

  return <Navigate to={redirectTo} state={{ from: location }} replace />;
}
