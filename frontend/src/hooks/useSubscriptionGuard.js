import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

/**
 * Subscription guard — reads plan limits from `subscriptions` and live counts from
 * `assets` / `stables` / `devices`, exposes can-add booleans + upgrade redirect.
 *
 * Returns: { usage, loading, refetch, guardAddAsset, guardAddStable, guardAddDevice, handleInsertError }
 */
export function useSubscriptionGuard(ownerId) {
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    if (!ownerId) { setLoading(false); return; }
    setLoading(true);

    const [subRes, aRes, sRes, dRes] = await Promise.all([
      supabase
        .from('subscriptions')
        .select('plan,status,max_assets,max_stables,max_devices,current_period_end,trial_ends_at')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from('assets').select('id', { count: 'exact', head: true })
        .eq('owner_id', ownerId).eq('is_active', true),
      supabase.from('stables').select('id', { count: 'exact', head: true })
        .eq('owner_id', ownerId).eq('is_active', true),
      supabase.from('devices').select('id', { count: 'exact', head: true })
        .eq('owner_id', ownerId).eq('is_active', true),
    ]);

    const sub = subRes.data || {};
    const maxAssets  = sub.max_assets  ?? 5;
    const maxStables = sub.max_stables ?? 1;
    const maxDevices = sub.max_devices ?? 5;
    const usedAssets  = aRes.count ?? 0;
    const usedStables = sRes.count ?? 0;
    const usedDevices = dRes.count ?? 0;

    setUsage({
      plan:         sub.plan         ?? 'starter',
      status:       sub.status       ?? 'trial',
      maxAssets, usedAssets,
      maxStables, usedStables,
      maxDevices, usedDevices,
      periodEnd:    sub.current_period_end ?? sub.trial_ends_at ?? null,
      canAddAsset:  usedAssets  < maxAssets,
      canAddStable: usedStables < maxStables,
      canAddDevice: usedDevices < maxDevices,
      assetPct:     maxAssets > 0 ? Math.min(100, Math.round((usedAssets / maxAssets) * 100)) : 0,
    });
    setLoading(false);
  }, [ownerId]);

  useEffect(() => { load(); }, [load]);

  const guardAddAsset = useCallback(() => {
    if (!usage?.canAddAsset) {
      navigate('/subscribe?upgrade=true&reason=asset_limit');
      return false;
    }
    return true;
  }, [usage, navigate]);

  const guardAddStable = useCallback(() => {
    if (!usage?.canAddStable) {
      navigate('/subscribe?upgrade=true&reason=stable_limit');
      return false;
    }
    return true;
  }, [usage, navigate]);

  const guardAddDevice = useCallback(() => {
    if (!usage?.canAddDevice) {
      navigate('/subscribe?upgrade=true&reason=device_limit');
      return false;
    }
    return true;
  }, [usage, navigate]);

  const handleInsertError = useCallback((error) => {
    const msg = error?.message || '';
    if (msg.includes('ASSET_LIMIT_REACHED'))
      return 'وصلت للحد الأقصى من الأصول في باقتك. يرجى الترقية.';
    if (msg.includes('STABLE_LIMIT_REACHED'))
      return 'وصلت للحد الأقصى من العزب في باقتك. يرجى الترقية.';
    if (msg.includes('DEVICE_LIMIT_REACHED'))
      return 'وصلت للحد الأقصى من الأجهزة. يرجى الترقية.';
    if (msg.includes('NO_ACTIVE_SUBSCRIPTION'))
      return 'لا يوجد اشتراك نشط. يرجى الاشتراك أولاً.';
    return msg || 'حدث خطأ غير متوقع';
  }, []);

  return { usage, loading, refetch: load, guardAddAsset, guardAddStable, guardAddDevice, handleInsertError };
}
