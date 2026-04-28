import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../hooks/useAuth';
import { useAssets } from '../hooks/useAssets';
import AssetCard from '../components/AssetCard';

/**
 * Assets list page — shows every asset owned by the user as a grid of AssetCards.
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

  return (
    <div className="px-4 sm:px-6 py-6 max-w-7xl mx-auto">
      <header className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#006c35' }}>
            {isAr ? 'الأصول' : 'Assets'}
          </h1>
          <p className="text-sm mt-1" style={{ color: '#6b6b6b' }}>
            {isAr ? 'جميع أصولك المسجلة في المنظومة' : 'All assets registered in your account'}
            {' · '}{assets.length}
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

      {loading ? (
        <div className="text-center py-16" style={{ color: '#6b6b6b' }}>
          {isAr ? 'جارٍ التحميل...' : 'Loading...'}
        </div>
      ) : assets.length === 0 ? (
        <div
          className="text-center py-16 rounded-2xl"
          style={{ background: '#fff', border: '1px dashed rgba(0,108,53,0.3)' }}
        >
          <div className="text-5xl mb-3">🐪</div>
          <p style={{ color: '#6b6b6b' }} className="text-sm">
            {isAr ? 'لا توجد أصول مسجلة بعد' : 'No assets registered yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {assets.map((asset) => (
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
