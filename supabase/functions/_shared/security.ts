// Shared security helpers for all edge functions in this project.
// Adapted to the livestock IoT schema: roles live in the `user_roles` table
// (checked via the `has_role` SQL function), not on `profiles`.

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "*";

export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-request-id",
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin",
};

export const securityHeaders: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(self)",
  "Cache-Control": "no-store, no-cache, must-revalidate",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
};

export function secureError(status: number, message: string): Response {
  console.error(`[SECURITY] ${status}: ${message}`);
  return new Response(
    JSON.stringify({ error: message, timestamp: new Date().toISOString() }),
    {
      status,
      headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" },
    },
  );
}

export function secureResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, ...securityHeaders, "Content-Type": "application/json" },
  });
}

export function handlePreflight(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  return null;
}

export function checkRequestSize(req: Request, maxMB = 2): Response | null {
  const len = req.headers.get("content-length");
  if (len && parseInt(len, 10) > maxMB * 1024 * 1024) {
    return secureError(413, `Payload too large. Max ${maxMB}MB.`);
  }
  return null;
}

export type Role = "owner" | "admin" | "ceo";

export interface AuthContext {
  user: { id: string; email: string | null };
  roles: Role[];
  supabase: SupabaseClient;
  service: SupabaseClient;
  aal: string | null; // authenticator assurance level from JWT
}

/** Verify the JWT, hydrate roles via has_role, and return scoped clients. */
export async function verifyAuth(
  req: Request,
  opts: { requireMfa?: boolean } = {},
): Promise<AuthContext | Response> {
  const authHeader = req.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return secureError(401, "Missing authorization header");
  }
  const token = authHeader.slice("Bearer ".length).trim();

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const service = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims?.sub) {
    return secureError(401, "Invalid or expired token");
  }
  const claims = data.claims as Record<string, unknown>;
  const userId = String(claims.sub);
  const aal = (claims.aal as string | undefined) ?? null;

  if (opts.requireMfa && aal !== "aal2") {
    return secureError(403, "Multi-factor authentication required");
  }

  // Hydrate roles
  const roles: Role[] = [];
  for (const role of ["owner", "admin", "ceo"] as const) {
    const { data: ok } = await service.rpc("has_role", { _user_id: userId, _role: role });
    if (ok === true) roles.push(role);
  }

  return {
    user: { id: userId, email: (claims.email as string) ?? null },
    roles,
    supabase,
    service,
    aal,
  };
}

export function requireRole(ctx: AuthContext, allowed: Role[]): Response | null {
  if (!ctx.roles.some((r) => allowed.includes(r))) {
    return secureError(403, `Forbidden: requires role ${allowed.join(" or ")}`);
  }
  return null;
}

/** Best-effort client IP (for rate-limit keys & audit). */
export function clientIp(req: Request): string {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
    "unknown"
  );
}

/** Fire-and-forget security-event logger (uses service role). */
export async function logSecurityEvent(
  service: SupabaseClient,
  args: {
    type: string;
    severity?: "low" | "medium" | "high" | "critical";
    userId?: string | null;
    endpoint?: string | null;
    details?: Record<string, unknown>;
  },
): Promise<void> {
  try {
    await service.rpc("log_security_event", {
      p_type: args.type,
      p_severity: args.severity ?? "medium",
      p_user_id: args.userId ?? null,
      p_endpoint: args.endpoint ?? null,
      p_details: args.details ?? {},
    });
  } catch (err) {
    console.warn("logSecurityEvent failed:", err);
  }
}
