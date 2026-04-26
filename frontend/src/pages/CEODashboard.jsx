import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

/**
 * CEO View — Panoramic snapshot of insured asset value + overall herd stability.
 * Realtime: subscribes to sensor_readings and assets so KPIs refresh as new IoT
 * data arrives (the stability_score is computed server-side by the
 * compute_stability(60/40) function via a BEFORE INSERT trigger).
 */
export default function CEODashboard() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const navigate = useNavigate();

  const [assets, setAssets] = useState([]);
  const [latestByAsset, setLatestByAsset] = useState({}); // assetId -> latest reading
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pulse, setPulse] = useState(false); // realtime flash

  const flashPulse = () => {
    setPulse(true);
    setTimeout(() => setPulse(false), 700);
  };

  const loadAll = useCallback(async () => {
    try {
      setError(null);
      const [{ data: assetRows, error: aErr }, { data: deviceRows, error: dErr }] = await Promise.all([
        supabase
          .from('assets')
          .select('id, name, species, insured_value, stable_id, image_url, geofence_lat, geofence_lng, geofence_radius_km'),
        supabase
          .from('devices')
          .select('id, asset_id, battery_level, signal_strength, network_type, last_seen_at, is_active'),
      ]);
      if (aErr) throw aErr;
      if (dErr) throw dErr;
      setAssets(assetRows ?? []);
      setDevices(deviceRows ?? []);

      // Latest reading per asset (1 query, then group client-side)
      const ids = (assetRows ?? []).map((a) => a.id);
      if (ids.length > 0) {
        const { data: readings, error: rErr } = await supabase
          .from('sensor_readings')
          .select('asset_id, recorded_at, stability_score, temperature, latitude, longitude, battery_level, signal_strength')
          .in('asset_id', ids)
          .order('recorded_at', { ascending: false })
          .limit(1000);
        if (rErr) throw rErr;
        const map = {};
        for (const r of readings ?? []) {
          if (!map[r.asset_id]) map[r.asset_id] = r;
        }
        setLatestByAsset(map);
      } else {
        setLatestByAsset({});
      }
    } catch (e) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Realtime subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('ceo-dashboard')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sensor_readings' }, (payload) => {
        const r = payload.new;
        if (!r?.asset_id) return;
        setLatestByAsset((prev) => {
          const existing = prev[r.asset_id];
          if (existing && new Date(existing.recorded_at) >= new Date(r.recorded_at)) return prev;
          return { ...prev, [r.asset_id]: r };
        });
        flashPulse();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assets' }, () => {
        loadAll();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'devices' }, (payload) => {
        const d = payload.new;
        setDevices((prev) => prev.map((x) => (x.id === d.id ? { ...x, ...d } : x)));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadAll]);

  // ===== KPIs =====
  const kpis = useMemo(() => {
    const totalInsured = assets.reduce((sum, a) => sum + Number(a.insured_value || 0), 0);

    const scores = assets
      .map((a) => latestByAsset[a.id]?.stability_score)
      .filter((s) => s != null)
      .map(Number);
    const avgStability = scores.length ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : null;

    const stable = scores.filter((s) => s >= 80).length;
    const watch = scores.filter((s) => s >= 60 && s < 80).length;
    const critical = scores.filter((s) => s < 60).length;
    const noData = assets.length - scores.length;

    const lowBattery = devices.filter((d) => (d.battery_level ?? 100) < 20).length;
    const offline = devices.filter((d) => {
      if (!d.last_seen_at) return true;
      return Date.now() - new Date(d.last_seen_at).getTime() > 30 * 60 * 1000;
    }).length;

    // Group by stable
    const byStable = {};
    for (const a of assets) {
      const key = a.stable_id || 'unassigned';
      if (!byStable[key]) byStable[key] = { count: 0, scoreSum: 0, scoreCount: 0, value: 0 };
      byStable[key].count += 1;
      byStable[key].value += Number(a.insured_value || 0);
      const s = latestByAsset[a.id]?.stability_score;
      if (s != null) {
        byStable[key].scoreSum += Number(s);
        byStable[key].scoreCount += 1;
      }
    }

    return { totalInsured, avgStability, stable, watch, critical, noData, lowBattery, offline, byStable };
  }, [assets, latestByAsset, devices]);

  const fmtSAR = (n) =>
    new Intl.NumberFormat(isAr ? 'ar-SA' : 'en-US', { maximumFractionDigits: 0 }).format(n || 0);

  const stabilityTier = (score) => {
    if (score == null) return { label: isAr ? 'لا يوجد بيانات' : 'No Data', color: 'var(--color-text-muted)' };
    if (score >= 80) return { label: isAr ? 'مستقر' : 'Stable', color: 'var(--color-royal-green)' };
    if (score >= 60) return { label: isAr ? 'مراقبة' : 'Watch', color: 'var(--color-desert-gold-dark)' };
    return { label: isAr ? 'حرج' : 'Critical', color: 'var(--color-danger)' };
  };

  const overallTier = stabilityTier(kpis.avgStability);

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg-primary)' }}>
      {/* Header */}
      <header className="sticky top-0 z-20 shadow-sm" style={{ background: 'var(--color-royal-green)', borderBottom: '3px solid var(--color-desert-gold)' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span aria-hidden>👑</span> {isAr ? 'لوحة المدير التنفيذي' : 'Executive (CEO) View'}
              <span
                className={`inline-block w-2 h-2 rounded-full transition-all ${pulse ? 'animate-ping' : ''}`}
                style={{ background: pulse ? '#22c55e' : 'var(--color-desert-gold)' }}
                title={isAr ? 'مباشر' : 'Live'}
              />
            </h1>
            <div className="text-[11px]" style={{ color: 'var(--color-desert-gold-light)' }}>
              {isAr ? 'نظرة بانورامية لحظية على الأصول والاستقرار' : 'Real-time panoramic view of assets & stability'}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-xs text-white/85 hover:text-white font-medium px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.08)' }}
            >
              {isAr ? '← الداشبورد' : '← Dashboard'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {error && (
          <div className="rounded-xl p-3 text-sm" style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: '1px solid var(--color-danger)' }}>
            {error}
          </div>
        )}

        {/* Hero KPIs */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total insured value */}
          <div
            className="rounded-2xl p-5 text-white relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, var(--color-royal-green), var(--color-royal-green-dark))',
              boxShadow: '0 10px 30px -10px rgba(0,108,53,0.4)',
            }}
          >
            <div className="text-[11px] uppercase tracking-wider opacity-80">
              {isAr ? 'إجمالي قيمة الأصول المؤمنة' : 'Total Insured Asset Value'}
            </div>
            <div className="mt-2 text-3xl sm:text-4xl font-extrabold leading-tight">
              {loading ? '—' : fmtSAR(kpis.totalInsured)}
              <span className="text-base font-bold ml-2" style={{ color: 'var(--color-desert-gold-light)' }}>
                {isAr ? 'ر.س' : 'SAR'}
              </span>
            </div>
            <div className="mt-2 text-[12px] opacity-90">
              {isAr
                ? `${assets.length} أصل عبر ${Object.keys(kpis.byStable || {}).length} موقع`
                : `${assets.length} assets across ${Object.keys(kpis.byStable || {}).length} stables`}
            </div>
            <div aria-hidden className="absolute -right-6 -bottom-6 text-7xl opacity-10 select-none">💎</div>
          </div>

          {/* Overall stability */}
          <div
            className="rounded-2xl p-5 relative overflow-hidden"
            style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
          >
            <div className="text-[11px] uppercase tracking-wider font-bold" style={{ color: 'var(--color-text-muted)' }}>
              {isAr ? 'حالة الاستقرار العامة للقطيع' : 'Overall Herd Stability'}
            </div>
            <div className="mt-2 flex items-end gap-2">
              <div className="text-4xl font-extrabold" style={{ color: overallTier.color }}>
                {kpis.avgStability ?? '—'}
                {kpis.avgStability != null && <span className="text-lg">/100</span>}
              </div>
              <div className="text-sm font-bold pb-1" style={{ color: overallTier.color }}>
                {overallTier.label}
              </div>
            </div>
            <div className="mt-3 h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--color-bg-secondary)' }}>
              <div
                className="h-full transition-all duration-700"
                style={{
                  width: `${kpis.avgStability ?? 0}%`,
                  background: 'linear-gradient(90deg, var(--color-royal-green), var(--color-desert-gold))',
                }}
              />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[11px]">
              <Pill label={isAr ? 'مستقر' : 'Stable'} value={kpis.stable} color="var(--color-royal-green)" />
              <Pill label={isAr ? 'مراقبة' : 'Watch'} value={kpis.watch} color="var(--color-desert-gold-dark)" />
              <Pill label={isAr ? 'حرج' : 'Critical'} value={kpis.critical} color="var(--color-danger)" />
            </div>
          </div>

          {/* Device health */}
          <div className="rounded-2xl p-5" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
            <div className="text-[11px] uppercase tracking-wider font-bold" style={{ color: 'var(--color-text-muted)' }}>
              {isAr ? 'صحة الأجهزة' : 'Device Fleet Health'}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Stat
                label={isAr ? 'إجمالي الأجهزة' : 'Total Devices'}
                value={devices.length}
                icon="📡"
              />
              <Stat
                label={isAr ? 'بطارية منخفضة' : 'Low Battery'}
                value={kpis.lowBattery}
                icon="🔋"
                color={kpis.lowBattery ? 'var(--color-warning)' : 'var(--color-text-primary)'}
              />
              <Stat
                label={isAr ? 'غير متصل' : 'Offline'}
                value={kpis.offline}
                icon="📴"
                color={kpis.offline ? 'var(--color-danger)' : 'var(--color-text-primary)'}
              />
              <Stat
                label={isAr ? 'بدون بيانات' : 'No Data'}
                value={kpis.noData}
                icon="❔"
                color="var(--color-text-muted)"
              />
            </div>
          </div>
        </section>

        {/* By Stable / Group */}
        <section className="rounded-2xl p-5" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
              {isAr ? 'متوسط الاستقرار حسب الإسطبل/المجموعة' : 'Stability by Stable / Group'}
            </h2>
            <div className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
              {isAr ? 'يحدّث آلياً' : 'Auto-refreshing'}
            </div>
          </div>
          {Object.keys(kpis.byStable).length === 0 ? (
            <EmptyState isAr={isAr} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(kpis.byStable).map(([key, g]) => {
                const avg = g.scoreCount ? Math.round(g.scoreSum / g.scoreCount) : null;
                const tier = stabilityTier(avg);
                return (
                  <div key={key} className="rounded-xl p-4" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
                    <div className="flex items-start justify-between">
                      <div className="text-xs font-bold" style={{ color: 'var(--color-text-primary)' }}>
                        {key === 'unassigned' ? (isAr ? 'بدون إسطبل' : 'Unassigned') : `${isAr ? 'إسطبل' : 'Stable'} ${key.slice(0, 6)}`}
                      </div>
                      <div className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'white', color: tier.color, border: `1px solid ${tier.color}` }}>
                        {tier.label}
                      </div>
                    </div>
                    <div className="mt-2 flex items-end justify-between">
                      <div>
                        <div className="text-2xl font-extrabold" style={{ color: tier.color }}>
                          {avg ?? '—'}{avg != null && <span className="text-xs">/100</span>}
                        </div>
                        <div className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                          {g.count} {isAr ? 'أصل' : 'assets'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                          {isAr ? 'القيمة' : 'Value'}
                        </div>
                        <div className="text-xs font-bold" style={{ color: 'var(--color-royal-green)' }}>
                          {fmtSAR(g.value)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Asset table */}
        <section className="rounded-2xl p-5" style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
          <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
            {isAr ? 'تفاصيل الأصول' : 'Asset Details'}
          </h2>
          {assets.length === 0 ? (
            <EmptyState isAr={isAr} />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left" style={{ color: 'var(--color-text-muted)' }}>
                    <th className="py-2 pr-3 text-[11px] uppercase">{isAr ? 'الأصل' : 'Asset'}</th>
                    <th className="py-2 pr-3 text-[11px] uppercase">{isAr ? 'النوع' : 'Species'}</th>
                    <th className="py-2 pr-3 text-[11px] uppercase">{isAr ? 'القيمة' : 'Value'}</th>
                    <th className="py-2 pr-3 text-[11px] uppercase">{isAr ? 'الاستقرار' : 'Stability'}</th>
                    <th className="py-2 pr-3 text-[11px] uppercase">{isAr ? 'آخر قراءة' : 'Last Reading'}</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((a) => {
                    const r = latestByAsset[a.id];
                    const score = r?.stability_score != null ? Number(r.stability_score) : null;
                    const tier = stabilityTier(score);
                    return (
                      <tr key={a.id} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                        <td className="py-2 pr-3 font-medium">{a.name}</td>
                        <td className="py-2 pr-3 text-xs">{a.species}</td>
                        <td className="py-2 pr-3">{fmtSAR(a.insured_value)}</td>
                        <td className="py-2 pr-3">
                          <span className="inline-flex items-center gap-2 text-xs font-bold" style={{ color: tier.color }}>
                            <span className="inline-block w-2 h-2 rounded-full" style={{ background: tier.color }} />
                            {score != null ? `${Math.round(score)}/100` : '—'} · {tier.label}
                          </span>
                        </td>
                        <td className="py-2 pr-3 text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                          {r?.recorded_at ? new Date(r.recorded_at).toLocaleString(isAr ? 'ar-SA' : 'en-US') : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="text-[11px] text-center" style={{ color: 'var(--color-text-muted)' }}>
          {isAr
            ? 'تُحسب درجة الاستقرار آلياً على الخادم: 60% الالتزام بالنطاق + 40% استقرار الصحة'
            : 'Stability score auto-computed server-side: 60% geofence adherence + 40% health stability'}
        </p>
      </main>
    </div>
  );
}

function Pill({ label, value, color }) {
  return (
    <div className="rounded-lg py-1.5" style={{ background: 'var(--color-bg-secondary)' }}>
      <div className="text-[10px] uppercase font-bold" style={{ color: 'var(--color-text-muted)' }}>{label}</div>
      <div className="text-base font-extrabold" style={{ color }}>{value}</div>
    </div>
  );
}

function Stat({ label, value, icon, color = 'var(--color-text-primary)' }) {
  return (
    <div className="rounded-lg p-2.5" style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}>
      <div className="text-[10px] uppercase font-bold flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
        <span aria-hidden>{icon}</span> {label}
      </div>
      <div className="text-xl font-extrabold mt-0.5" style={{ color }}>{value}</div>
    </div>
  );
}

function EmptyState({ isAr }) {
  return (
    <div className="text-center py-8 text-sm" style={{ color: 'var(--color-text-muted)' }}>
      {isAr
        ? 'لا توجد أصول مسجلة بعد. ستظهر البيانات هنا فور وصول قراءات الأجهزة.'
        : 'No assets registered yet. Data will appear here as soon as devices report.'}
    </div>
  );
}
