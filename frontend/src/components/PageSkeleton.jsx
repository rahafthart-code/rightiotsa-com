import React from 'react';

/**
 * Skeleton loader shown while lazy-loaded pages download.
 * Three pulsing dark cards on the app background.
 */
export default function PageSkeleton() {
  return (
    <div
      className="min-h-screen px-4 sm:px-6 py-8"
      style={{ background: 'var(--color-bg-primary, #faf7f0)' }}
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto space-y-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="rounded-2xl animate-pulse"
            style={{
              height: i === 0 ? 140 : 110,
              background:
                'linear-gradient(135deg, #1a1f2e 0%, #0f1320 100%)',
              border: '1px solid rgba(197,165,90,0.15)',
              opacity: 0.85,
            }}
          />
        ))}
      </div>
    </div>
  );
}
