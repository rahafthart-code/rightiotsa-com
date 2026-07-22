import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { mockSupabaseFrom } from '../../test/supabaseMock';

const navigateMock = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ i18n: { language: 'ar' } }),
}));

let fromResponses;
vi.mock('../../lib/supabaseClient', () => ({
  supabase: { from: (table) => mockSupabaseFrom(fromResponses)(table) },
}));

const { default: AddStableModal } = await import('./AddStableModal');

function renderModal(props = {}) {
  const onSubmit = vi.fn().mockResolvedValue({ id: 'stable-new' });
  const onCreated = vi.fn();
  const onClose = vi.fn();
  const utils = render(
    <MemoryRouter>
      <AddStableModal open onClose={onClose} ownerId="owner-1" onSubmit={onSubmit} onCreated={onCreated} isAr {...props} />
    </MemoryRouter>,
  );
  return { ...utils, onSubmit, onCreated, onClose };
}

describe('AddStableModal — plan-limit guard', () => {
  beforeEach(() => {
    navigateMock.mockClear();
  });

  it('shows the Upgrade modal instead of saving when at the stable limit', async () => {
    fromResponses = {
      subscriptions: { data: { plan: 'starter', max_stables: 1 }, error: null },
      stables: { count: 1, error: null },
    };
    const { onSubmit } = renderModal();
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('مثال: عزبة رماح'), 'مزرعتي');
    await user.click(screen.getByText('حفظ العزبة'));

    expect(await screen.findByText('وصلت للحد الأقصى من العزب')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('proceeds to save when under the stable limit', async () => {
    fromResponses = {
      subscriptions: { data: { plan: 'pro', max_stables: 5 }, error: null },
      stables: { count: 1, error: null },
    };
    const { onSubmit, onCreated, onClose } = renderModal();
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('مثال: عزبة رماح'), 'مزرعتي');
    await user.click(screen.getByText('حفظ العزبة'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: 'مزرعتي' })));
    expect(onCreated).toHaveBeenCalledWith({ id: 'stable-new' });
    expect(onClose).toHaveBeenCalled();
  });

  it('renders nothing when closed', () => {
    fromResponses = { subscriptions: { data: null, error: null }, stables: { count: 0, error: null } };
    const { container } = render(
      <MemoryRouter>
        <AddStableModal open={false} onClose={vi.fn()} ownerId="owner-1" isAr />
      </MemoryRouter>,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
