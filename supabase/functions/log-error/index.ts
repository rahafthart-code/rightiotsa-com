// Centralized backend error log. Inserts into edge_function_errors and on a
// burst (>5 in 15 min) raises a critical security_event AND emails the admin.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Body {
  function_name: string;
  error_message: string;
  error_stack?: string;
  context?: Record<string, unknown>;
  status_code?: number;
  user_id?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // SECURITY: require an authenticated Supabase user JWT. This prevents
  // unauthenticated callers from flooding edge_function_errors and triggering
  // unlimited admin alert emails (DoS / inbox flood).
  const authHeader = req.headers.get("Authorization") ?? "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Validate the bearer token resolves to a real user (service-role tokens are
  // also accepted because getUser() succeeds when called server-side with
  // them — but anonymous/forged tokens are rejected).
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = (await req.json()) as Body;
    if (!body?.function_name || !body?.error_message) {
      return new Response(JSON.stringify({ error: "missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const trimmed = (s?: string, n = 4000) => (s ? s.slice(0, n) : s);

    await supabase.from("edge_function_errors").insert({
      function_name: body.function_name,
      error_message: trimmed(body.error_message)!,
      error_stack: trimmed(body.error_stack, 8000),
      context: body.context ?? {},
      status_code: body.status_code ?? 500,
      user_id: body.user_id ?? null,
    });

    // Burst detection (>5 per 15 min)
    const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("edge_function_errors")
      .select("id", { count: "exact", head: true })
      .eq("function_name", body.function_name)
      .gte("created_at", since);

    if ((count ?? 0) > 5) {
      await supabase.rpc("log_security_event", {
        p_type: "edge_function_error_burst",
        p_severity: "critical",
        p_endpoint: body.function_name,
        p_details: { count, window_minutes: 15 },
      });

      // Email admin (rate-limited: only fire if last alert >30 min ago)
      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
      const ALERT_TO = Deno.env.get("ALERT_EMAIL_TO");
      const ALERT_FROM = Deno.env.get("ALERT_EMAIL_FROM") ?? "alerts@rightiotsa.com";

      if (RESEND_API_KEY && ALERT_TO) {
        const halfHourAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
        const { data: recentAlerts } = await supabase
          .from("security_events")
          .select("id")
          .eq("event_type", "edge_function_error_burst")
          .eq("endpoint", body.function_name)
          .gte("created_at", halfHourAgo)
          .limit(2);

        if ((recentAlerts?.length ?? 0) <= 1) {
          try {
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${RESEND_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: `Right IoT Alerts <${ALERT_FROM}>`,
                to: [ALERT_TO],
                subject: `🚨 Edge Function error burst: ${body.function_name}`,
                html: `
                  <h2 style="color:#b91c1c">Edge Function error burst detected</h2>
                  <p><b>Function:</b> ${body.function_name}</p>
                  <p><b>Errors in last 15 min:</b> ${count}</p>
                  <p><b>Latest error:</b><br/><code>${(body.error_message || "").slice(0, 400)}</code></p>
                  <p style="color:#666;font-size:12px">${new Date().toISOString()}</p>
                `,
              }),
            });
          } catch { /* swallow */ }
        }
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("log-error internal failure:", e);
    return new Response(
      JSON.stringify({ error: "An internal error occurred." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
