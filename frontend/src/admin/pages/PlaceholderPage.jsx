import React from 'react';
import { ADMIN_PANEL, ADMIN_BORDER, ADMIN_TEXT, ADMIN_MUTED } from '../theme';

export default function PlaceholderPage({ title, subtitle }) {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: ADMIN_TEXT }}>{title}</h1>
        <p className="text-sm mt-1" style={{ color: ADMIN_MUTED }}>{subtitle}</p>
      </div>
      <div className="rounded-2xl p-10 text-center" style={{ background: ADMIN_PANEL, border: `1px solid ${ADMIN_BORDER}`, color: ADMIN_MUTED }}>
        قريباً
      </div>
    </div>
  );
}
