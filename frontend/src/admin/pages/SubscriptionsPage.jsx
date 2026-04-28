import React, { useEffect, useMemo, useState } from 'react';
import { CreditCard, TrendingUp, Activity, Clock4 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import {
  ADMIN_PANEL, ADMIN_PANEL_2, ADMIN_BORDER, ADMIN_TEXT, ADMIN_MUTED,
  ADMIN_RED, ADMIN_GOLD, ADMIN_GREEN, ADMIN_AMBER,
  planBadge, statusBadge,
} from '../theme';
import { EditSubscriptionModal } from '../components/AdminModals';

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

export default function SubscriptionsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editing, setEditing] = useState(null);

  async function load() {
    setLoading(true);
    // Join profile for display name
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) console.warn('subs load:', error.message);
    const subs = data || [];
    // Hydrate names in a single query
    const ownerIds = [...new Set(subs.map((s) => s.owner_id))];
    const { data: profs } = await supabase
      .from('profiles')
      .select('user_id, full_name, phone')
      .in('user_id', ownerIds.length ? ownerIds : ['00000000-0000-0000-0000-000000000000']);
    const profMap = new Map((profs || []).map((p) => [p.user_id, p]));
    setRows(subs.map((s) => ({ ...s, profile: profMap.get(s.owner_id) || null })));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) =>
      (planFilter === 'all' || r.plan === planFilter) &&
      (statusFilter === 'all' || r.status === statusFilter)
    );
  }, [rows, planFilter, statusFilter]);

  const stats = useMemo(() => {
    const mrr = rows
      .filter((r) => r.status === 'active')
      .reduce((acc, r) => {
        const p = Number(r.price_sar) || 0;
        return acc + (r.billing_cycle === 'yearly' ? p / 12 : p);
      }, 0);
    return {
      mrr: Math.round(mrr),
      total: rows.length,
      active: rows.filter((r) => r.status === 'active').length,
      trial: rows.filter((r) => r.status === 'trial').length,
    };
  }, [rows]);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: ADMIN_TEXT }}>الاشتراكات</h1>
        <p className="text-sm mt-1" style={{ color: ADMIN_MUTED }}>كل الاشتراكات النشطة، الإيراد الشهري، والتعديل المباشر.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="MRR (إيراد شهري)" value={`${stats.mrr.toLocaleString('en-US')} ر.س`} icon={TrendingUp} accent={ADMIN_GREEN} />
        <StatCard label="إجمالي الاشتراكات" value={stats.total} icon={CreditCard} accent={ADMIN_GOLD} />
        <StatCard label="نشطة" value={stats.active} icon={Activity} accent={ADMIN_GREEN} />
        <StatCard label="تجربة" value={stats.trial} icon={Clock4} accent={ADMIN_AMBER} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} className="text-sm p-2 rounded-lg" style={{ background: ADMIN_PANEL, color: ADMIN_TEXT, border: `1px solid ${ADMIN_BORDER}` }}>
          <option value="all">كل الخطط</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-sm p-2 rounded-lg" style={{ background: ADMIN_PANEL, color: ADMIN_TEXT, border: `1px solid ${ADMIN_BORDER}` }}>
          <option value="all">كل الحالات</option>
          <option value="active">نشط</option>
          <option value="trial">تجربة</option>
          <option value="suspended">موقوف</option>
          <option value="expired">منتهي</option>
        </select>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: ADMIN_PANEL, border: `1px solid ${ADMIN_BORDER}` }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ color: ADMIN_TEXT }}>
            <thead style={{ background: ADMIN_PANEL_2, color: ADMIN_MUTED }}>
              <tr>
                <th className="text-start px-4 py-3 text-xs font-semibold">العميل</th>
                <th className="text-start px-4 py-3 text-xs font-semibold">الخطة</th>
                <th className="text-start px-4 py-3 text-xs font-semibold">الحالة</th>
                <th className="text-start px-4 py-3 text-xs font-semibold">الإيراد</th>
                <th className="text-start px-4 py-3 text-xs font-semibold">الدورة</th>
                <th className="text-start px-4 py-3 text-xs font-semibold">تنتهي في</th>
                <th className="text-end px-4 py-3 text-xs font-semibold">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="px-4 py-10 text-center text-xs" style={{ color: ADMIN_MUTED }}>...جاري التحميل</td></tr>}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-xs" style={{ color: ADMIN_MUTED }}>لا توجد اشتراكات</td></tr>
              )}
              {!loading && filtered.map((r) => {
                const pb = planBadge(r.plan);
                const sb = statusBadge(r.status);
                const expiry = r.current_period_end || r.trial_ends_at;
                return (
                  <tr key={r.id} style={{ borderTop: `1px solid ${ADMIN_BORDER}` }}>
                    <td className="px-4 py-3">
                      <div className="font-semibold">{r.profile?.full_name || 'بدون اسم'}</div>
                      <div className="text-xs" style={{ color: ADMIN_MUTED }}>{r.profile?.phone || '—'}</div>
                    </td>
                    <td className="px-4 py-3"><span className="text-xs font-bold px-2 py-1 rounded" style={{ background: pb.bg, color: pb.fg }}>{pb.label}</span></td>
                    <td className="px-4 py-3"><span className="text-xs font-bold px-2 py-1 rounded" style={{ background: sb.bg, color: sb.fg }}>{sb.label}</span></td>
                    <td className="px-4 py-3 text-sm font-mono">{r.price_sar != null ? `${Number(r.price_sar).toFixed(0)} ر.س` : '—'}</td>
                    <td className="px-4 py-3 text-xs">{r.billing_cycle === 'yearly' ? 'سنوي' : 'شهري'}</td>
                    <td className="px-4 py-3 text-xs">{expiry ? new Date(expiry).toLocaleDateString('ar-SA') : '—'}</td>
                    <td className="px-4 py-3 text-end">
                      <button
                        onClick={() => setEditing(r)}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg"
                        style={{ background: ADMIN_RED, color: '#fff' }}
                      >
                        تعديل
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <EditSubscriptionModal open={!!editing} subscription={editing} onClose={() => setEditing(null)} onSaved={load} />
    </div>
  );
}
