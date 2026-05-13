import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import DangerOverlay from './DangerOverlay';

/**
 * GlobalDangerOverlay — listens to `danger-alert` and `asset-danger` window
 * events from anywhere in the app and shows the full-screen DangerOverlay.
 * Mount once in ProtectedLayout.
 */
export default function GlobalDangerOverlay() {
  const [asset, setAsset] = useState(null);
  const dismissedRef = useRef(new Set());

  useEffect(() => {
    const handle = async (e) => {
      const detail = e.detail || {};
      const id = detail.asset_id || detail.id || detail.metadata?.asset_id;
      if (!id || dismissedRef.current.has(id)) return;

      // If full asset already provided, use it.
      if (detail.name && detail.species) {
        setAsset(detail);
        return;
      }

      // Otherwise hydrate from DB.
      const { data } = await supabase
        .from('assets')
        .select('id,name,species,photo_url,thumb_url,image_url,stability_index,status')
        .eq('id', id)
        .maybeSingle();
      if (data && !dismissedRef.current.has(data.id)) {
        setAsset(data);
      }
    };

    window.addEventListener('danger-alert', handle);
    window.addEventListener('asset-danger', handle);
    return () => {
      window.removeEventListener('danger-alert', handle);
      window.removeEventListener('asset-danger', handle);
    };
  }, []);

  const close = () => {
    if (asset) dismissedRef.current.add(asset.id);
    setAsset(null);
  };

  if (!asset) return null;
  return <DangerOverlay asset={asset} onClose={close} />;
}
