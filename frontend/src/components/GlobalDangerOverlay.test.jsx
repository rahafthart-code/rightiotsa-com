import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';

vi.mock('./DangerOverlay', () => ({
  default: ({ asset, onClose }) => (
    <div data-testid="danger-overlay">
      <span>{asset.name}</span>
      <button onClick={onClose}>close</button>
    </div>
  ),
}));

let capturedHandler;
const subscribeMock = vi.fn();
const removeChannelMock = vi.fn();
const getUserMock = vi.fn();
let assetResponse;

const channelMock = {
  on: (_event, _filter, handler) => {
    capturedHandler = handler;
    return channelMock;
  },
  subscribe: (...args) => {
    subscribeMock(...args);
    return channelMock;
  },
};

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    auth: { getUser: (...args) => getUserMock(...args) },
    channel: () => channelMock,
    removeChannel: (...args) => removeChannelMock(...args),
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: () => Promise.resolve(assetResponse) }),
      }),
    }),
  },
}));

const { default: GlobalDangerOverlay } = await import('./GlobalDangerOverlay');

async function fireNotification(notif) {
  await act(async () => {
    capturedHandler({ new: notif });
    await Promise.resolve();
  });
}

describe('GlobalDangerOverlay', () => {
  beforeEach(() => {
    capturedHandler = undefined;
    subscribeMock.mockClear();
    removeChannelMock.mockClear();
    getUserMock.mockReset().mockResolvedValue({ data: { user: { id: 'owner-1' } } });
    assetResponse = { data: { id: 'asset-1', name: 'وضحى', species: 'Camel', stability_index: 40 } };
  });

  it('renders nothing until a critical notification arrives', async () => {
    render(<GlobalDangerOverlay />);
    await waitFor(() => expect(capturedHandler).toBeDefined());
    expect(screen.queryByTestId('danger-overlay')).not.toBeInTheDocument();
  });

  it('shows the overlay for a danger_alert notification', async () => {
    render(<GlobalDangerOverlay />);
    await waitFor(() => expect(capturedHandler).toBeDefined());

    await fireNotification({ type: 'danger_alert', asset_id: 'asset-1' });

    expect(await screen.findByTestId('danger-overlay')).toBeInTheDocument();
    expect(screen.getByText('وضحى')).toBeInTheDocument();
  });

  it('shows the overlay for a zone_breach notification', async () => {
    render(<GlobalDangerOverlay />);
    await waitFor(() => expect(capturedHandler).toBeDefined());

    await fireNotification({ type: 'zone_breach', asset_id: 'asset-1' });

    expect(await screen.findByTestId('danger-overlay')).toBeInTheDocument();
  });

  it('ignores non-critical notification types', async () => {
    render(<GlobalDangerOverlay />);
    await waitFor(() => expect(capturedHandler).toBeDefined());

    await fireNotification({ type: 'daily_update', asset_id: 'asset-1' });

    expect(screen.queryByTestId('danger-overlay')).not.toBeInTheDocument();
  });

  it('does not reopen for an asset that was already dismissed', async () => {
    render(<GlobalDangerOverlay />);
    await waitFor(() => expect(capturedHandler).toBeDefined());

    await fireNotification({ type: 'danger_alert', asset_id: 'asset-1' });
    expect(await screen.findByTestId('danger-overlay')).toBeInTheDocument();

    await act(async () => { screen.getByText('close').click(); });
    expect(screen.queryByTestId('danger-overlay')).not.toBeInTheDocument();

    // Same asset fires again — should stay dismissed for this session.
    await fireNotification({ type: 'danger_alert', asset_id: 'asset-1' });
    expect(screen.queryByTestId('danger-overlay')).not.toBeInTheDocument();
  });

  it('does nothing when there is no signed-in user', async () => {
    getUserMock.mockResolvedValue({ data: { user: null } });
    render(<GlobalDangerOverlay />);

    // Give the effect a tick to resolve; the channel should never subscribe.
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    expect(subscribeMock).not.toHaveBeenCalled();
  });
});
