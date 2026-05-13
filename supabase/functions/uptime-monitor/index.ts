// Uptime monitor: pings critical endpoints, logs failures into edge_function_errors,
// and emails the admin via Resend when something is down. Triggered by pg_cron every 5 min.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TARGETS = ["secure-otp", "iot-ingest", "log-error"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const ALERT_TO = Deno.env.get("ALERT_EMAIL_TO");
  const ALERT_FROM = Deno.env.get("ALERT_EMAIL_FROM") ?? "alerts@rightiotsa.com";

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const results: Record<string, { status: number; ok: boolean; ms: number }> = {};
  const failures: { name: string; status: number }[] = [];

  for (const name of TARGETS) {
    const url = `${SUPABASE_URL}/functions/v1/${name}`;
    const t0 = Date.now();
    let status = 0;
    try {
      const r = await fetch(url, {
        method: "OPTIONS",
        headers: { Authorization: `Bearer ${SERVICE_KEY}` },
      });
      status = r.status;
    } catch {
      status = 0;
    }
    const ms = Date.now() - t0;
    const ok = status > 0 && status < 500;
    results[name] = { status, ok, ms };
    if (!ok) failures.push({ name, status });
  }

  if (failures.length > 0) {
    // Persist to errors table
    await supabase.from("edge_function_errors").insert(
      failures.map((f) => ({
        function_name: f.name,
        error_message: `Uptime check failed (status ${f.status})`,
        status_code: f.status,
        context: { source: "uptime-monitor" },
      })),
    );

    // Send admin email
    if (RESEND_API_KEY && ALERT_TO) {
      const html = `
        <h2 style="color:#b91c1c">⚠️ Right IoT — Uptime Alert</h2>
        <p>The following Edge Function(s) failed health check:</p>
        <ul>${failures.map((f) => `<li><b>${f.name}</b> — HTTP ${f.status || "no response"}</li>`).join("")}</ul>
        <p style="color:#666;font-size:12px">Time: ${new Date().toISOString()}</p>
      `;
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
            subject: `🚨 Uptime alert: ${failures.length} function(s) down`,
            html,
          }),
        });
      } catch {
        /* swallow */
      }
    }
  }

  return new Response(
    JSON.stringify({ checked_at: new Date().toISOString(), results, failures }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
