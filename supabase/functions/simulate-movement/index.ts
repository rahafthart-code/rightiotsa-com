// Live-demo GPS simulation. Admin-only. For each active device (optionally
// scoped to an owner or a single asset), takes the asset's last sensor
// reading, jitters the GPS position, drains the device battery slightly,
// and inserts a new reading via the same `calculate_stability` RPC that
// real IoT devices use (iot-ingest) — so stability/geofence/alert triggers
// stay consistent instead of a hand-rolled insert path.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { z } from 'https://esm.sh/zod@3.23.8';

// L5: Security headers applied to every response (mirrors admin-activate-device).
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

const BodySchema = z
  .object({
    owner_id: z.string().uuid().optional().nullable(),
    asset_id: z.string().uuid().optional().nullable(),
  })
  .optional()
  .nullable();

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Random float in [min, max]
function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

// Small GPS jitter: 0.001–0.005 degrees (~100–500m), random direction.
function jitterDegrees(): number {
  const magnitude = rand(0.001, 0.005);
  return Math.random() < 0.5 ? -magnitude : magnitude;
}

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  // ── 1. Authenticate caller ─────────────────────────────
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return json({ error: 'Unauthorized' }, 401);
  }
  const token = authHeader.replace('Bearer ', '');

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: claimsRes, error: claimsErr } =
    await userClient.auth.getClaims(token);
  if (claimsErr || !claimsRes?.claims) {
    return json({ error: 'Unauthorized' }, 401);
  }
  const callerId = claimsRes.claims.sub as string;

  // ── 2. Authorize: must be admin (project uses user_roles table) ──
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: roleRow, error: roleErr } = await admin
    .from('user_roles')
    .select('role')
    .eq('user_id', callerId)
    .eq('role', 'admin')
    .maybeSingle();
  if (roleErr) return json({ error: 'Role check failed' }, 500);
  if (!roleRow) return json({ error: 'Forbidden' }, 403);

  // ── 3. Validate body (optional scoping filters) ────────
  let parsed;
  try {
    const raw = await req.text();
    parsed = BodySchema.safeParse(raw ? JSON.parse(raw) : null);
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }
  if (!parsed.success) {
    return json({ error: parsed.error.flatten().fieldErrors }, 400);
  }
  const { owner_id = null, asset_id = null } = parsed.data || {};

  // ── 4. Find active devices linked to an asset (scope optional) ──
  let deviceQuery = admin
    .from('devices')
    .select('id, asset_id, owner_id, battery_level')
    .eq('is_active', true)
    .not('asset_id', 'is', null);
  if (owner_id) deviceQuery = deviceQuery.eq('owner_id', owner_id);
  if (asset_id) deviceQuery = deviceQuery.eq('asset_id', asset_id);

  const { data: devices, error: devErr } = await deviceQuery;
  if (devErr) {
    console.error('device lookup error:', devErr);
    return json({ error: 'Failed to load devices' }, 500);
  }
  if (!devices || devices.length === 0) {
    return json({ ok: true, updated_count: 0, animals: [] });
  }

  const animals: Array<{
    animal: string;
    asset_id: string;
    new_location: { lat: number; lng: number };
    battery: number | null;
    status: string | null;
  }> = [];

  for (const device of devices) {
    // Latest reading for this asset — movement is simulated from the last
    // known position; vitals are carried forward unchanged.
    const { data: lastReading } = await admin
      .from('sensor_readings')
      .select(
        'latitude, longitude, heart_rate, temperature, respiration_rate, activity_score, env_temp',
      )
      .eq('asset_id', device.asset_id)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!lastReading || lastReading.latitude == null || lastReading.longitude == null) {
      continue; // nothing to move from yet
    }

    const newLat = lastReading.latitude + jitterDegrees();
    const newLng = lastReading.longitude + jitterDegrees();

    // Geofence check (same approach as iot-ingest).
    let isInZone = true;
    const { data: assetRow } = await admin
      .from('assets')
      .select('name, geofence_lat, geofence_lng, geofence_radius_km')
      .eq('id', device.asset_id)
      .maybeSingle();

    if (assetRow?.geofence_lat != null && assetRow?.geofence_lng != null) {
      const dist = haversineKm(newLat, newLng, assetRow.geofence_lat, assetRow.geofence_lng);
      isInZone = dist <= Number(assetRow.geofence_radius_km ?? 5);
    }

    const { data: result, error: calcErr } = await admin.rpc('calculate_stability', {
      p_asset_id: device.asset_id,
      p_heart_rate: lastReading.heart_rate,
      p_temperature: lastReading.temperature,
      p_resp_rate: lastReading.respiration_rate,
      p_activity: lastReading.activity_score,
      p_gps_lat: newLat,
      p_gps_lng: newLng,
      p_env_temp: lastReading.env_temp,
      p_in_zone: isInZone,
    });

    if (calcErr) {
      console.error('calculate_stability error:', calcErr, 'asset_id:', device.asset_id);
      continue;
    }

    // Battery drains slowly, same as a real device telemetry snapshot update.
    const newBattery = Math.max(10, (device.battery_level ?? 100) - Math.floor(rand(0, 3)));
    await admin
      .from('devices')
      .update({ battery_level: newBattery, last_seen_at: new Date().toISOString() })
      .eq('id', device.id);

    animals.push({
      animal: assetRow?.name || device.asset_id,
      asset_id: device.asset_id,
      new_location: { lat: newLat, lng: newLng },
      battery: newBattery,
      status: (result as { status?: string } | null)?.status ?? null,
    });
  }

  return json({ ok: true, updated_count: animals.length, animals });
});
