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
  sanitizeText,
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
  // Optional signup metadata (request action only) — forwarded to
  // auth.signInWithOtp so the `handle_new_user` trigger can populate
  // profiles.full_name / profiles.national_id / profiles.phone on first login.
  full_name?: unknown;
  national_id?: unknown;
  phone?: unknown;
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

    // Optional signup metadata — only meaningful the first time a user signs
    // in (handle_new_user trigger reads it from raw_user_meta_data). Ignored
    // silently for returning users since the trigger only fires on INSERT.
    const metadata: Record<string, string> = {};
    try {
      if (typeof body.full_name === "string" && body.full_name.trim()) {
        metadata.full_name = sanitizeText(body.full_name, 200);
      }
      if (typeof body.national_id === "string" && body.national_id.trim()) {
        metadata.national_id = sanitizeText(body.national_id, 20);
      }
      if (typeof body.phone === "string" && body.phone.trim()) {
        metadata.phone = sanitizeText(body.phone, 20);
      }
    } catch { /* best-effort — never block OTP send over optional metadata */ }
    const signUpOptions = {
      shouldCreateUser: true,
      ...(Object.keys(metadata).length ? { data: metadata } : {}),
    };

    const { error } =
      identity.kind === "email"
        ? await service.auth.signInWithOtp({
            email: identity.value,
            options: signUpOptions,
          })
        : await service.auth.signInWithOtp({
            phone: identity.value,
            options: signUpOptions,
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
