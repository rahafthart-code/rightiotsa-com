import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { mockSupabaseFrom } from '../../test/supabaseMock';

let fromResponses;
vi.mock('../../lib/supabaseClient', () => ({
  supabase: { from: (table) => mockSupabaseFrom(fromResponses)(table) },
}));

const { useAuditLog, useFilteredAuditLog, toCsv } = await import('./useAuditLog');
const { renderHook: renderFilterHook } = await import('@testing-library/react');

describe('useAuditLog', () => {
  beforeEach(() => {
    fromResponses = {
      notifications: {
        data: [
          { id: 'n1', type: 'danger_alert', title: 'خطر', body: 'تدهور المؤشرات', created_at: '2026-07-23T10:00:00Z' },
          { id: 'n2', type: 'daily_update', title: 'تحديث', body: 'يومي', created_at: '2026-07-23T08:00:00Z' },
        ],
        error: null,
      },
      error_log: {
        data: [
          { id: 'e1', source: 'iot-ingest', error_code: 'BAD_KEY', error_msg: 'invalid key', resolved: false, created_at: '2026-07-23T09:00:00Z' },
          { id: 'e2', source: 'create-payment', error_code: 'TIMEOUT', error_msg: 'gateway timeout', resolved: true, created_at: '2026-07-23T07:00:00Z' },
        ],
        error: null,
      },
      edge_function_errors: {
        data: [
          { id: 'f1', function_name: 'verify-payment', status_code: 500, error_message: 'internal error', created_at: '2026-07-23T11:00:00Z' },
          { id: 'f2', function_name: 'secure-otp', status_code: 400, error_message: 'bad request', created_at: '2026-07-23T06:00:00Z' },
        ],
        error: null,
      },
    };
  });

  it('normalizes and merges all three sources, sorted newest-first', async () => {
    const { result } = renderHook(() => useAuditLog());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.entries).toHaveLength(6);
    expect(result.current.entries[0].id).toBe('edge_function-f1'); // 11:00, newest
    expect(result.current.entries.at(-1).id).toBe('edge_function-f2'); // 06:00, oldest
  });

  it('maps notification types and error resolution to severity correctly', async () => {
    const { result } = renderHook(() => useAuditLog());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const byId = Object.fromEntries(result.current.entries.map((e) => [e.id, e]));
    expect(byId['notification-n1'].severity).toBe('critical'); // danger_alert
    expect(byId['notification-n2'].severity).toBe('info'); // daily_update
    expect(byId['error_log-e1'].severity).toBe('critical'); // unresolved
    expect(byId['error_log-e2'].severity).toBe('info'); // resolved
    expect(byId['edge_function-f1'].severity).toBe('critical'); // 500
    expect(byId['edge_function-f2'].severity).toBe('warning'); // 400
  });

  it('surfaces a Supabase error instead of throwing', async () => {
    fromResponses.notifications = { data: null, error: { message: 'network down' } };
    const { result } = renderHook(() => useAuditLog());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('network down');
    expect(result.current.entries).toEqual([]);
  });
});

describe('useFilteredAuditLog', () => {
  const entries = [
    { id: '1', source: 'notification', severity: 'critical', title: 'خطر عالي', detail: 'تدهور', created_at: '2026-07-23T10:00:00Z' },
    { id: '2', source: 'error_log', severity: 'warning', title: 'تحذير بسيط', detail: 'شيء ما', created_at: '2026-07-23T09:00:00Z' },
    { id: '3', source: 'edge_function', severity: 'info', title: 'معلومة', detail: 'روتيني', created_at: '2026-07-23T11:00:00Z' },
  ];

  it('filters by source and severity', () => {
    const { result } = renderFilterHook(() => useFilteredAuditLog(entries, { source: 'notification' }));
    expect(result.current).toHaveLength(1);
    expect(result.current[0].id).toBe('1');
  });

  it('filters by case-insensitive text search across title and detail', () => {
    const { result } = renderFilterHook(() => useFilteredAuditLog(entries, { search: 'تدهور' }));
    expect(result.current.map((e) => e.id)).toEqual(['1']);
  });

  it('sorts ascending or descending by created_at', () => {
    const { result: asc } = renderFilterHook(() => useFilteredAuditLog(entries, { sortDir: 'asc' }));
    expect(asc.current.map((e) => e.id)).toEqual(['2', '1', '3']);

    const { result: desc } = renderFilterHook(() => useFilteredAuditLog(entries, { sortDir: 'desc' }));
    expect(desc.current.map((e) => e.id)).toEqual(['3', '1', '2']);
  });
});

describe('toCsv', () => {
  it('produces a header row plus one row per entry, quoting values', () => {
    const csv = toCsv([
      { created_at: '2026-07-23T10:00:00Z', source: 'notification', severity: 'critical', type: 'danger_alert', title: 'a "quoted" title', detail: 'line, with comma' },
    ]);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('created_at,source,severity,type,title,detail');
    expect(lines[1]).toContain('"a ""quoted"" title"');
    expect(lines[1]).toContain('"line, with comma"');
  });

  it('handles an empty list', () => {
    expect(toCsv([])).toBe('created_at,source,severity,type,title,detail');
  });
});
