// IoT data ingestion endpoint
// Devices POST sensor readings here with header: X-Device-Api-Key
// No JWT required (devices aren't users). Auth is via API key per device.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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

interface ReadingPayload {
  recorded_at?: string;
  latitude?: number;
  longitude?: number;
  stability_score?: number;
  temperature?: number;
  heart_rate?: number;
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

    if (deviceErr || !device || !device.is_active) {
      return new Response(JSON.stringify({ error: "Unauthorized device" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const reading = {
      device_id: device.id,
      asset_id: device.asset_id,
      recorded_at: body.recorded_at ?? new Date().toISOString(),
      latitude: body.latitude ?? null,
      longitude: body.longitude ?? null,
      stability_score: body.stability_score ?? null,
      temperature: body.temperature ?? null,
      heart_rate: body.heart_rate ?? null,
      battery_level: body.battery_level ?? null,
      signal_strength: body.signal_strength ?? null,
      raw_payload: body.raw ?? null,
    };

    const { error: insertErr } = await supabase.from("sensor_readings").insert(reading);
    if (insertErr) {
      console.error("Insert reading error:", insertErr);
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

    return new Response(JSON.stringify({ ok: true }), {
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
