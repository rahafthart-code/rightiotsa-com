// Create a ClickPay hosted payment page for a subscription plan.
// Authenticated; uses the user's profile for cardholder info.
// L2 (auth) + L3 (rate limit) + L4 (validation) + L5 (security headers) + L7 (logging).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  handlePreflight,
  secureError,
  secureResponse,
  verifyAuth,
  clientIp,
  logSecurityEvent,
  checkRequestSize,
} from "../_shared/security.ts";
import { checkRateLimit } from "../_shared/rate-limiter.ts";
import { safeJson, sanitizeText } from "../_shared/validators.ts";

const PLANS: Record<string, { amount: number; max_assets: number; max_devices: number; max_stables: number }> = {
  starter:   { amount: 99,   max_assets: 5,   max_devices: 5,   max_stables: 1 },
  pro:       { amount: 299,  max_assets: 25,  max_devices: 25,  max_stables: 5 },
  business:  { amount: 999,  max_assets: 200, max_devices: 200, max_stables: 25 },
};

interface ReqBody {
  plan?: string;
  billing_cycle?: "monthly" | "yearly";
}

Deno.serve(async (req) => {
  const pre = handlePreflight(req);
  if (pre) return pre;

  if (req.method !== "POST") return secureError(405, "Method not allowed");

  const sizeCheck = checkRequestSize(req, 1);
  if (sizeCheck) return sizeCheck;

  const auth = await verifyAuth(req);
  if (auth instanceof Response) return auth;

  const ip = clientIp(req);
  const rl = await checkRateLimit("login_attempt", `clickpay:${auth.user.id}:${ip}`);
  if (rl) return rl;

  let body: ReqBody;
  try {
    body = await safeJson<ReqBody>(req, 2 * 1024);
  } catch (e) {
    return secureError(400, (e as Error).message);
  }

  const planKey = sanitizeText(body.plan ?? "starter", 32).toLowerCase();
  const cycle = body.billing_cycle === "yearly" ? "yearly" : "monthly";
  const plan = PLANS[planKey];
  if (!plan) return secureError(400, `Unknown plan: ${planKey}`);

  const amount = cycle === "yearly" ? plan.amount * 10 : plan.amount;

  const profileId = Deno.env.get("CLICKPAY_PROFILE_ID");
  const serverKey = Deno.env.get("CLICKPAY_SERVER_KEY");
  const region = Deno.env.get("CLICKPAY_REGION") || "SAU";
  if (!profileId || !serverKey) {
    return secureError(500, "ClickPay credentials not configured");
  }

  // Profile lookup for cardholder info
  const { data: profile } = await auth.service
    .from("profiles")
    .select("full_name, phone")
    .eq("user_id", auth.user.id)
    .maybeSingle();

  const cartId = `right_${auth.user.id.slice(0, 8)}_${Date.now()}`;
  const callbackBase = Deno.env.get("SUPABASE_URL")!.replace(".supabase.co", ".functions.supabase.co/v1");
  const siteOrigin = req.headers.get("origin") || "https://rightiotsa.com";

  // ClickPay endpoint: regional. SAU → secure.clickpay.com.sa
  const clickPayUrl = region === "SAU"
    ? "https://secure.clickpay.com.sa/payment/request"
    : "https://secure-egypt.clickpay.com/payment/request";

  const payload = {
    profile_id: Number(profileId),
    tran_type: "sale",
    tran_class: "ecom",
    cart_id: cartId,
    cart_currency: "SAR",
    cart_amount: amount,
    cart_description: `Right IoT — خطة ${planKey} (${cycle === "yearly" ? "سنوي" : "شهري"})`,
    paypage_lang: "ar",
    callback: `${callbackBase}/clickpay-webhook`,
    return: `${siteOrigin}/dashboard?payment=success&cart=${cartId}`,
    customer_details: {
      name: profile?.full_name || "Right Customer",
      email: auth.user.email || "no-reply@rightiotsa.com",
      phone: profile?.phone || "",
      street1: "N/A",
      city: "Riyadh",
      state: "Riyadh",
      country: "SA",
      zip: "00000",
    },
    user_defined: {
      udf1: auth.user.id,
      udf2: planKey,
      udf3: cycle,
    },
  };

  let providerResp: any;
  try {
    const r = await fetch(clickPayUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": serverKey,
      },
      body: JSON.stringify(payload),
    });
    providerResp = await r.json();
    if (!r.ok || !providerResp?.redirect_url) {
      console.error("ClickPay error:", providerResp);
      await logSecurityEvent(auth.service, {
        type: "payment_init_failed", severity: "high",
        userId: auth.user.id, endpoint: "create-clickpay-payment",
        details: { provider: providerResp },
      });
      return secureError(502, "Payment provider error");
    }
  } catch (err) {
    console.error("ClickPay request failed:", err);
    return secureError(502, "Payment provider unreachable");
  }

  // Persist pending payment
  await auth.service.from("payments").insert({
    owner_id: auth.user.id,
    provider: "clickpay",
    provider_tran_ref: providerResp.tran_ref,
    cart_id: cartId,
    plan: planKey,
    amount,
    currency: "SAR",
    status: "pending",
    payment_url: providerResp.redirect_url,
  });

  await logSecurityEvent(auth.service, {
    type: "payment_initiated", severity: "low",
    userId: auth.user.id, endpoint: "create-clickpay-payment",
    details: { plan: planKey, cycle, amount, cart_id: cartId },
  });

  return secureResponse({
    payment_url: providerResp.redirect_url,
    cart_id: cartId,
    tran_ref: providerResp.tran_ref,
  });
});
