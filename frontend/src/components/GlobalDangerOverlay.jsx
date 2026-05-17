import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import DangerOverlay from './DangerOverlay';

/**
 * GlobalDangerOverlay — mounted once at the protected-app root.
 *  • Listens to window events (`danger-alert`, `asset-danger`).
 *  • Also subscribes to Realtime INSERTs on `notifications` for the current
 *    user and triggers when type is danger_alert / zone_breach.
 */
export default function GlobalDangerOverlay() {
  const [asset, setAsset] = useState(null);
  const dismissedRef = useRef(new Set());

  const hydrateAndShow = async (assetId) => {
    if (!assetId || dismissedRef.current.has(assetId)) return;
    const { data } = await supabase
      .from('assets')
      .select('id,name,species,photo_url,thumb_url,image_url,stability_index,status')
      .eq('id', assetId)
      .maybeSingle();
    if (data && !dismissedRef.current.has(data.id)) setAsset(data);
  };

  useEffect(() => {
    const handle = async (e) => {
      const detail = e.detail || {};
      const id = detail.asset_id || detail.id || detail.metadata?.asset_id;
      if (!id || dismissedRef.current.has(id)) return;
      if (detail.name && detail.species) { setAsset(detail); return; }
      hydrateAndShow(id);
    };

    window.addEventListener('danger-alert', handle);
    window.addEventListener('asset-danger', handle);

    // Realtime: listen for critical notifications inserted for this user
    let channel = null;
    let cancelled = false;
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (cancelled || !user?.id) return;
      channel = supabase
        .channel(`danger-global-${user.id}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `owner_id=eq.${user.id}` },
          ({ new: notif }) => {
            if (!notif) return;
            if (notif.type !== 'danger_alert' && notif.type !== 'zone_breach') return;
            hydrateAndShow(notif.asset_id);
          },
        )
        .subscribe();
    });

    return () => {
      cancelled = true;
      window.removeEventListener('danger-alert', handle);
      window.removeEventListener('asset-danger', handle);
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const close = () => {
    if (asset) dismissedRef.current.add(asset.id);
    setAsset(null);
  };

  if (!asset) return null;
  return <DangerOverlay asset={asset} onClose={close} />;
}
