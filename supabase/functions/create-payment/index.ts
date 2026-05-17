// Creates a Moyasar payment session for a subscription plan.
// Returns a hosted payment URL the user is redirected to.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const PLANS: Record<string, { price: number; max_assets: number; max_stables: number; max_devices: number; }> = {
  starter:    { price: 495, max_assets: 5,    max_stables: 1,    max_devices: 5 },
  pro:        { price: 695, max_assets: 20,   max_stables: 5,    max_devices: 20 },
  enterprise: { price: 995, max_assets: 9999, max_stables: 9999, max_devices: 9999 },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonResp({ error: "Unauthorized" }, 401);
    }
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) {
      return jsonResp({ error: "Unauthorized" }, 401);
    }
    const userId = claims.claims.sub as string;

    const { plan_id } = await req.json();
    const plan = PLANS[plan_id];
    if (!plan) return jsonResp({ error: "Invalid plan_id" }, 400);

    const moyasarKey = Deno.env.get("MOYASAR_SECRET_KEY");
    if (!moyasarKey) {
      return jsonResp({ requires_setup: true, error: "Payment provider not configured" }, 200);
    }

    const service = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const cartId = crypto.randomUUID();

    const origin = req.headers.get("origin") || "https://rightiotsa.com";
    const callbackUrl = `${origin}/dashboard?payment=success&cart_id=${cartId}`;

    // Create Moyasar Invoice (hosted payment page)
    const moyasarRes = await fetch("https://api.moyasar.com/v1/invoices", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${btoa(moyasarKey + ":")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        amount: String(plan.price * 100), // halalas
        currency: "SAR",
        description: `Right ${plan_id} plan`,
        callback_url: callbackUrl,
        "metadata[user_id]": userId,
        "metadata[plan_id]": plan_id,
        "metadata[cart_id]": cartId,
      }),
    });

    const moyasarData = await moyasarRes.json();
    if (!moyasarRes.ok) {
      console.error("Moyasar invoice creation failed:", moyasarData);
      return jsonResp({ error: moyasarData?.message || "Provider error" }, 502);
    }

    // Persist a pending payment row
    await service.from("payments").insert({
      owner_id: userId,
      plan: plan_id,
      amount: plan.price,
      currency: "SAR",
      cart_id: cartId,
      provider: "moyasar",
      status: "pending",
      provider_payment_id: moyasarData.id,
      payment_url: moyasarData.url,
      metadata: { invoice: moyasarData },
    });

    return jsonResp({ payment_url: moyasarData.url, invoice_id: moyasarData.id });
  } catch (err) {
    console.error("create-payment error:", err);
    return jsonResp({ error: "An internal error occurred. Please try again." }, 500);
  }
});

function jsonResp(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
