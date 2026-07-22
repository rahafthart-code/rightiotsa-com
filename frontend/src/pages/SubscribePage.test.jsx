import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const navigateMock = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ i18n: { language: 'ar', changeLanguage: vi.fn() } }),
}));

const getSessionMock = vi.fn();
const invokeMock = vi.fn();
const subscriptionsMaybeSingle = vi.fn().mockResolvedValue({ data: null });

vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    auth: { getSession: (...args) => getSessionMock(...args) },
    functions: { invoke: (...args) => invokeMock(...args) },
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: () => ({ maybeSingle: subscriptionsMaybeSingle }),
          }),
        }),
      }),
    }),
  },
}));

const { default: SubscribePage } = await import('./SubscribePage');

function renderPage() {
  return render(
    <MemoryRouter>
      <SubscribePage />
    </MemoryRouter>,
  );
}

describe('SubscribePage — handleSubscribe (create-payment flow)', () => {
  beforeEach(() => {
    navigateMock.mockClear();
    invokeMock.mockReset();
    getSessionMock.mockReset();
    delete window.location;
    window.location = { href: '' };
  });

  it('redirects to /login when there is no active session', async () => {
    getSessionMock.mockResolvedValue({ data: { session: null } });
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getAllByText('اشترك الآن')[0]);

    expect(invokeMock).not.toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith('/login', { state: { from: { pathname: '/subscribe' } } });
  });

  it('redirects the browser to the returned payment_url on success (mock or real)', async () => {
    getSessionMock.mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } });
    invokeMock.mockResolvedValue({ data: { payment_url: 'https://app.example/dashboard?payment=success&cart_id=abc', mock: true }, error: null });
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getAllByText('اشترك الآن')[0]);

    await waitFor(() => expect(window.location.href).toBe('https://app.example/dashboard?payment=success&cart_id=abc'));
    expect(invokeMock).toHaveBeenCalledWith('create-payment', { body: { plan_id: 'starter' } });
  });

  it('shows a setup-pending message when the gateway reports requires_setup', async () => {
    getSessionMock.mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } });
    invokeMock.mockResolvedValue({ data: { requires_setup: true }, error: null });
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getAllByText('اشترك الآن')[0]);

    expect(await screen.findByText(/قيد الربط النهائي/)).toBeInTheDocument();
    expect(window.location.href).toBe('');
  });

  it('shows an error message when create-payment itself errors', async () => {
    getSessionMock.mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } });
    invokeMock.mockResolvedValue({ data: null, error: { message: 'network down' } });
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getAllByText('اشترك الآن')[0]);

    expect(await screen.findByText('network down')).toBeInTheDocument();
  });
});
