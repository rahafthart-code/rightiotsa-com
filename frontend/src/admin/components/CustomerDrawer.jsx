import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import {
  ADMIN_PANEL, ADMIN_PANEL_2, ADMIN_BORDER, ADMIN_TEXT, ADMIN_MUTED,
  ADMIN_RED, ADMIN_GREEN, ADMIN_AMBER, planBadge, statusBadge, relTime,
} from '../theme';

export default function CustomerDrawer({ ownerId, onClose, onChanged }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [sub, setSub] = useState(null);
  const [stables, setStables] = useState([]);
  const [devices, setDevices] = useState([]);
  const [assets, setAssets] = useState([]);
  const [busy, setBusy] = useState(false);
  const [newDeviceId, setNewDeviceId] = useState('');
  const [newDeviceAssetId, setNewDeviceAssetId] = useState('');
  const [newDeviceStableId, setNewDeviceStableId] = useState('');
  const [newDeviceType, setNewDeviceType] = useState('collar');
  const [notesDraft, setNotesDraft] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const [p, s, st, d, a] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', ownerId).maybeSingle(),
        supabase.from('subscriptions').select('*').eq('owner_id', ownerId).maybeSingle(),
        supabase.from('stables').select('*').eq('owner_id', ownerId).order('created_at', { ascending: false }),
        supabase.from('sensor_devices').select('*').eq('owner_id', ownerId).order('updated_at', { ascending: false }),
        supabase.from('assets').select('id,name,species,stable_id,sensor_device_id,is_active').eq('owner_id', ownerId).eq('is_active', true),
      ]);
      if (cancelled) return;
      setProfile(p.data || null);
      setSub(s.data || null);
      setStables(st.data || []);
      setDevices(d.data || []);
      setAssets(a.data || []);
      setNotesDraft(s.data?.notes || '');
      setLoading(false);
    }
    if (ownerId) load();
    return () => { cancelled = true; };
  }, [ownerId]);

  async function saveNotes() {
    if (!sub?.id) return;
    setBusy(true);
    const { error } = await supabase.from('subscriptions')
      .update({ notes: notesDraft })
      .eq('id', sub.id);
    setBusy(false);
    if (!error) {
      setSub({ ...sub, notes: notesDraft });
      onChanged?.();
    } else {
      alert('فشل الحفظ: ' + error.message);
    }
  }

  async function activateDevice() {
    if (!newDeviceId.trim()) {
      alert('أدخل معرف الجهاز');
      return;
    }
    setBusy(true);
    // Call the secure admin edge function (server-side admin check + ownership validation)
    const { data, error } = await supabase.functions.invoke('admin-activate-device', {
      body: {
        device_id: newDeviceId.trim(),
        owner_id: ownerId,
        asset_id: newDeviceAssetId || null,
        stable_id: newDeviceStableId || null,
        device_type: newDeviceType,
      },
    });

    if (error || data?.error) {
      setBusy(false);
      const msg = data?.error
        ? (typeof data.error === 'string' ? data.error : JSON.stringify(data.error))
        : error.message;
      alert('فشل تفعيل الجهاز: ' + msg);
      return;
    }

    // Refresh devices list
    const { data: dRows } = await supabase.from('sensor_devices')
      .select('*').eq('owner_id', ownerId).order('updated_at', { ascending: false });
    setDevices(dRows || []);
    setNewDeviceId('');
    setNewDeviceAssetId('');
    setNewDeviceStableId('');
    setBusy(false);
    onChanged?.();
  }

  // Filter assets by selected stable for the activation form
  const assetsInStable = newDeviceStableId
    ? assets.filter((x) => x.stable_id === newDeviceStableId)
    : assets;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(0,0,0,0.55)' }}
      />
      {/* Panel - slides from right (which is "from start" in RTL, so use insetInlineEnd:0) */}
      <aside
        dir="rtl"
        className="fixed top-0 bottom-0 z-50 overflow-y-auto"
        style={{
          width: 'min(480px, 100vw)',
          insetInlineStart: 0, // in RTL this is the right edge
          background: ADMIN_PANEL,
          borderInlineEnd: `1px solid ${ADMIN_BORDER}`,
          color: ADMIN_TEXT,
          fontFamily: 'Cairo, Tajawal, sans-serif',
        }}
      >
        {/* Header */}
        <div
          className="sticky top-0 px-5 py-4 flex items-center justify-between"
          style={{ background: ADMIN_PANEL, borderBottom: `1px solid ${ADMIN_BORDER}` }}
        >
          <div className="font-bold">تفاصيل العميل</div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg"
            style={{ background: ADMIN_PANEL_2, color: ADMIN_TEXT }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="p-6 text-sm" style={{ color: ADMIN_MUTED }}>...جاري التحميل</div>
        ) : (
          <div className="p-5 space-y-5">
            {/* Profile */}
            <section className="space-y-1">
              <div className="text-xs" style={{ color: ADMIN_MUTED }}>الملف الشخصي</div>
              <div className="rounded-xl p-4" style={{ background: ADMIN_PANEL_2, border: `1px solid ${ADMIN_BORDER}` }}>
                <div className="font-bold text-base">{profile?.full_name || 'بدون اسم'}</div>
                <div className="text-xs mt-1" style={{ color: ADMIN_MUTED }}>{profile?.phone || '—'}</div>
                <div className="flex gap-4 mt-3 text-xs" style={{ color: ADMIN_MUTED }}>
                  <span>انضم {relTime(profile?.created_at)}</span>
                  <span>آخر نشاط {relTime(profile?.last_seen_at)}</span>
                </div>
              </div>
            </section>

            {/* Subscription */}
            <section className="space-y-1">
              <div className="text-xs" style={{ color: ADMIN_MUTED }}>الاشتراك</div>
              <div className="rounded-xl p-4 space-y-3" style={{ background: ADMIN_PANEL_2, border: `1px solid ${ADMIN_BORDER}` }}>
                {sub ? (
                  <>
                    <div className="flex items-center gap-2 flex-wrap">
                      {(() => { const b = planBadge(sub.plan); return (
                        <span className="text-xs font-bold px-2 py-1 rounded" style={{ background: b.bg, color: b.fg }}>{b.label}</span>
                      ); })()}
                      {(() => { const b = statusBadge(sub.status); return (
                        <span className="text-xs font-bold px-2 py-1 rounded" style={{ background: b.bg, color: b.fg }}>{b.label}</span>
                      ); })()}
                      {sub.price_sar != null && (
                        <span className="text-xs font-bold px-2 py-1 rounded" style={{ background: 'rgba(212,175,55,0.16)', color: '#e6c75a' }}>
                          {Number(sub.price_sar).toFixed(0)} ر.س / {sub.billing_cycle === 'yearly' ? 'سنة' : 'شهر'}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: ADMIN_MUTED }}>
                      <div>تجربة تنتهي: {sub.trial_ends_at ? new Date(sub.trial_ends_at).toLocaleDateString('ar-SA') : '—'}</div>
                      <div>الفوترة: {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString('ar-SA') : '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs mb-1" style={{ color: ADMIN_MUTED }}>ملاحظات</div>
                      <textarea
                        rows={2}
                        value={notesDraft}
                        onChange={(e) => setNotesDraft(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg outline-none resize-none"
                        style={{ background: ADMIN_PANEL, color: ADMIN_TEXT, border: `1px solid ${ADMIN_BORDER}` }}
                      />
                      <button
                        onClick={saveNotes}
                        disabled={busy || notesDraft === (sub.notes || '')}
                        className="mt-2 px-3 py-1.5 text-xs font-bold rounded-lg disabled:opacity-50"
                        style={{ background: ADMIN_RED, color: '#fff' }}
                      >
                        حفظ
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-xs" style={{ color: ADMIN_MUTED }}>لا يوجد اشتراك</div>
                )}
              </div>
            </section>

            {/* Stables */}
            <section className="space-y-1">
              <div className="text-xs" style={{ color: ADMIN_MUTED }}>العزب ({stables.length})</div>
              <div className="rounded-xl divide-y" style={{ background: ADMIN_PANEL_2, border: `1px solid ${ADMIN_BORDER}`, borderColor: ADMIN_BORDER }}>
                {stables.length === 0 && (
                  <div className="px-4 py-3 text-xs" style={{ color: ADMIN_MUTED }}>لا توجد عزب</div>
                )}
                {stables.map((st) => {
                  const stAssets = assets.filter((a) => a.stable_id === st.id);
                  const stDevices = devices.filter((d) => d.stable_id === st.id);
                  const coverage = stAssets.length
                    ? Math.round((stDevices.length / stAssets.length) * 100)
                    : 0;
                  return (
                    <div key={st.id} className="px-4 py-3" style={{ borderColor: ADMIN_BORDER }}>
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-sm">{st.name}</div>
                        <div className="text-xs" style={{ color: ADMIN_MUTED }}>{stAssets.length} أصول</div>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded" style={{ background: ADMIN_BORDER }}>
                          <div
                            style={{
                              width: `${Math.min(100, coverage)}%`,
                              height: '100%',
                              background: coverage >= 80 ? ADMIN_GREEN : coverage >= 40 ? ADMIN_AMBER : ADMIN_RED,
                              borderRadius: 4,
                            }}
                          />
                        </div>
                        <span className="text-xs" style={{ color: ADMIN_MUTED }}>{coverage}% تغطية</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Devices */}
            <section className="space-y-1">
              <div className="text-xs" style={{ color: ADMIN_MUTED }}>الأجهزة ({devices.length})</div>
              <div className="rounded-xl divide-y" style={{ background: ADMIN_PANEL_2, border: `1px solid ${ADMIN_BORDER}` }}>
                {devices.length === 0 && (
                  <div className="px-4 py-3 text-xs" style={{ color: ADMIN_MUTED }}>لا توجد أجهزة</div>
                )}
                {devices.map((d) => {
                  const linked = assets.find((a) => a.id === d.asset_id);
                  const onlineColor = d.status === 'online' ? ADMIN_GREEN : ADMIN_RED;
                  return (
                    <div key={d.id} className="px-4 py-3 flex items-center justify-between gap-2" style={{ borderColor: ADMIN_BORDER }}>
                      <div className="min-w-0">
                        <div className="font-mono text-xs truncate">{d.device_id}</div>
                        <div className="text-xs mt-0.5" style={{ color: ADMIN_MUTED }}>
                          {linked?.name || 'غير مربوط'} · بطارية {d.battery_pct ?? '—'}%
                        </div>
                      </div>
                      <div className="text-end">
                        <div className="text-xs font-bold" style={{ color: onlineColor }}>{d.status}</div>
                        <div className="text-[10px]" style={{ color: ADMIN_MUTED }}>{relTime(d.last_seen_at)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Activate device */}
            <section className="space-y-2">
              <div className="text-xs" style={{ color: ADMIN_MUTED }}>تفعيل جهاز جديد</div>
              <div className="rounded-xl p-4 space-y-2" style={{ background: ADMIN_PANEL_2, border: `1px solid ${ADMIN_BORDER}` }}>
                <input
                  type="text"
                  placeholder="معرف الجهاز (Device ID)"
                  value={newDeviceId}
                  onChange={(e) => setNewDeviceId(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg outline-none font-mono"
                  style={{ background: ADMIN_PANEL, color: ADMIN_TEXT, border: `1px solid ${ADMIN_BORDER}` }}
                />
                <select
                  value={newDeviceStableId}
                  onChange={(e) => { setNewDeviceStableId(e.target.value); setNewDeviceAssetId(''); }}
                  className="w-full text-xs p-2 rounded-lg outline-none"
                  style={{ background: ADMIN_PANEL, color: ADMIN_TEXT, border: `1px solid ${ADMIN_BORDER}` }}
                >
                  <option value="">— اختر العزبة —</option>
                  {stables.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <select
                  value={newDeviceAssetId}
                  onChange={(e) => setNewDeviceAssetId(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg outline-none"
                  style={{ background: ADMIN_PANEL, color: ADMIN_TEXT, border: `1px solid ${ADMIN_BORDER}` }}
                >
                  <option value="">— اختر الأصل —</option>
                  {assetsInStable.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
                <select
                  value={newDeviceType}
                  onChange={(e) => setNewDeviceType(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg outline-none"
                  style={{ background: ADMIN_PANEL, color: ADMIN_TEXT, border: `1px solid ${ADMIN_BORDER}` }}
                >
                  <option value="collar">طوق (Collar)</option>
                  <option value="tag">تاج (Tag)</option>
                  <option value="implant">زرع (Implant)</option>
                  <option value="external">خارجي (External)</option>
                </select>
                <button
                  onClick={activateDevice}
                  disabled={busy || !newDeviceId.trim()}
                  className="w-full px-3 py-2 text-sm font-bold rounded-lg disabled:opacity-50"
                  style={{ background: ADMIN_RED, color: '#fff' }}
                >
                  تفعيل الجهاز
                </button>
              </div>
            </section>
          </div>
        )}
      </aside>
    </>
  );
}
