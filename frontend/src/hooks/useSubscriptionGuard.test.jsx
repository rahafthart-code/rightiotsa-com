import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { mockSupabaseFrom } from '../test/supabaseMock';

const navigateMock = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => navigateMock };
});

let fromResponses;
vi.mock('../lib/supabaseClient', () => ({
  supabase: { from: (table) => mockSupabaseFrom(fromResponses)(table) },
}));

const { useSubscriptionGuard, LIMIT_MESSAGE_AR, LIMIT_MESSAGE_EN } = await import('./useSubscriptionGuard');

function wrapper({ children }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

describe('useSubscriptionGuard', () => {
  beforeEach(() => {
    navigateMock.mockClear();
    fromResponses = {
      subscriptions: {
        data: { plan: 'starter', status: 'active', max_assets: 5, max_stables: 1, max_devices: 5, current_period_end: '2027-01-01' },
        error: null,
      },
      assets: { count: 5, error: null },
      stables: { count: 1, error: null },
      sensor_devices: { count: 3, error: null },
    };
  });

  it('computes canAdd* flags from live counts against plan limits', async () => {
    const { result } = renderHook(() => useSubscriptionGuard('owner-1'), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.usage).toMatchObject({
      plan: 'starter',
      status: 'active',
      maxAssets: 5, usedAssets: 5, canAddAsset: false,
      maxStables: 1, usedStables: 1, canAddStable: false,
      maxDevices: 5, usedDevices: 3, canAddDevice: true,
      assetPct: 100,
    });
  });

  it('reads the device count from sensor_devices, not devices', async () => {
    // Regression test: admin-activated devices only ever land in
    // sensor_devices (admin-activate-device never writes to `devices`), so
    // counting from `devices` would silently under-count usage.
    fromResponses.devices = { count: 999, error: null }; // must NOT be used
    fromResponses.sensor_devices = { count: 2, error: null };

    const { result } = renderHook(() => useSubscriptionGuard('owner-1'), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.usage.usedDevices).toBe(2);
  });

  it('falls back to starter/trial defaults when there is no subscription row', async () => {
    fromResponses.subscriptions = { data: null, error: null };
    fromResponses.assets = { count: 0, error: null };
    fromResponses.stables = { count: 0, error: null };
    fromResponses.sensor_devices = { count: 0, error: null };

    const { result } = renderHook(() => useSubscriptionGuard('owner-1'), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.usage).toMatchObject({
      plan: 'starter', status: 'trial',
      maxAssets: 5, maxStables: 1, maxDevices: 5,
      canAddAsset: true, canAddStable: true, canAddDevice: true,
    });
  });

  it('does not fetch and reports loading:false when there is no ownerId', async () => {
    const { result } = renderHook(() => useSubscriptionGuard(undefined), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.usage).toBeNull();
  });

  it('guardAddAsset navigates to the upgrade page and returns false when over limit', async () => {
    const { result } = renderHook(() => useSubscriptionGuard('owner-1'), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    let allowed;
    act(() => { allowed = result.current.guardAddAsset(); });

    expect(allowed).toBe(false);
    expect(navigateMock).toHaveBeenCalledWith('/subscribe?upgrade=true&reason=asset_limit');
  });

  it('guardAddDevice allows and does not navigate when under limit', async () => {
    const { result } = renderHook(() => useSubscriptionGuard('owner-1'), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    let allowed;
    act(() => { allowed = result.current.guardAddDevice(); });

    expect(allowed).toBe(true);
    expect(navigateMock).not.toHaveBeenCalled();
  });

  describe('handleInsertError', () => {
    it('maps known Postgres trigger exceptions to Arabic messages', async () => {
      const { result } = renderHook(() => useSubscriptionGuard('owner-1'), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.handleInsertError({ message: 'ASSET_LIMIT_REACHED' }))
        .toMatch(/الأصول/);
      expect(result.current.handleInsertError({ message: 'STABLE_LIMIT_REACHED' }))
        .toMatch(/العزب/);
      expect(result.current.handleInsertError({ message: 'DEVICE_LIMIT_REACHED' }))
        .toMatch(/الأجهزة/);
      expect(result.current.handleInsertError({ message: 'NO_ACTIVE_SUBSCRIPTION' }))
        .toMatch(/اشتراك/);
    });

    it('passes through unrecognized error messages', async () => {
      const { result } = renderHook(() => useSubscriptionGuard('owner-1'), { wrapper });
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.handleInsertError({ message: 'network timeout' })).toBe('network timeout');
    });
  });

  it('exports the shared limit-message constants used across the app', () => {
    expect(LIMIT_MESSAGE_AR).toMatch(/الأقصى/);
    expect(LIMIT_MESSAGE_EN).toMatch(/plan limit/i);
  });
});
