// Scheduled (pg_cron, see migrations) — marks sensor devices offline if no
// data >30min, flags low-battery devices (<20%, matching the threshold used
// throughout the admin/device UI), and emits a throttled (6h) notification
// per device per condition.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const OFFLINE_CUTOFF_MS = 30 * 60 * 1000; // 30 minutes
const LOW_BATTERY_PCT = 20; // matches DevicesPage.jsx / DeviceHealthBox.jsx
const NOTIFY_THROTTLE_MS = 6 * 3600 * 1000; // 6 hours

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

  // Throttled notification insert: skip if the same type was already raised
  // for this device within NOTIFY_THROTTLE_MS. Returns true if it inserted.
  async function notifyOnce(d: { owner_id: string; asset_id: string | null; device_id: string }, type: string, title: string, body: string) {
    const since = new Date(Date.now() - NOTIFY_THROTTLE_MS).toISOString();
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", d.owner_id)
      .eq("type", type)
      .contains("metadata", { device_id: d.device_id })
      .gte("created_at", since);

    if ((count ?? 0) > 0) return false;

    const { error } = await supabase.from("notifications").insert({
      owner_id: d.owner_id,
      asset_id: d.asset_id,
      type,
      title,
      body,
      metadata: { device_id: d.device_id },
    });
    if (error) {
      await supabase.from("edge_function_errors").insert({
        function_name: "device-watchdog",
        error_message: `notify(${type}) failed: ${error.message}`,
        status_code: 500,
      });
      return false;
    }
    return true;
  }

  try {
    // 1) Offline detection: no signal >30min, currently 'online'.
    const offlineCutoff = new Date(Date.now() - OFFLINE_CUTOFF_MS).toISOString();
    const { data: stale, error: staleErr } = await supabase
      .from("sensor_devices")
      .select("id, device_id, owner_id, asset_id, last_seen_at")
      .eq("status", "online")
      .or(`last_seen_at.is.null,last_seen_at.lt.${offlineCutoff}`);
    if (staleErr) throw staleErr;

    let flippedOffline = 0;
    let notifiedOffline = 0;

    for (const d of stale ?? []) {
      const { error: upErr } = await supabase
        .from("sensor_devices")
        .update({ status: "offline", updated_at: new Date().toISOString() })
        .eq("id", d.id);
      if (upErr) continue;
      flippedOffline++;

      const sent = await notifyOnce(
        d,
        "device_offline",
        "📡 جهاز متوقف عن الإرسال",
        `الجهاز ${d.device_id} لم يرسل بيانات منذ ${d.last_seen_at ? "أكثر من 30 دقيقة" : "وقت طويل"}. يرجى التحقق من الاتصال أو البطارية.`,
      );
      if (sent) notifiedOffline++;
    }

    // 2) Low-battery detection: online/low_battery devices under the threshold
    // that aren't already flagged, so we notify exactly once on the way down.
    const { data: lowBattery, error: battErr } = await supabase
      .from("sensor_devices")
      .select("id, device_id, owner_id, asset_id, battery_pct, status")
      .lt("battery_pct", LOW_BATTERY_PCT)
      .in("status", ["online", "offline"]);
    if (battErr) throw battErr;

    let flippedLowBattery = 0;
    let notifiedLowBattery = 0;

    for (const d of lowBattery ?? []) {
      const { error: upErr } = await supabase
        .from("sensor_devices")
        .update({ status: "low_battery", updated_at: new Date().toISOString() })
        .eq("id", d.id);
      if (upErr) continue;
      flippedLowBattery++;

      const sent = await notifyOnce(
        d,
        "low_battery",
        "🔋 بطارية منخفضة",
        `بطارية الجهاز ${d.device_id} عند ${d.battery_pct}%. يرجى الشحن أو الاستبدال قريباً.`,
      );
      if (sent) notifiedLowBattery++;
    }

    // Record check in system_health_log for the admin panel
    await supabase.from("system_health_log").insert({
      check_type: "watchdog",
      devices_offline: flippedOffline,
      low_battery: flippedLowBattery,
      details: {
        scanned_offline: stale?.length ?? 0,
        notified_offline: notifiedOffline,
        scanned_low_battery: lowBattery?.length ?? 0,
        notified_low_battery: notifiedLowBattery,
      },
    });

    return new Response(
      JSON.stringify({
        ok: true,
        offline: { scanned: stale?.length ?? 0, flipped: flippedOffline, notified: notifiedOffline },
        low_battery: { scanned: lowBattery?.length ?? 0, flipped: flippedLowBattery, notified: notifiedLowBattery },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
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
