// Scheduled (pg_cron) — marks sensor devices offline if no data >30min
// and emits a one-time notification per device (throttled 6h).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // SECURITY: cron-only. Reject anonymous callers so they cannot spam
  // owner notifications or distort device-status data.
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (!cronSecret || req.headers.get("x-cron-secret") !== cronSecret) {
    return new Response("Forbidden", { status: 403, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    // 1) Find devices that should be offline (no signal >30min, currently 'online')
    const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: stale, error: selErr } = await supabase
      .from("sensor_devices")
      .select("id, device_id, owner_id, asset_id, last_seen_at")
      .eq("status", "online")
      .or(`last_seen_at.is.null,last_seen_at.lt.${cutoff}`);

    if (selErr) throw selErr;

    let flipped = 0;
    let notified = 0;

    for (const d of stale ?? []) {
      // Flip to offline
      const { error: upErr } = await supabase
        .from("sensor_devices")
        .update({ status: "offline", updated_at: new Date().toISOString() })
        .eq("id", d.id);
      if (upErr) continue;
      flipped++;

      // Throttle: skip if a device_offline notification was created in the last 6h
      const sixHoursAgo = new Date(Date.now() - 6 * 3600 * 1000).toISOString();
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", d.owner_id)
        .eq("type", "device_offline")
        .contains("metadata", { device_id: d.device_id })
        .gte("created_at", sixHoursAgo);

      if ((count ?? 0) === 0) {
        await supabase.from("notifications").insert({
          owner_id: d.owner_id,
          asset_id: d.asset_id,
          type: "device_offline",
          title: "📡 جهاز متوقف عن الإرسال",
          body: `الجهاز ${d.device_id} لم يرسل بيانات منذ ${
            d.last_seen_at ? "أكثر من 30 دقيقة" : "وقت طويل"
          }. يرجى التحقق من الاتصال أو البطارية.`,
          metadata: {
            device_id: d.device_id,
            last_seen_at: d.last_seen_at,
            sensor_device_pk: d.id,
          },
        });
        notified++;
      }
    }

    return new Response(
      JSON.stringify({ ok: true, scanned: stale?.length ?? 0, flipped, notified }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // Best-effort error log
    await supabase.from("edge_function_errors").insert({
      function_name: "device-watchdog",
      error_message: msg,
      status_code: 500,
    });
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
