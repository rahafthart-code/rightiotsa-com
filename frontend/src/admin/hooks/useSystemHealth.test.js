import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { mockSupabaseFrom } from '../../test/supabaseMock';

let fromResponses;
let subscribeCallback;
const channelMock = {
  on: () => channelMock,
  subscribe: (cb) => {
    subscribeCallback = cb;
    return channelMock;
  },
};

vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    from: (table) => mockSupabaseFrom(fromResponses)(table),
    channel: () => channelMock,
    removeChannel: vi.fn(),
  },
}));

const { useSystemHealth } = await import('./useSystemHealth');

function baseResponses(overrides = {}) {
  return {
    sensor_devices: { count: 10, error: null }, // reused per-call by count-only queries below
    profiles: { count: 4, error: null },
    notifications: { count: 7, error: null },
    edge_function_errors: { count: 2, data: [], error: null },
    error_log: { count: 1, error: null },
    payments: { count: 3, error: null },
    ...overrides,
  };
}

describe('useSystemHealth', () => {
  beforeEach(() => {
    subscribeCallback = undefined;
    fromResponses = baseResponses();
  });

  it('computes the IoT response rate as a rounded percentage of total devices', async () => {
    // The mock dispatches by table name only, so every sensor_devices query
    // (total, online, offline, low-battery, responding) resolves to the same
    // count: 10 here — response rate should come out to exactly 100%.
    const { result } = renderHook(() => useSystemHealth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.stats.devicesTotal).toBe(10);
    expect(result.current.stats.devicesResponding).toBe(10);
    expect(result.current.stats.responseRatePct).toBe(100);
  });

  it('reads paymentsToday from the payments table (not the retired payments_log)', async () => {
    const { result } = renderHook(() => useSystemHealth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.stats.paymentsToday).toBe(3);
  });

  it('returns 0% response rate when there are no devices at all', async () => {
    fromResponses = baseResponses({ sensor_devices: { count: 0, error: null } });
    const { result } = renderHook(() => useSystemHealth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.stats.responseRatePct).toBe(0);
  });

  it('summarizes edge_function_errors grouped by function, most-erroring first', async () => {
    fromResponses = baseResponses({
      edge_function_errors: {
        count: 3,
        data: [
          { function_name: 'verify-payment' },
          { function_name: 'iot-ingest' },
          { function_name: 'verify-payment' },
        ],
        error: null,
      },
    });
    const { result } = renderHook(() => useSystemHealth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.stats.edgeFunctionErrors).toEqual([
      { function_name: 'verify-payment', count: 2 },
      { function_name: 'iot-ingest', count: 1 },
    ]);
  });

  it('reflects the Realtime subscription status', async () => {
    const { result } = renderHook(() => useSystemHealth());
    await waitFor(() => expect(subscribeCallback).toBeDefined());

    subscribeCallback('SUBSCRIBED');
    await waitFor(() => expect(result.current.realtimeStatus).toBe('connected'));

    subscribeCallback('CHANNEL_ERROR');
    await waitFor(() => expect(result.current.realtimeStatus).toBe('error'));
  });
});
