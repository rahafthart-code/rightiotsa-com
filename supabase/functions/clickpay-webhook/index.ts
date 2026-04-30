// ClickPay webhook receiver — verifies HMAC signature and activates subscription.
// Public endpoint (no JWT). Authenticity comes from the signature header.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders, securityHeaders, secureError, secureResponse } from "../_shared/security.ts";

const service = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

async function hmacSha256Hex(key: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

const PLAN_LIMITS: Record<string, { max_assets: number; max_devices: number; max_stables: number }> = {
  starter:  { max_assets: 5,   max_devices: 5,   max_stables: 1 },
  pro:      { max_assets: 25,  max_devices: 25,  max_stables: 5 },
  business: { max_assets: 200, max_devices: 200, max_stables: 25 },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return secureError(405, "Method not allowed");

  const rawBody = await req.text();
  const signature = req.headers.get("signature") || req.headers.get("x-signature") || "";
  const serverKey = Deno.env.get("CLICKPAY_SERVER_KEY")!;

  // Verify HMAC (ClickPay signs the raw body with the server key)
  const expected = await hmacSha256Hex(serverKey, rawBody);
  const valid = signature && signature.toLowerCase() === expected.toLowerCase();

  let payload: any;
  try { payload = JSON.parse(rawBody); }
  catch { return secureError(400, "Invalid JSON"); }

  // Always log the event for audit (even invalid ones — useful for debugging)
  await service.from("iot_webhook_events").insert({
    source: "clickpay",
    device_serial: payload?.cart_id ?? null,
    payload,
    status: valid ? "verified" : "invalid_signature",
  });

  if (!valid) {
    console.warn("ClickPay webhook signature mismatch", { expected, signature });
    return secureError(401, "Invalid signature");
  }

  const cartId = String(payload.cart_id ?? "");
  const status = String(payload.payment_result?.response_status ?? "").toUpperCase();
  const tranRef = String(payload.tran_ref ?? "");
  const userId = payload.user_defined?.udf1;
  const plan = String(payload.user_defined?.udf2 ?? "starter");
  const cycle = String(payload.user_defined?.udf3 ?? "monthly");

  // Update payment row
  const newStatus = status === "A" ? "completed" : status === "H" ? "held" : "failed";
  await service.from("payments")
    .update({
      status: newStatus,
      provider_tran_ref: tranRef,
      webhook_payload: payload,
    })
    .eq("cart_id", cartId);

  // On success → activate / extend subscription
  if (newStatus === "completed" && userId) {
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.starter;
    const days = cycle === "yearly" ? 365 : 30;
    const periodEnd = new Date(Date.now() + days * 86400 * 1000).toISOString();

    const { data: existing } = await service
      .from("subscriptions").select("id").eq("owner_id", userId).maybeSingle();

    if (existing) {
      await service.from("subscriptions").update({
        plan, status: "active", billing_cycle: cycle,
        max_assets: limits.max_assets,
        max_devices: limits.max_devices,
        max_stables: limits.max_stables,
        current_period_start: new Date().toISOString(),
        current_period_end: periodEnd,
        trial_ends_at: null,
      }).eq("id", existing.id);
    } else {
      await service.from("subscriptions").insert({
        owner_id: userId, plan, status: "active", billing_cycle: cycle,
        max_assets: limits.max_assets,
        max_devices: limits.max_devices,
        max_stables: limits.max_stables,
        current_period_start: new Date().toISOString(),
        current_period_end: periodEnd,
      });
    }

    await service.from("notifications").insert({
      owner_id: userId,
      type: "payment_success",
      title: "✅ تم تفعيل اشتراكك",
      body: `تم استلام دفعتك بنجاح وتفعيل خطة ${plan}`,
      metadata: { plan, cycle, cart_id: cartId, tran_ref: tranRef },
    });
  }

  return secureResponse({ ok: true, status: newStatus });
});
