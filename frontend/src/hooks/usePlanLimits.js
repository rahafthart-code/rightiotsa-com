import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

/**
 * Loads the current user's subscription + current asset/stable counts,
 * then exposes whether they can add more before hitting plan limits.
 *
 * Returns:
 *   { loading, subscription, assetsCount, stablesCount,
 *     maxAssets, maxStables, canAddAsset, canAddStable, refetch }
 */
export function usePlanLimits(ownerId) {
  const [state, setState] = useState({
    loading: true,
    subscription: null,
    assetsCount: 0,
    stablesCount: 0,
  });

  const load = useCallback(async () => {
    if (!ownerId) {
      setState({ loading: false, subscription: null, assetsCount: 0, stablesCount: 0 });
      return;
    }
    setState((s) => ({ ...s, loading: true }));
    const [sub, a, st] = await Promise.all([
      supabase
        .from('subscriptions')
        .select('*')
        .eq('owner_id', ownerId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('assets')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', ownerId)
        .eq('is_active', true),
      supabase
        .from('stables')
        .select('id', { count: 'exact', head: true })
        .eq('owner_id', ownerId)
        .eq('is_active', true),
    ]);
    setState({
      loading: false,
      subscription: sub.data ?? null,
      assetsCount: a.count ?? 0,
      stablesCount: st.count ?? 0,
    });
  }, [ownerId]);

  useEffect(() => { load(); }, [load]);

  const maxAssets = state.subscription?.max_assets ?? 5;
  const maxStables = state.subscription?.max_stables ?? 1;
  const canAddAsset = state.assetsCount < maxAssets;
  const canAddStable = state.stablesCount < maxStables;

  return {
    ...state,
    maxAssets,
    maxStables,
    canAddAsset,
    canAddStable,
    refetch: load,
  };
}

export const LIMIT_MESSAGE_AR = 'لقد وصلت للحد الأقصى المسموح به في باقتك، يرجى الترقية لإضافة المزيد';
export const LIMIT_MESSAGE_EN = 'You have reached your plan limit. Please upgrade to add more.';
