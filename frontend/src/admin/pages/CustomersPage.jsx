import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, MoreVertical, Users, Activity, Clock4, Wifi } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import {
  ADMIN_PANEL, ADMIN_PANEL_2, ADMIN_BORDER, ADMIN_TEXT, ADMIN_MUTED,
  ADMIN_RED, ADMIN_GREEN, ADMIN_AMBER, ADMIN_GOLD,
  planBadge, statusBadge, relTime,
} from '../theme';
import CustomerDrawer from '../components/CustomerDrawer';
import {
  EditSubscriptionModal, ManageDevicesModal, SendNotificationModal,
} from '../components/AdminModals';

function StatCard({ label, value, icon: Icon, accent }) {
  return (
    <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: ADMIN_PANEL, border: `1px solid ${ADMIN_BORDER}` }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${accent}22`, color: accent }}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-xs" style={{ color: ADMIN_MUTED }}>{label}</div>
        <div className="text-xl font-bold" style={{ color: ADMIN_TEXT }}>{value}</div>
      </div>
    </div>
  );
}

function MiniGauge({ value }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  const color = v >= 85 ? ADMIN_GREEN : v >= 70 ? ADMIN_AMBER : ADMIN_RED;
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 rounded" style={{ background: ADMIN_BORDER }}>
        <div style={{ width: `${v}%`, height: '100%', background: color, borderRadius: 4 }} />
      </div>
      <span className="text-xs font-mono" style={{ color }}>{v.toFixed(0)}</span>
    </div>
  );
}

function RowMenu({ row, onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const items = [
    { key: 'view', label: 'عرض التفاصيل' },
    { key: 'sub', label: 'تعديل الاشتراك' },
    { key: 'devices', label: 'تفعيل/إيقاف جهاز' },
    { key: 'notify', label: 'إرسال إشعار' },
    { key: 'suspend', label: row.sub_status === 'suspended' ? 'إعادة تفعيل الحساب' : 'تعليق الحساب', danger: true },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-lg"
        style={{ background: ADMIN_PANEL_2, color: ADMIN_TEXT }}
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div
          className="absolute z-30 mt-1 rounded-xl py-1 min-w-[180px]"
          style={{
            background: ADMIN_PANEL,
            border: `1px solid ${ADMIN_BORDER}`,
            insetInlineStart: 0,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}
        >
          {items.map((it) => (
            <button
              key={it.key}
              onClick={() => { setOpen(false); onSelect(it.key); }}
              className="w-full text-start px-3 py-2 text-xs hover:opacity-90"
              style={{ color: it.danger ? ADMIN_RED : ADMIN_TEXT, background: 'transparent' }}
            >
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CustomersPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [drawerOwnerId, setDrawerOwnerId] = useState(null);
  const [editSubFor, setEditSubFor] = useState(null);
  const [manageDevicesFor, setManageDevicesFor] = useState(null);
  const [notifyFor, setNotifyFor] = useState(null);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    const { data, error } = await supabase
      .from('admin_dashboard')
      .select('*')
      .order('joined_at', { ascending: false });
    if (error) setError(error.message);
    setRows(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      (r.full_name || '').toLowerCase().includes(q) ||
      (r.phone || '').toLowerCase().includes(q)
    );
  }, [rows, search]);

  const stats = useMemo(() => {
    const total = rows.length;
    const active = rows.filter((r) => r.sub_status === 'active').length;
    const trial = rows.filter((r) => r.sub_status === 'trial').length;
    const onlineDevices = rows.reduce((acc, r) => acc + (Number(r.devices_online) || 0), 0);
    return { total, active, trial, onlineDevices };
  }, [rows]);

  async function handleAction(key, row) {
    if (key === 'view') setDrawerOwnerId(row.owner_id);
    else if (key === 'sub') {
      // Need full subscription row
      const { data: sub } = await supabase.from('subscriptions').select('*').eq('owner_id', row.owner_id).maybeSingle();
      if (!sub) { alert('لا يوجد اشتراك لهذا العميل'); return; }
      setEditSubFor(sub);
    }
    else if (key === 'devices') setManageDevicesFor(row.owner_id);
    else if (key === 'notify') setNotifyFor({ id: row.owner_id, name: row.full_name });
    else if (key === 'suspend') {
      const next = row.sub_status === 'suspended' ? 'active' : 'suspended';
      const { error } = await supabase.from('subscriptions').update({ status: next }).eq('owner_id', row.owner_id);
      if (error) { alert('فشل التحديث: ' + error.message); return; }
      load();
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: ADMIN_TEXT }}>العملاء</h1>
        <p className="text-sm mt-1" style={{ color: ADMIN_MUTED }}>إدارة جميع عملاء المنصة، اشتراكاتهم وأجهزتهم.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="إجمالي العملاء" value={stats.total} icon={Users} accent={ADMIN_GOLD} />
        <StatCard label="عملاء نشطون" value={stats.active} icon={Activity} accent={ADMIN_GREEN} />
        <StatCard label="تجربة مجانية" value={stats.trial} icon={Clock4} accent={ADMIN_AMBER} />
        <StatCard label="أجهزة متصلة" value={stats.onlineDevices} icon={Wifi} accent={ADMIN_RED} />
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 rounded-xl px-3 py-2" style={{ background: ADMIN_PANEL, border: `1px solid ${ADMIN_BORDER}` }}>
        <Search className="w-4 h-4" style={{ color: ADMIN_MUTED }} />
        <input
          type="text"
          placeholder="ابحث بالاسم أو رقم الهاتف..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: ADMIN_TEXT }}
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: ADMIN_PANEL, border: `1px solid ${ADMIN_BORDER}` }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ color: ADMIN_TEXT }}>
            <thead style={{ background: ADMIN_PANEL_2, color: ADMIN_MUTED }}>
              <tr>
                <th className="text-start px-4 py-3 font-semibold text-xs">العميل</th>
                <th className="text-start px-4 py-3 font-semibold text-xs">الخطة</th>
                <th className="text-start px-4 py-3 font-semibold text-xs">الحالة</th>
                <th className="text-start px-4 py-3 font-semibold text-xs">العزب</th>
                <th className="text-start px-4 py-3 font-semibold text-xs">الأصول</th>
                <th className="text-start px-4 py-3 font-semibold text-xs">الأجهزة</th>
                <th className="text-start px-4 py-3 font-semibold text-xs">متوسط الاستقرار</th>
                <th className="text-start px-4 py-3 font-semibold text-xs">آخر نشاط</th>
                <th className="text-end px-4 py-3 font-semibold text-xs">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-xs" style={{ color: ADMIN_MUTED }}>...جاري التحميل</td></tr>
              )}
              {error && !loading && (
                <tr><td colSpan={9} className="px-4 py-6 text-center text-xs" style={{ color: ADMIN_RED }}>خطأ: {error}</td></tr>
              )}
              {!loading && !error && filtered.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-xs" style={{ color: ADMIN_MUTED }}>لا يوجد عملاء</td></tr>
              )}
              {!loading && filtered.map((r) => {
                const pb = planBadge(r.plan);
                const sb = statusBadge(r.sub_status);
                const initial = (r.full_name || '?').trim().charAt(0);
                return (
                  <tr key={r.owner_id} style={{ borderTop: `1px solid ${ADMIN_BORDER}` }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: ADMIN_PANEL_2, color: ADMIN_GOLD, border: `1px solid ${ADMIN_BORDER}` }}>
                          {initial}
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{r.full_name || 'بدون اسم'}</div>
                          <div className="text-xs" style={{ color: ADMIN_MUTED }}>{r.phone || '—'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold px-2 py-1 rounded" style={{ background: pb.bg, color: pb.fg }}>{pb.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-bold px-2 py-1 rounded" style={{ background: sb.bg, color: sb.fg }}>{sb.label}</span>
                    </td>
                    <td className="px-4 py-3 text-sm">{Number(r.stables_count) || 0}</td>
                    <td className="px-4 py-3 text-sm">{Number(r.assets_count) || 0}</td>
                    <td className="px-4 py-3 text-sm">
                      <span style={{ color: ADMIN_GREEN }}>{Number(r.devices_online) || 0}</span>
                      <span style={{ color: ADMIN_MUTED }}> / {Number(r.devices_count) || 0}</span>
                    </td>
                    <td className="px-4 py-3"><MiniGauge value={r.avg_stability} /></td>
                    <td className="px-4 py-3 text-xs" style={{ color: ADMIN_MUTED }}>{relTime(r.last_seen_at)}</td>
                    <td className="px-4 py-3 text-end">
                      <RowMenu row={r} onSelect={(k) => handleAction(k, r)} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer & modals */}
      {drawerOwnerId && (
        <CustomerDrawer ownerId={drawerOwnerId} onClose={() => setDrawerOwnerId(null)} onChanged={load} />
      )}
      <EditSubscriptionModal open={!!editSubFor} subscription={editSubFor} onClose={() => setEditSubFor(null)} onSaved={load} />
      <ManageDevicesModal open={!!manageDevicesFor} ownerId={manageDevicesFor} onClose={() => setManageDevicesFor(null)} onChanged={load} />
      <SendNotificationModal open={!!notifyFor} ownerId={notifyFor?.id} ownerName={notifyFor?.name} onClose={() => setNotifyFor(null)} />
    </div>
  );
}
