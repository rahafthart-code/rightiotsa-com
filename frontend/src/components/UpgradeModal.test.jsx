import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';

const navigateMock = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ i18n: { language: 'ar' } }),
}));

const { default: UpgradeModal } = await import('./UpgradeModal');

function renderModal(props = {}) {
  return render(
    <MemoryRouter>
      <UpgradeModal open reason="asset" current={5} max={5} plan="starter" onClose={vi.fn()} {...props} />
    </MemoryRouter>,
  );
}

describe('UpgradeModal', () => {
  beforeEach(() => navigateMock.mockClear());

  it('renders nothing when open is false', () => {
    const { container } = render(
      <MemoryRouter>
        <UpgradeModal open={false} reason="asset" current={5} max={5} plan="starter" onClose={vi.fn()} />
      </MemoryRouter>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the asset-limit title and current/max usage', () => {
    renderModal({ reason: 'asset', current: 5, max: 5 });
    expect(screen.getByText('وصلت للحد الأقصى من الأصول')).toBeInTheDocument();
    expect(screen.getByText('5 / 5')).toBeInTheDocument();
  });

  it('shows the stable-limit title when reason is stable', () => {
    renderModal({ reason: 'stable', current: 1, max: 1 });
    expect(screen.getByText('وصلت للحد الأقصى من العزب')).toBeInTheDocument();
  });

  it('navigates to the correct upgrade route on CTA click', async () => {
    const user = userEvent.setup();
    renderModal({ reason: 'device', current: 5, max: 5 });

    await user.click(screen.getByText('ترقية الباقة الآن'));

    expect(navigateMock).toHaveBeenCalledWith('/subscribe?upgrade=true&reason=device_limit');
  });

  it('calls onClose when "Maybe later" is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderModal({ onClose });

    await user.click(screen.getByText('لاحقاً'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the backdrop is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    const { container } = renderModal({ onClose });

    await user.click(container.firstChild);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
