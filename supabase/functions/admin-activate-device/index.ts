import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { z } from 'https://esm.sh/zod@3.23.8';

// L5: Security headers applied to every response.
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

const BodySchema = z.object({
  device_id: z.string().trim().min(1).max(128),
  owner_id: z.string().uuid(),
  asset_id: z.string().uuid().optional().nullable(),
  stable_id: z.string().uuid().optional().nullable(),
  device_type: z.enum(['collar', 'tag', 'implant', 'external']).optional(),
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
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

  // ── 3. Validate body ───────────────────────────────────
  let parsed;
  try {
    parsed = BodySchema.safeParse(await req.json());
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }
  if (!parsed.success) {
    return json({ error: parsed.error.flatten().fieldErrors }, 400);
  }
  const {
    device_id,
    owner_id,
    asset_id = null,
    stable_id = null,
    device_type = 'collar',
  } = parsed.data;

  // ── 4. Sanity: asset (if provided) must belong to owner ──
  if (asset_id) {
    const { data: a, error: aErr } = await admin
      .from('assets')
      .select('id, owner_id, stable_id')
      .eq('id', asset_id)
      .maybeSingle();
    if (aErr) {
      console.error("asset lookup error:", aErr);
      return json({ error: "Failed to verify asset" }, 500);
    }
    if (!a) return json({ error: 'Asset not found' }, 404);
    if (a.owner_id !== owner_id) {
      return json({ error: 'Asset does not belong to owner' }, 400);
    }
  }

  // ── 5. Upsert device ───────────────────────────────────
  const { data: device, error: devErr } = await admin
    .from('sensor_devices')
    .upsert(
      {
        device_id,
        owner_id,
        asset_id,
        stable_id,
        device_type,
        status: 'offline', // becomes 'online' on first reading via trigger
      },
      { onConflict: 'device_id' },
    )
    .select()
    .single();
  if (devErr) {
    console.error("device upsert error:", devErr);
    return json({ error: "Failed to register device" }, 500);
  }

  // ── 6. Link to asset ───────────────────────────────────
  if (asset_id) {
    const { error: linkErr } = await admin
      .from('assets')
      .update({ sensor_device_id: device_id })
      .eq('id', asset_id);
    if (linkErr) {
      console.error("asset link error:", linkErr);
      // Non-fatal: device was created; report partial success
      return json(
        { success: true, device, warning: "Asset link failed" },
        200,
      );
    }
  }

  // ── 7. Notify owner ────────────────────────────────────
  await admin.from('notifications').insert({
    owner_id,
    asset_id,
    type: 'system',
    title: 'تم تفعيل الجهاز',
    body: `الجهاز ${device_id} جاهز ومرتبط بحسابك`,
    metadata: { device_id, device_type },
  });

  return json({ success: true, device });
});
