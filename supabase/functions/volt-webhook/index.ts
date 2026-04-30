// VOLT IoT bridge webhook — receives bulk sensor readings from the
// edge gateway authenticated by a single shared VOLT_API_KEY.
// Differs from /iot-ingest (which is per-device): this is the trusted
// upstream relay. Each event must include `device_serial` so we can
// resolve the asset internally.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  corsHeaders, securityHeaders,
  secureError, secureResponse,
  clientIp, logSecurityEvent, checkRequestSize,
} from "../_shared/security.ts";
import { checkRateLimit } from "../_shared/rate-limiter.ts";

const service = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

interface VoltReading {
  device_serial: string;
  recorded_at?: string;
  heart_rate?: number;
  temperature?: number;
  respiration_rate?: number;
  activity_score?: number;
  gps_lat?: number; gps_lng?: number;
  latitude?: number; longitude?: number;
  env_temp?: number; env_humidity?: number;
  battery_level?: number; signal_strength?: number;
}

interface VoltPayload {
  readings?: VoltReading[];
  reading?: VoltReading;
}

function haversineKm(la1: number, lo1: number, la2: number, lo2: number) {
  const R = 6371;
  const dLat = ((la2 - la1) * Math.PI) / 180;
  const dLng = ((lo2 - lo1) * Math.PI) / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(la1*Math.PI/180)*Math.cos(la2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return secureError(405, "Method not allowed");

  const sizeCheck = checkRequestSize(req, 5);
  if (sizeCheck) return sizeCheck;

  // L2 — shared-secret auth
  const incomingKey = req.headers.get("x-volt-api-key") || req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const expected = Deno.env.get("VOLT_API_KEY");
  if (!expected) return secureError(500, "VOLT_API_KEY not configured");
  if (!incomingKey || incomingKey !== expected) {
    await logSecurityEvent(service, {
      type: "volt_auth_failure", severity: "high",
      endpoint: "volt-webhook", details: { ip: clientIp(req) },
    });
    return secureError(401, "Invalid VOLT API key");
  }

  // L3 — rate limit per IP
  const ip = clientIp(req);
  const rl = await checkRateLimit("iot_ingest", `volt:${ip}`);
  if (rl) return rl;

  let body: VoltPayload;
  try { body = await req.json(); }
  catch { return secureError(400, "Invalid JSON"); }

  const readings = body.readings || (body.reading ? [body.reading] : []);
  if (!readings.length) return secureError(400, "No readings provided");

  const results: any[] = [];
  for (const r of readings) {
    if (!r?.device_serial) {
      results.push({ ok: false, error: "missing device_serial" });
      continue;
    }

    // Resolve device → asset
    const { data: device } = await service
      .from("devices")
      .select("id, asset_id, owner_id, is_active")
      .eq("device_serial", r.device_serial)
      .maybeSingle();

    const lat = r.gps_lat ?? r.latitude ?? null;
    const lng = r.gps_lng ?? r.longitude ?? null;

    // Always log raw event
    const { data: evt } = await service.from("iot_webhook_events").insert({
      source: "volt",
      device_serial: r.device_serial,
      asset_id: device?.asset_id ?? null,
      payload: r as any,
      status: device?.is_active && device.asset_id ? "received" : "unknown_device",
      ip_address: ip === "unknown" ? null : ip,
    }).select("id").single();

    if (!device || !device.is_active || !device.asset_id) {
      results.push({ device_serial: r.device_serial, ok: false, error: "unknown or inactive device" });
      continue;
    }

    // Geofence check
    let inZone = true;
    const { data: assetGeo } = await service
      .from("assets")
      .select("geofence_lat, geofence_lng, geofence_radius_km")
      .eq("id", device.asset_id).maybeSingle();
    if (assetGeo?.geofence_lat != null && lat != null && lng != null) {
      const d = haversineKm(lat, lng, assetGeo.geofence_lat, assetGeo.geofence_lng!);
      inZone = d <= Number(assetGeo.geofence_radius_km ?? 5);
    }

    const { data: calcRes, error: calcErr } = await service.rpc("calculate_stability", {
      p_asset_id: device.asset_id,
      p_heart_rate: r.heart_rate ?? null,
      p_temperature: r.temperature ?? null,
      p_resp_rate: r.respiration_rate ?? null,
      p_activity: r.activity_score ?? null,
      p_gps_lat: lat, p_gps_lng: lng,
      p_env_temp: r.env_temp ?? null,
      p_in_zone: inZone,
    });

    if (calcErr) {
      await service.from("iot_webhook_events").update({
        status: "error", error_message: calcErr.message,
      }).eq("id", evt?.id);
      results.push({ device_serial: r.device_serial, ok: false, error: calcErr.message });
      continue;
    }

    await service.from("devices").update({
      battery_level: r.battery_level ?? undefined,
      signal_strength: r.signal_strength ?? undefined,
      last_seen_at: new Date().toISOString(),
    }).eq("id", device.id);

    await service.from("iot_webhook_events").update({ status: "processed" }).eq("id", evt?.id);
    results.push({ device_serial: r.device_serial, ok: true, asset_id: device.asset_id, result: calcRes });
  }

  return secureResponse({ ok: true, processed: results.length, results });
});
