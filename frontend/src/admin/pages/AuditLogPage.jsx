import React, { useState } from 'react';
import { Search, Download, ArrowUpDown, ShieldAlert } from 'lucide-react';
import {
  ADMIN_PANEL, ADMIN_PANEL_2, ADMIN_BORDER, ADMIN_TEXT, ADMIN_MUTED,
  ADMIN_RED, ADMIN_GREEN, ADMIN_AMBER, relTime,
} from '../theme';
import { useAuditLog, useFilteredAuditLog, downloadCsv } from '../hooks/useAuditLog';

const SOURCE_LABEL = {
  notification: 'تنبيه',
  error_log: 'خطأ نظام',
  edge_function: 'خطأ Edge Function',
};

const SEVERITY_STYLE = {
  critical: { label: 'حرج', bg: 'rgba(226,75,74,0.16)', fg: ADMIN_RED },
  warning: { label: 'تحذير', bg: 'rgba(245,158,11,0.16)', fg: ADMIN_AMBER },
  info: { label: 'معلومة', bg: 'rgba(34,197,94,0.16)', fg: ADMIN_GREEN },
};

export default function AuditLogPage() {
  const { entries, loading, error } = useAuditLog();
  const [search, setSearch] = useState('');
  const [source, setSource] = useState('all');
  const [severity, setSeverity] = useState('all');
  const [sortDir, setSortDir] = useState('desc');

  const filtered = useFilteredAuditLog(entries, { source, severity, search, sortDir });

  return (
    <div className="p-6 lg:p-8 space-y-6" dir="rtl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-extrabold flex items-center gap-2" style={{ color: ADMIN_TEXT }}>
            <ShieldAlert className="w-5 h-5" style={{ color: ADMIN_RED }} />
            السجلات التفتيشية والتنبيهات
          </h1>
          <p className="text-xs mt-1" style={{ color: ADMIN_MUTED }}>
            سجل موحّد للتنبيهات وأخطاء النظام وأخطاء Edge Functions (آخر 200 لكل مصدر)
          </p>
        </div>
        <button
          onClick={() => downloadCsv(filtered, `audit-log-${new Date().toISOString().slice(0, 10)}.csv`)}
          disabled={filtered.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold disabled:opacity-40"
          style={{ background: 'rgba(212,175,55,0.16)', color: '#d4af37' }}
        >
          <Download className="w-3.5 h-3.5" />
          تصدير CSV ({filtered.length})
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-xl px-3 py-2 flex-1 min-w-[200px]" style={{ background: ADMIN_PANEL, border: `1px solid ${ADMIN_BORDER}` }}>
          <Search className="w-4 h-4" style={{ color: ADMIN_MUTED }} />
          <input
            type="text"
            placeholder="ابحث بالعنوان أو التفاصيل..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: ADMIN_TEXT }}
          />
        </div>
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className="rounded-xl px-3 py-2 text-sm outline-none"
          style={{ background: ADMIN_PANEL, border: `1px solid ${ADMIN_BORDER}`, color: ADMIN_TEXT }}
        >
          <option value="all">كل المصادر</option>
          <option value="notification">تنبيهات</option>
          <option value="error_log">أخطاء نظام</option>
          <option value="edge_function">أخطاء Edge Functions</option>
        </select>
        <select
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          className="rounded-xl px-3 py-2 text-sm outline-none"
          style={{ background: ADMIN_PANEL, border: `1px solid ${ADMIN_BORDER}`, color: ADMIN_TEXT }}
        >
          <option value="all">كل الدرجات</option>
          <option value="critical">حرج</option>
          <option value="warning">تحذير</option>
          <option value="info">معلومة</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: ADMIN_PANEL, border: `1px solid ${ADMIN_BORDER}` }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ color: ADMIN_TEXT }}>
            <thead style={{ background: ADMIN_PANEL_2, color: ADMIN_MUTED }}>
              <tr>
                <th className="text-start px-4 py-3 font-semibold text-xs">
                  <button
                    onClick={() => setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))}
                    className="flex items-center gap-1"
                  >
                    الوقت <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="text-start px-4 py-3 font-semibold text-xs">المصدر</th>
                <th className="text-start px-4 py-3 font-semibold text-xs">الدرجة</th>
                <th className="text-start px-4 py-3 font-semibold text-xs">العنوان</th>
                <th className="text-start px-4 py-3 font-semibold text-xs">التفاصيل</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-xs" style={{ color: ADMIN_MUTED }}>...جاري التحميل</td></tr>
              )}
              {error && !loading && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-xs" style={{ color: ADMIN_RED }}>خطأ: {error}</td></tr>
              )}
              {!loading && !error && filtered.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-xs" style={{ color: ADMIN_MUTED }}>لا توجد سجلات مطابقة</td></tr>
              )}
              {!loading && filtered.map((e) => {
                const sv = SEVERITY_STYLE[e.severity] ?? SEVERITY_STYLE.info;
                return (
                  <tr key={e.id} className="border-t" style={{ borderColor: ADMIN_BORDER }}>
                    <td className="px-4 py-3 text-xs" style={{ color: ADMIN_MUTED }} title={e.created_at}>
                      {relTime(e.created_at)}
                    </td>
                    <td className="px-4 py-3 text-xs">{SOURCE_LABEL[e.source] ?? e.source}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: sv.bg, color: sv.fg }}>
                        {sv.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold">{e.title}</td>
                    <td className="px-4 py-3 text-xs max-w-md truncate" style={{ color: ADMIN_MUTED }} title={e.detail}>
                      {e.detail}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
