// Verifies a Moyasar payment by ID and, on success, activates the subscription.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const PLANS: Record<string, { price: number; max_assets: number; max_stables: number; max_devices: number; }> = {
  starter:    { price: 495, max_assets: 5,    max_stables: 1,    max_devices: 5 },
  pro:        { price: 695, max_assets: 20,   max_stables: 5,    max_devices: 20 },
  enterprise: { price: 995, max_assets: 9999, max_stables: 9999, max_devices: 9999 },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return jsonResp({ ok: false, error: "Unauthorized" }, 401);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) return jsonResp({ ok: false, error: "Unauthorized" }, 401);
    const userId = claims.claims.sub as string;

    const { payment_id } = await req.json();
    if (!payment_id) return jsonResp({ ok: false, error: "Missing payment_id" }, 400);

    const moyasarKey = Deno.env.get("MOYASAR_SECRET_KEY");
    if (!moyasarKey) return jsonResp({ ok: false, error: "Payment provider not configured" }, 503);

    const service = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Fetch invoice from Moyasar
    const res = await fetch(`https://api.moyasar.com/v1/invoices/${payment_id}`, {
      headers: { "Authorization": `Basic ${btoa(moyasarKey + ":")}` },
    });
    const inv = await res.json();
    if (!res.ok) return jsonResp({ ok: false, error: inv?.message || "Provider error" }, 502);

    if (inv.status !== "paid") {
      return jsonResp({ ok: false, error: `Payment status: ${inv.status}` }, 200);
    }

    const planId = inv?.metadata?.plan_id as string | undefined;
    const metaUserId = inv?.metadata?.user_id as string | undefined;
    if (!planId || !PLANS[planId]) return jsonResp({ ok: false, error: "Invalid plan in metadata" }, 400);
    if (metaUserId && metaUserId !== userId) return jsonResp({ ok: false, error: "User mismatch" }, 403);

    const plan = PLANS[planId];

    // Mark payment paid
    await service.from("payments")
      .update({ status: "paid", provider_tran_ref: inv.id, webhook_payload: inv })
      .eq("provider_payment_id", payment_id);

    // Activate subscription (upsert by owner_id — assume single subscription per owner)
    const periodStart = new Date();
    const periodEnd = new Date(periodStart);
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);

    const { data: existing } = await service
      .from("subscriptions")
      .select("id")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const subRow = {
      owner_id: userId,
      plan: planId,
      status: "active",
      billing_cycle: "yearly",
      price_sar: plan.price,
      max_assets: plan.max_assets,
      max_stables: plan.max_stables,
      max_devices: plan.max_devices,
      current_period_start: periodStart.toISOString(),
      current_period_end: periodEnd.toISOString(),
    };

    if (existing) {
      await service.from("subscriptions").update(subRow).eq("id", existing.id);
    } else {
      await service.from("subscriptions").insert(subRow);
    }

    return jsonResp({ ok: true, plan: planId });
  } catch (err) {
    console.error("verify-payment error:", err);
    return jsonResp({ ok: false, error: "An internal error occurred. Please try again." }, 500);
  }
});

function jsonResp(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
