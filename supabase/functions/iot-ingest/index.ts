// IoT data ingestion endpoint
// Devices POST sensor readings here with header: X-Device-Api-Key
// No JWT required (devices aren't users). Auth is via API key per device.
// The reading is forwarded to the `calculate_stability` SQL function which
// inserts into sensor_readings; triggers compute vital/env/stability scores,
// update asset status (stable ≥85, warning 70-84, danger <70) and create alerts.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-device-api-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// SHA-256 hex helper
async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Haversine distance in km
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface ReadingPayload {
  recorded_at?: string;
  // GPS — accept both naming styles
  latitude?: number;
  longitude?: number;
  gps_lat?: number;
  gps_lng?: number;
  // Vitals
  heart_rate?: number;
  temperature?: number;
  respiration?: number;
  respiration_rate?: number;
  activity?: number;
  activity_score?: number;
  // Environment
  env_temp?: number;
  env_humidity?: number;
  // Device telemetry
  battery_level?: number;
  signal_strength?: number;
  raw?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const apiKey = req.headers.get("x-device-api-key");
    if (!apiKey || apiKey.length < 16) {
      return new Response(JSON.stringify({ error: "Missing or invalid X-Device-Api-Key" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json().catch(() => null)) as ReadingPayload | null;
    if (!body || typeof body !== "object") {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const apiKeyHash = await sha256Hex(apiKey);

    const { data: device, error: deviceErr } = await supabase
      .from("devices")
      .select("id, asset_id, owner_id, is_active")
      .eq("api_key_hash", apiKeyHash)
      .maybeSingle();

    if (deviceErr || !device || !device.is_active || !device.asset_id) {
      return new Response(JSON.stringify({ error: "Unauthorized device" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normalize incoming fields
    const lat = body.gps_lat ?? body.latitude ?? null;
    const lng = body.gps_lng ?? body.longitude ?? null;
    const respiration = body.respiration_rate ?? body.respiration ?? null;
    const activity = body.activity_score ?? body.activity ?? null;

    // Geofence check (optional — DB also recomputes via compute_stability_v2)
    let isInZone = true;
    const { data: assetGeo } = await supabase
      .from("assets")
      .select("geofence_lat, geofence_lng, geofence_radius_km")
      .eq("id", device.asset_id)
      .maybeSingle();

    if (
      assetGeo?.geofence_lat != null &&
      assetGeo?.geofence_lng != null &&
      lat != null &&
      lng != null
    ) {
      const dist = haversineKm(lat, lng, assetGeo.geofence_lat, assetGeo.geofence_lng);
      isInZone = dist <= Number(assetGeo.geofence_radius_km ?? 5);
    }

    // Forward to SQL function — triggers handle stability, smoothing, alerts.
    const { data: result, error: calcErr } = await supabase.rpc("calculate_stability", {
      p_asset_id: device.asset_id,
      p_heart_rate: body.heart_rate ?? null,
      p_temperature: body.temperature ?? null,
      p_resp_rate: respiration,
      p_activity: activity,
      p_gps_lat: lat,
      p_gps_lng: lng,
      p_env_temp: body.env_temp ?? null,
      p_in_zone: isInZone,
    });

    if (calcErr) {
      console.error("calculate_stability error:", calcErr);
      return new Response(JSON.stringify({ error: "Failed to save reading" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update device telemetry snapshot
    await supabase
      .from("devices")
      .update({
        battery_level: body.battery_level ?? undefined,
        signal_strength: body.signal_strength ?? undefined,
        last_seen_at: new Date().toISOString(),
      })
      .eq("id", device.id);

    return new Response(JSON.stringify({ ok: true, asset_id: device.asset_id, result }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("iot-ingest error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
