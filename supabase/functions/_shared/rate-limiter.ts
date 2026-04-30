// Atomic rate limiter backed by the `rate_limits` table + RPC in Postgres.
// fail-open on infrastructure errors; explicit 429 on exceeded.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders, securityHeaders } from "./security.ts";

const service = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

export interface RateLimitConfig {
  max: number;
  window: number; // seconds
}

export const LIMITS = {
  otp_request:       { max: 5,   window: 900 },    // 5 / 15 min per identifier
  otp_request_ip:    { max: 20,  window: 900 },    // 20 / 15 min per IP
  otp_verify:        { max: 10,  window: 900 },    // 10 / 15 min per identifier
  login_attempt:     { max: 5,   window: 900 },
  ai_assistant:      { max: 30,  window: 3600 },
  iot_ingest:        { max: 600, window: 60 },     // 10/sec sustained per device
  send_notification: { max: 200, window: 3600 },
} as const satisfies Record<string, RateLimitConfig>;

export type LimitKey = keyof typeof LIMITS;

/** Returns a 429 Response when over the limit, else null. */
export async function checkRateLimit(
  scope: LimitKey,
  identifier: string,
): Promise<Response | null> {
  const cfg = LIMITS[scope];
  if (!cfg) return null;
  const key = `${scope}:${identifier}`;

  const { data, error } = await service.rpc("check_and_increment_rate_limit", {
    p_key: key,
    p_max: cfg.max,
    p_window: cfg.window,
  });

  if (error) {
    console.error("[rate-limit] rpc failed:", error.message);
    return null; // fail open
  }

  const result = data as {
    allowed: boolean;
    count: number;
    limit: number;
    remaining: number;
    reset_at: string;
  };

  if (!result.allowed) {
    const retryAfter = Math.max(
      1,
      Math.ceil((new Date(result.reset_at).getTime() - Date.now()) / 1000),
    );
    return new Response(
      JSON.stringify({
        error: "Rate limit exceeded",
        limit: result.limit,
        remaining: 0,
        reset_at: result.reset_at,
      }),
      {
        status: 429,
        headers: {
          ...corsHeaders,
          ...securityHeaders,
          "Content-Type": "application/json",
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(result.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": result.reset_at,
        },
      },
    );
  }

  return null;
}
