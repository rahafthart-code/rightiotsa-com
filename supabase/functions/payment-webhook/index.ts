// Payment webhook — receives ClickPay/Edfapay POST, verifies HMAC,
// upgrades subscription, logs to payments_log, notifies the owner.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createHmac, timingSafeEqual } from "https://deno.land/std@0.224.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-signature",
};

const PLAN_LIMITS: Record<string, { max_assets: number; max_devices: number; max_stables: number; price_sar: number }> = {
  starter:    { max_assets: 5,   max_devices: 5,   max_stables: 1,  price_sar: 199 },
  pro:        { max_assets: 20,  max_devices: 20,  max_stables: 5,  price_sar: 499 },
  business:   { max_assets: 50,  max_devices: 50,  max_stables: 20, price_sar: 999 },
  enterprise: { max_assets: 999, max_devices: 999, max_stables: 99, price_sar: 0   },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const body = await req.text();

  // ───── 1. HMAC signature verification (constant-time) ─────
  const secret = Deno.env.get("PAYMENT_WEBHOOK_SECRET");
  if (!secret) {
    return new Response(JSON.stringify({ error: "webhook secret not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const provided = (req.headers.get("x-webhook-signature") ?? "").replace(/^sha256=/i, "");
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  const ok = provided.length === expected.length &&
    timingSafeEqual(new TextEncoder().encode(provided), new TextEncoder().encode(expected));
  if (!ok) {
    return new Response(JSON.stringify({ error: "invalid signature" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let event: any;
  try { event = JSON.parse(body); } catch {
    return new Response(JSON.stringify({ error: "invalid json" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ───── 2. Only successful payments ─────
  const status = String(event.status || event.payment_result?.response_status || "").toLowerCase();
  if (!["paid", "captured", "a", "success", "completed"].includes(status)) {
    return new Response(JSON.stringify({ ignored: true, status }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const ownerId: string | undefined = event.metadata?.owner_id ?? event.user_defined?.udf1;
  const plan: string = (event.metadata?.plan ?? event.user_defined?.udf2 ?? "starter").toLowerCase();
  const paymentId: string = String(event.id ?? event.tran_ref ?? crypto.randomUUID());
  const amountSar: number = Number(event.amount ?? event.cart_amount ?? 0);
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.starter;

  if (!ownerId) {
    await supabase.from("error_log").insert({
      source: "payment-webhook", error_code: "MISSING_OWNER",
      error_msg: "owner_id missing in webhook metadata", payload: event,
    });
    return new Response(JSON.stringify({ error: "owner_id required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const periodStart = new Date();
    const periodEnd   = new Date(Date.now() + 30 * 86_400_000);

    // ───── 3. Upgrade subscription ─────
    await supabase.from("subscriptions").upsert({
      owner_id: ownerId,
      plan,
      status: "active",
      max_assets:  limits.max_assets,
      max_devices: limits.max_devices,
      max_stables: limits.max_stables,
      price_sar:   limits.price_sar,
      billing_cycle: "monthly",
      current_period_start: periodStart.toISOString(),
      current_period_end:   periodEnd.toISOString(),
      notes: `Payment ID: ${paymentId}`,
    }, { onConflict: "owner_id" });

    // ───── 4. Payments log (idempotent on payment_id) ─────
    await supabase.from("payments_log").upsert({
      owner_id: ownerId,
      payment_id: paymentId,
      amount_sar: amountSar,
      plan,
      status: "paid",
      gateway: event.gateway ?? "clickpay",
      raw_payload: event,
      paid_at: new Date().toISOString(),
    }, { onConflict: "payment_id" });

    // ───── 5. In-app notification ─────
    await supabase.from("notifications").insert({
      owner_id: ownerId,
      type: "system",
      title: "تم تفعيل اشتراكك",
      body: `خطة ${plan} نشطة حتى ${periodEnd.toLocaleDateString("ar-SA")}`,
      metadata: { plan, payment_id: paymentId, period_end: periodEnd.toISOString() },
    });

    return new Response(JSON.stringify({ success: true, plan, period_end: periodEnd }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await supabase.from("error_log").insert({
      source: "payment-webhook", error_code: "PROCESS_FAILED",
      error_msg: msg, owner_id: ownerId, payload: event,
    });
    return new Response(JSON.stringify({ error: "processing failed" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
