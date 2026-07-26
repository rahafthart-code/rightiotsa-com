import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const FETCH_LIMIT = 200;

const NOTIFICATION_SEVERITY = {
  danger_alert: 'critical',
  zone_breach: 'critical',
  warning_alert: 'warning',
  device_offline: 'warning',
  low_battery: 'warning',
};

function normalizeNotification(n) {
  return {
    id: `notification-${n.id}`,
    source: 'notification',
    severity: NOTIFICATION_SEVERITY[n.type] ?? 'info',
    type: n.type,
    title: n.title,
    detail: n.body ?? '',
    created_at: n.created_at,
    raw: n,
  };
}

function normalizeErrorLog(e) {
  return {
    id: `error_log-${e.id}`,
    source: 'error_log',
    severity: e.resolved ? 'info' : 'critical',
    type: e.error_code ?? e.source,
    title: `${e.source}${e.error_code ? ` — ${e.error_code}` : ''}`,
    detail: e.error_msg ?? '',
    created_at: e.created_at,
    raw: e,
  };
}

function normalizeEdgeFunctionError(f) {
  return {
    id: `edge_function-${f.id}`,
    source: 'edge_function',
    severity: (f.status_code ?? 500) >= 500 ? 'critical' : 'warning',
    type: f.function_name,
    title: `${f.function_name} (${f.status_code ?? '—'})`,
    detail: f.error_message ?? '',
    created_at: f.created_at,
    raw: f,
  };
}

/**
 * useAuditLog — fetches and normalizes the three audit-relevant tables
 * (notifications, error_log, edge_function_errors) into one common shape
 * for the Audit Log & Alert Center admin page.
 */
export function useAuditLog() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [notifRes, errLogRes, edgeErrRes] = await Promise.all([
        supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(FETCH_LIMIT),
        supabase.from('error_log').select('*').order('created_at', { ascending: false }).limit(FETCH_LIMIT),
        supabase.from('edge_function_errors').select('*').order('created_at', { ascending: false }).limit(FETCH_LIMIT),
      ]);
      if (notifRes.error) throw notifRes.error;
      if (errLogRes.error) throw errLogRes.error;
      if (edgeErrRes.error) throw edgeErrRes.error;

      const merged = [
        ...(notifRes.data ?? []).map(normalizeNotification),
        ...(errLogRes.data ?? []).map(normalizeErrorLog),
        ...(edgeErrRes.data ?? []).map(normalizeEdgeFunctionError),
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setEntries(merged);
    } catch (e) {
      setError(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { entries, loading, error, refresh };
}

/**
 * Client-side filter + sort over the normalized entries — kept separate
 * from the fetch hook so it's cheap to test and to re-run on every
 * keystroke without re-querying Supabase.
 */
export function useFilteredAuditLog(entries, { source = 'all', severity = 'all', search = '', sortDir = 'desc' } = {}) {
  return useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = entries.filter((e) => {
      if (source !== 'all' && e.source !== source) return false;
      if (severity !== 'all' && e.severity !== severity) return false;
      if (q && !`${e.title} ${e.detail}`.toLowerCase().includes(q)) return false;
      return true;
    });
    rows = rows.slice().sort((a, b) =>
      sortDir === 'asc'
        ? new Date(a.created_at) - new Date(b.created_at)
        : new Date(b.created_at) - new Date(a.created_at),
    );
    return rows;
  }, [entries, source, severity, search, sortDir]);
}

const CSV_HEADERS = ['created_at', 'source', 'severity', 'type', 'title', 'detail'];

export function toCsv(rows) {
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [CSV_HEADERS.join(',')];
  for (const r of rows) {
    lines.push(CSV_HEADERS.map((h) => escape(r[h])).join(','));
  }
  return lines.join('\n');
}

export function downloadCsv(rows, filename = 'audit-log.csv') {
  const csv = toCsv(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
