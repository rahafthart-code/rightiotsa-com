import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import {
  ADMIN_PANEL, ADMIN_PANEL_2, ADMIN_BORDER, ADMIN_TEXT, ADMIN_MUTED, ADMIN_RED,
} from '../theme';

/**
 * Generic centered modal.
 */
export function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div
        dir="rtl"
        className="rounded-2xl w-[480px] max-w-[92vw] max-h-[88vh] overflow-y-auto"
        style={{ background: ADMIN_PANEL, color: ADMIN_TEXT, border: `1px solid ${ADMIN_BORDER}`, fontFamily: 'Cairo, Tajawal, sans-serif' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${ADMIN_BORDER}` }}>
          <div className="font-bold">{title}</div>
          <button onClick={onClose} className="p-1.5 rounded-lg" style={{ background: ADMIN_PANEL_2 }}>
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

/* ─────────── Send notification ─────────── */
export function SendNotificationModal({ open, ownerId, ownerName, onClose, onSent }) {
  const [type, setType] = useState('admin_message');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);

  async function send() {
    if (!title.trim() || !body.trim()) {
      alert('العنوان والنص مطلوبان');
      return;
    }
    setBusy(true);
    const { error } = await supabase.from('notifications').insert({
      owner_id: ownerId,
      type,
      title: title.trim(),
      body: body.trim(),
    });
    setBusy(false);
    if (error) { alert('فشل الإرسال: ' + error.message); return; }
    setTitle(''); setBody('');
    onSent?.();
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={`إرسال إشعار · ${ownerName || ''}`}>
      <div className="space-y-3">
        <select value={type} onChange={(e) => setType(e.target.value)} className="w-full text-sm p-2 rounded-lg" style={{ background: ADMIN_PANEL_2, color: ADMIN_TEXT, border: `1px solid ${ADMIN_BORDER}` }}>
          <option value="admin_message">رسالة إدارية</option>
          <option value="warning_alert">تحذير</option>
          <option value="danger_alert">تنبيه خطر</option>
          <option value="system">إشعار نظام</option>
        </select>
        <input type="text" placeholder="العنوان" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full text-sm p-2 rounded-lg" style={{ background: ADMIN_PANEL_2, color: ADMIN_TEXT, border: `1px solid ${ADMIN_BORDER}` }} />
        <textarea rows={4} placeholder="نص الرسالة" value={body} onChange={(e) => setBody(e.target.value)} className="w-full text-sm p-2 rounded-lg outline-none resize-none" style={{ background: ADMIN_PANEL_2, color: ADMIN_TEXT, border: `1px solid ${ADMIN_BORDER}` }} />
        <button onClick={send} disabled={busy} className="w-full px-3 py-2 text-sm font-bold rounded-lg disabled:opacity-50" style={{ background: ADMIN_RED, color: '#fff' }}>
          {busy ? 'جاري الإرسال...' : 'إرسال'}
        </button>
      </div>
    </Modal>
  );
}

/* ─────────── Edit subscription ─────────── */
export function EditSubscriptionModal({ open, subscription, onClose, onSaved }) {
  const [draft, setDraft] = useState(() => subscription || {});
  const [busy, setBusy] = useState(false);

  React.useEffect(() => { setDraft(subscription || {}); }, [subscription]);

  if (!subscription) return null;

  function set(k, v) { setDraft((d) => ({ ...d, [k]: v })); }

  async function save() {
    setBusy(true);
    const { error } = await supabase.from('subscriptions').update({
      plan: draft.plan,
      status: draft.status,
      billing_cycle: draft.billing_cycle,
      price_sar: draft.price_sar === '' ? null : Number(draft.price_sar),
      max_assets: Number(draft.max_assets ?? 0),
      max_devices: Number(draft.max_devices ?? 0),
      max_stables: Number(draft.max_stables ?? 0),
      trial_ends_at: draft.trial_ends_at || null,
      current_period_start: draft.current_period_start || null,
      current_period_end: draft.current_period_end || null,
      notes: draft.notes || null,
    }).eq('id', draft.id);
    setBusy(false);
    if (error) { alert('فشل الحفظ: ' + error.message); return; }
    onSaved?.();
    onClose();
  }

  const inputCls = 'w-full text-sm p-2 rounded-lg outline-none';
  const inputStyle = { background: ADMIN_PANEL_2, color: ADMIN_TEXT, border: `1px solid ${ADMIN_BORDER}` };

  return (
    <Modal open={open} onClose={onClose} title="تعديل الاشتراك">
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-xs mb-1" style={{ color: ADMIN_MUTED }}>الخطة</div>
            <select value={draft.plan || 'starter'} onChange={(e) => set('plan', e.target.value)} className={inputCls} style={inputStyle}>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <div>
            <div className="text-xs mb-1" style={{ color: ADMIN_MUTED }}>الحالة</div>
            <select value={draft.status || 'trial'} onChange={(e) => set('status', e.target.value)} className={inputCls} style={inputStyle}>
              <option value="trial">تجربة</option>
              <option value="active">نشط</option>
              <option value="suspended">موقوف</option>
              <option value="expired">منتهي</option>
            </select>
          </div>
          <div>
            <div className="text-xs mb-1" style={{ color: ADMIN_MUTED }}>الدورة</div>
            <select value={draft.billing_cycle || 'monthly'} onChange={(e) => set('billing_cycle', e.target.value)} className={inputCls} style={inputStyle}>
              <option value="monthly">شهري</option>
              <option value="yearly">سنوي</option>
            </select>
          </div>
          <div>
            <div className="text-xs mb-1" style={{ color: ADMIN_MUTED }}>السعر (ر.س)</div>
            <input type="number" value={draft.price_sar ?? ''} onChange={(e) => set('price_sar', e.target.value)} className={inputCls} style={inputStyle} />
          </div>
          <div>
            <div className="text-xs mb-1" style={{ color: ADMIN_MUTED }}>حد العزب</div>
            <input type="number" value={draft.max_stables ?? 0} onChange={(e) => set('max_stables', e.target.value)} className={inputCls} style={inputStyle} />
          </div>
          <div>
            <div className="text-xs mb-1" style={{ color: ADMIN_MUTED }}>حد الأصول</div>
            <input type="number" value={draft.max_assets ?? 0} onChange={(e) => set('max_assets', e.target.value)} className={inputCls} style={inputStyle} />
          </div>
          <div>
            <div className="text-xs mb-1" style={{ color: ADMIN_MUTED }}>حد الأجهزة</div>
            <input type="number" value={draft.max_devices ?? 0} onChange={(e) => set('max_devices', e.target.value)} className={inputCls} style={inputStyle} />
          </div>
          <div>
            <div className="text-xs mb-1" style={{ color: ADMIN_MUTED }}>تنتهي التجربة</div>
            <input type="date" value={draft.trial_ends_at?.slice(0,10) || ''} onChange={(e) => set('trial_ends_at', e.target.value || null)} className={inputCls} style={inputStyle} />
          </div>
          <div>
            <div className="text-xs mb-1" style={{ color: ADMIN_MUTED }}>بداية الدورة</div>
            <input type="date" value={draft.current_period_start?.slice(0,10) || ''} onChange={(e) => set('current_period_start', e.target.value || null)} className={inputCls} style={inputStyle} />
          </div>
          <div>
            <div className="text-xs mb-1" style={{ color: ADMIN_MUTED }}>نهاية الدورة</div>
            <input type="date" value={draft.current_period_end?.slice(0,10) || ''} onChange={(e) => set('current_period_end', e.target.value || null)} className={inputCls} style={inputStyle} />
          </div>
        </div>
        <div>
          <div className="text-xs mb-1" style={{ color: ADMIN_MUTED }}>ملاحظات</div>
          <textarea rows={2} value={draft.notes || ''} onChange={(e) => set('notes', e.target.value)} className={inputCls} style={{ ...inputStyle, resize: 'none' }} />
        </div>
        <button onClick={save} disabled={busy} className="w-full px-3 py-2 text-sm font-bold rounded-lg disabled:opacity-50" style={{ background: ADMIN_RED, color: '#fff' }}>
          {busy ? 'جاري الحفظ...' : 'حفظ'}
        </button>
      </div>
    </Modal>
  );
}

/* ─────────── Manage devices for a customer (toggle on/off) ─────────── */
export function ManageDevicesModal({ open, ownerId, onClose, onChanged }) {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('sensor_devices')
      .select('*').eq('owner_id', ownerId).order('updated_at', { ascending: false });
    setDevices(data || []);
    setLoading(false);
  }

  React.useEffect(() => { if (open && ownerId) load(); /* eslint-disable-next-line */ }, [open, ownerId]);

  async function toggle(d) {
    setBusyId(d.id);
    const next = d.status === 'online' ? 'offline' : 'online';
    const { error } = await supabase.from('sensor_devices').update({ status: next }).eq('id', d.id);
    setBusyId(null);
    if (error) { alert('فشل التحديث: ' + error.message); return; }
    await load();
    onChanged?.();
  }

  return (
    <Modal open={open} onClose={onClose} title="إدارة الأجهزة">
      {loading ? (
        <div className="text-sm" style={{ color: ADMIN_MUTED }}>...جاري التحميل</div>
      ) : devices.length === 0 ? (
        <div className="text-sm" style={{ color: ADMIN_MUTED }}>لا توجد أجهزة لهذا العميل</div>
      ) : (
        <div className="space-y-2">
          {devices.map((d) => (
            <div key={d.id} className="flex items-center justify-between rounded-lg p-3" style={{ background: ADMIN_PANEL_2, border: `1px solid ${ADMIN_BORDER}` }}>
              <div className="min-w-0">
                <div className="font-mono text-xs truncate">{d.device_id}</div>
                <div className="text-[10px]" style={{ color: ADMIN_MUTED }}>{d.device_type} · بطارية {d.battery_pct ?? '—'}%</div>
              </div>
              <button
                onClick={() => toggle(d)}
                disabled={busyId === d.id}
                className="text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-50"
                style={{
                  background: d.status === 'online' ? 'rgba(226,75,74,0.2)' : 'rgba(34,197,94,0.2)',
                  color: d.status === 'online' ? '#ff7e7d' : '#5eea93',
                }}
              >
                {d.status === 'online' ? 'إيقاف' : 'تفعيل'}
              </button>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
