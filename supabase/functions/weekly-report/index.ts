// Weekly stable report generator.
//
// For every active stable, computes 7-day metrics (assets, devices, alerts,
// avg stability) and uploads a self-contained HTML report to the public
// `reports` bucket at:  <owner_id>/<stable_id>/<YYYY-MM-DD>.html
//
// Then inserts an in-app notification linking each owner to the new report(s).
// Triggered by a weekly pg_cron job (Sundays 05:00 UTC = 08:00 Asia/Riyadh).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Cache-Control': 'no-store',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function fmtDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function escapeHtml(s: unknown) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildReportHtml(opts: {
  stable: { id: string; name: string };
  range: { from: string; to: string };
  stats: {
    assetsTotal: number;
    assetsStable: number;
    assetsWarning: number;
    assetsDanger: number;
    devicesOnline: number;
    devicesTotal: number;
    avgStability: number | null;
    alertsCount: number;
    zoneBreaches: number;
  };
}) {
  const { stable, range, stats } = opts;
  const stab = stats.avgStability == null ? '—' : stats.avgStability.toFixed(1);
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<title>تقرير أسبوعي · ${escapeHtml(stable.name)}</title>
<style>
  body { font-family: 'Cairo', 'Tajawal', system-ui, sans-serif; background:#faf7f0; color:#1a1a1a; margin:0; padding:24px; }
  .wrap { max-width: 760px; margin: 0 auto; background:#fff; border:1px solid #e7e2d4; border-radius:16px; overflow:hidden; }
  header { background:#006c35; color:#fff; padding:20px 24px; }
  header h1 { margin:0 0 4px; font-size:20px; }
  header .sub { font-size:12px; color:#d4af37; }
  .grid { display:grid; grid-template-columns: repeat(2, 1fr); gap:12px; padding:20px 24px; }
  .card { background:#faf7f0; border:1px solid #e7e2d4; border-radius:12px; padding:14px; }
  .card .lbl { font-size:11px; color:#8b8273; }
  .card .val { font-size:22px; font-weight:bold; margin-top:4px; color:#006c35; }
  .row { display:flex; gap:8px; flex-wrap:wrap; padding:8px 24px 24px; }
  .pill { font-size:12px; padding:4px 10px; border-radius:99px; font-weight:bold; }
  .stable { background:rgba(34,197,94,0.15); color:#166534; }
  .warn { background:rgba(245,158,11,0.15); color:#92400e; }
  .danger { background:rgba(239,68,68,0.15); color:#991b1b; }
  footer { padding:14px 24px; font-size:11px; color:#8b8273; border-top:1px solid #e7e2d4; }
</style>
</head>
<body>
  <div class="wrap">
    <header>
      <h1>${escapeHtml(stable.name)}</h1>
      <div class="sub">تقرير أسبوعي · ${escapeHtml(range.from)} → ${escapeHtml(range.to)}</div>
    </header>
    <div class="grid">
      <div class="card"><div class="lbl">إجمالي الأصول</div><div class="val">${stats.assetsTotal}</div></div>
      <div class="card"><div class="lbl">متوسط الاستقرار</div><div class="val">${stab}</div></div>
      <div class="card"><div class="lbl">الأجهزة المتصلة</div><div class="val">${stats.devicesOnline} / ${stats.devicesTotal}</div></div>
      <div class="card"><div class="lbl">عدد التنبيهات</div><div class="val">${stats.alertsCount}</div></div>
    </div>
    <div class="row">
      <span class="pill stable">مستقر · ${stats.assetsStable}</span>
      <span class="pill warn">تحذير · ${stats.assetsWarning}</span>
      <span class="pill danger">خطر · ${stats.assetsDanger}</span>
      <span class="pill warn">خروج من النطاق · ${stats.zoneBreaches}</span>
    </div>
    <footer>تم إنشاء هذا التقرير تلقائياً بواسطة منصة InsurTech.</footer>
  </div>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // SECURITY: cron-only. Reject anonymous callers.
  const cronSecret = Deno.env.get('CRON_SECRET');
  if (!cronSecret || req.headers.get('x-cron-secret') !== cronSecret) {
    return new Response('Forbidden', { status: 403, headers: corsHeaders });
  }

  const startedAt = new Date();
  const weekAgo = new Date(startedAt.getTime() - 7 * 24 * 3600 * 1000);
  const range = { from: fmtDate(weekAgo), to: fmtDate(startedAt) };
  const dateLabel = fmtDate(startedAt);

  try {
    // Load all active stables
    const { data: stables, error: stErr } = await admin
      .from('stables')
      .select('id, name, owner_id')
      .eq('is_active', true);
    if (stErr) throw stErr;
    if (!stables || stables.length === 0) {
      return new Response(JSON.stringify({ ok: true, generated: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Group reports per owner so we can send a single notification
    const ownerReports = new Map<string, { stableName: string; url: string }[]>();
    let generated = 0;
    const errors: { stable_id: string; error: string }[] = [];

    for (const st of stables) {
      try {
        // Assets in this stable
        const { data: assets } = await admin
          .from('assets')
          .select('id, status, stability_index')
          .eq('stable_id', st.id)
          .eq('is_active', true);

        // Devices in this stable
        const { data: devices } = await admin
          .from('sensor_devices')
          .select('id, status')
          .eq('stable_id', st.id);

        // Notifications (alerts) for assets in this stable, last 7 days
        const assetIds = (assets || []).map((a) => a.id);
        let alertsCount = 0;
        let zoneBreaches = 0;
        if (assetIds.length) {
          const { count: aCount } = await admin
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .in('asset_id', assetIds)
            .gte('created_at', weekAgo.toISOString());
          alertsCount = aCount ?? 0;

          const { count: zCount } = await admin
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .in('asset_id', assetIds)
            .eq('type', 'zone_breach')
            .gte('created_at', weekAgo.toISOString());
          zoneBreaches = zCount ?? 0;
        }

        const stabilityVals = (assets || [])
          .map((a) => Number(a.stability_index))
          .filter((n) => Number.isFinite(n));
        const avg = stabilityVals.length
          ? stabilityVals.reduce((s, v) => s + v, 0) / stabilityVals.length
          : null;

        const stats = {
          assetsTotal: assets?.length ?? 0,
          assetsStable: (assets || []).filter((a) => a.status === 'stable').length,
          assetsWarning: (assets || []).filter((a) => a.status === 'warning').length,
          assetsDanger: (assets || []).filter((a) => a.status === 'danger').length,
          devicesTotal: devices?.length ?? 0,
          devicesOnline: (devices || []).filter((d) => d.status === 'online').length,
          avgStability: avg,
          alertsCount,
          zoneBreaches,
        };

        const html = buildReportHtml({
          stable: { id: st.id, name: st.name },
          range,
          stats,
        });

        // Path: <owner_id>/<stable_id>/<YYYY-MM-DD>.html  (matches RLS policy)
        const path = `${st.owner_id}/${st.id}/${dateLabel}.html`;
        const { error: upErr } = await admin.storage
          .from('reports')
          .upload(path, new Blob([html], { type: 'text/html; charset=utf-8' }), {
            upsert: true,
            contentType: 'text/html; charset=utf-8',
          });
        if (upErr) throw upErr;

        // Private bucket: generate a signed URL valid for 7 days
        const { data: signed, error: signErr } = await admin.storage
          .from('reports')
          .createSignedUrl(path, 60 * 60 * 24 * 7);
        if (signErr) throw signErr;
        generated += 1;

        const list = ownerReports.get(st.owner_id) ?? [];
        list.push({ stableName: st.name, url: signed.signedUrl, path });
        ownerReports.set(st.owner_id, list);
      } catch (e) {
        errors.push({
          stable_id: st.id,
          error: (e as Error).message ?? String(e),
        });
      }
    }

    // One notification per owner summarizing the week's reports
    for (const [ownerId, list] of ownerReports) {
      const title =
        list.length === 1
          ? `📊 التقرير الأسبوعي · ${list[0].stableName}`
          : `📊 التقارير الأسبوعية (${list.length} عزب)`;
      const body =
        list.length === 1
          ? `تقريرك الأسبوعي للفترة ${range.from} → ${range.to} جاهز.`
          : `تقاريرك الأسبوعية لـ ${list.length} عزب جاهزة.`;
      await admin.from('notifications').insert({
        owner_id: ownerId,
        type: 'system',
        title,
        body,
        metadata: {
          kind: 'weekly_report',
          range,
          reports: list,
        },
      });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        generated,
        owners_notified: ownerReports.size,
        errors,
        range,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ ok: false, error: (e as Error).message ?? String(e) }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
