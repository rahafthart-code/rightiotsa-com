// Rate-limited & validated wrapper around Supabase Auth OTP.
// L3 (rate limiting) + L4 (input validation) + L7 (security event logging)
// for the OTP login flow. Frontend calls this instead of hitting auth directly.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  corsHeaders,
  handlePreflight,
  secureError,
  secureResponse,
  clientIp,
  logSecurityEvent,
  checkRequestSize,
} from "../_shared/security.ts";
import { checkRateLimit } from "../_shared/rate-limiter.ts";
import {
  safeJson,
  validateContactIdentifier,
  validateOtpCode,
} from "../_shared/validators.ts";

const service = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

interface RequestBody {
  action?: "request" | "verify";
  identifier?: unknown;
  code?: unknown;
}

Deno.serve(async (req) => {
  const pre = handlePreflight(req);
  if (pre) return pre;

  if (req.method !== "POST") {
    return secureError(405, "Method not allowed");
  }

  const sizeCheck = checkRequestSize(req, 1);
  if (sizeCheck) return sizeCheck;

  let body: RequestBody;
  try {
    body = await safeJson<RequestBody>(req, 4 * 1024);
  } catch (err) {
    return secureError(400, (err as Error).message);
  }

  const ip = clientIp(req);

  // --- Validate identifier (email or Saudi mobile) -------------------
  let identity: { kind: "email" | "mobile"; value: string };
  try {
    identity = validateContactIdentifier(body.identifier);
  } catch (err) {
    await logSecurityEvent(service, {
      type: "otp_invalid_identifier",
      severity: "low",
      endpoint: "/secure-otp",
      details: { ip, error: (err as Error).message },
    });
    return secureError(400, (err as Error).message);
  }

  if (body.action === "request") {
    // L3: throttle per-identifier and per-IP
    const limited =
      (await checkRateLimit("otp_request", identity.value)) ||
      (await checkRateLimit("otp_request_ip", ip));
    if (limited) {
      await logSecurityEvent(service, {
        type: "otp_rate_limited",
        severity: "medium",
        endpoint: "/secure-otp",
        details: { ip, identifier_kind: identity.kind },
      });
      return limited;
    }

    const { error } =
      identity.kind === "email"
        ? await service.auth.signInWithOtp({
            email: identity.value,
            options: { shouldCreateUser: true },
          })
        : await service.auth.signInWithOtp({
            phone: identity.value,
            options: { shouldCreateUser: true },
          });

    if (error) {
      await logSecurityEvent(service, {
        type: "otp_send_failure",
        severity: "medium",
        endpoint: "/secure-otp",
        details: { ip, error: error.message },
      });
      return secureError(500, "Could not send verification code");
    }

    return secureResponse({ ok: true, channel: identity.kind });
  }

  if (body.action === "verify") {
    let code: string;
    try {
      code = validateOtpCode(body.code);
    } catch (err) {
      return secureError(400, (err as Error).message);
    }

    const limited = await checkRateLimit("otp_verify", identity.value);
    if (limited) return limited;

    const { data, error } =
      identity.kind === "email"
        ? await service.auth.verifyOtp({
            email: identity.value,
            token: code,
            type: "email",
          })
        : await service.auth.verifyOtp({
            phone: identity.value,
            token: code,
            type: "sms",
          });

    if (error || !data?.session) {
      await logSecurityEvent(service, {
        type: "auth_failure",
        severity: "medium",
        endpoint: "/secure-otp",
        details: { ip, identifier_kind: identity.kind, reason: error?.message },
      });
      return secureError(401, "Invalid or expired code");
    }

    return secureResponse({
      ok: true,
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
      user: { id: data.user?.id, email: data.user?.email, phone: data.user?.phone },
    });
  }

  return secureError(400, "Unknown action — expected 'request' or 'verify'");
});

// CORS export so eslint doesn't warn about unused import
void corsHeaders;
