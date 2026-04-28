import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useAssets } from '../hooks/useAssets';
import { useStables } from '../hooks/useStables';
import AssetCard from '../components/AssetCard';

/**
 * Assets list page — shows every asset owned by the user as a grid of AssetCards,
 * with a Stable filter on top.
 */
export default function AssetsListPage() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { user } = useAuth();
  let ownerId = user?.id ?? '';
  if (!ownerId) {
    try { ownerId = JSON.parse(localStorage.getItem('user') || '{}').id ?? ''; } catch {}
  }
  const { assets, loading } = useAssets(ownerId);
  const { stables } = useStables(ownerId);

  const [stableFilter, setStableFilter] = useState('all'); // 'all' | 'unassigned' | <stable_id>

  const filtered = useMemo(() => {
    if (stableFilter === 'all') return assets;
    if (stableFilter === 'unassigned') return assets.filter((a) => !a.stable_id);
    return assets.filter((a) => a.stable_id === stableFilter);
  }, [assets, stableFilter]);

  const chips = [
    { id: 'all', label: isAr ? 'الكل' : 'All', count: assets.length, color: '#006c35' },
    ...stables.map((s) => ({
      id: s.id,
      label: isAr ? s.name : s.name_en || s.name,
      count: assets.filter((a) => a.stable_id === s.id).length,
      color: s.color || '#1D9E75',
    })),
    {
      id: 'unassigned',
      label: isAr ? 'بدون عزبة' : 'Unassigned',
      count: assets.filter((a) => !a.stable_id).length,
      color: '#9ca3af',
    },
  ];

  return (
    <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto" dir={isAr ? 'rtl' : 'ltr'}>
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#006c35' }}>
            {isAr ? 'الأصول' : 'Assets'}
          </h1>
          <p className="text-sm mt-1" style={{ color: '#6b6b6b' }}>
            {isAr ? 'جميع أصولك المسجلة في المنظومة' : 'All assets registered in your account'}
            {' · '}{filtered.length}/{assets.length}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/assets/new')}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-white font-bold text-sm shadow-sm"
          style={{ background: '#006c35' }}
        >
          + {isAr ? 'إضافة أصل' : 'Add Asset'}
        </button>
      </header>

      {/* Stable filter chips */}
      {stables.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {chips.map((c) => {
            const active = stableFilter === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setStableFilter(c.id)}
                className="px-3 py-1.5 rounded-full text-xs font-bold transition-all"
                style={{
                  background: active ? c.color : '#fff',
                  color: active ? '#fff' : c.color,
                  border: `1px solid ${c.color}66`,
                }}
              >
                {c.label}
                <span
                  className="ms-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-extrabold px-1"
                  style={{
                    background: active ? 'rgba(255,255,255,0.25)' : `${c.color}1a`,
                    color: active ? '#fff' : c.color,
                  }}
                >
                  {c.count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16" style={{ color: '#6b6b6b' }}>
          {isAr ? 'جارٍ التحميل...' : 'Loading...'}
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="text-center py-16 rounded-2xl"
          style={{ background: '#fff', border: '1px dashed rgba(0,108,53,0.3)' }}
        >
          <div className="text-5xl mb-3">🐪</div>
          <p style={{ color: '#6b6b6b' }} className="text-sm">
            {stableFilter === 'all'
              ? (isAr ? 'لا توجد أصول مسجلة بعد' : 'No assets registered yet')
              : (isAr ? 'لا توجد أصول في هذا التصنيف' : 'No assets in this filter')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              onClick={() => navigate(`/asset/${asset.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
