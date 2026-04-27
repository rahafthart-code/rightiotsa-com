/**
 * Push Notifications + Low-Stability Watcher
 * - Subscribes to realtime sensor_readings.
 * - When stability_score < 70 it asks the SW to show a system notification.
 * - Falls back to in-tab Notification API if no SW is registered.
 */
import { supabase } from '../lib/supabaseClient';

const STORAGE_KEY = 'right_push_optin_v1';
const COOLDOWN_KEY = 'right_push_cooldown_v1';
const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes per asset
const THRESHOLD = 70;

export function isPushSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getPushOptIn() {
  try { return localStorage.getItem(STORAGE_KEY) === '1'; } catch { return false; }
}

export async function requestPushPermission() {
  if (!isPushSupported()) return 'unsupported';
  let perm = Notification.permission;
  if (perm === 'default') perm = await Notification.requestPermission();
  if (perm === 'granted') {
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch {}
  }
  return perm;
}

export function disablePush() {
  try { localStorage.setItem(STORAGE_KEY, '0'); } catch {}
}

function shouldNotify(assetId) {
  try {
    const raw = localStorage.getItem(COOLDOWN_KEY);
    const map = raw ? JSON.parse(raw) : {};
    const last = map[assetId] || 0;
    if (Date.now() - last < COOLDOWN_MS) return false;
    map[assetId] = Date.now();
    localStorage.setItem(COOLDOWN_KEY, JSON.stringify(map));
    return true;
  } catch { return true; }
}

async function showNotif({ title, body, url, tag }) {
  if (!isPushSupported() || Notification.permission !== 'granted') return;
  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      // Prefer active SW so the notification works even if the tab is closed
      if (reg && reg.active) {
        reg.active.postMessage({ type: 'SHOW_NOTIFICATION', title, body, url, tag });
        return;
      }
    } catch {}
  }
  try { new Notification(title, { body, tag, dir: 'rtl', lang: 'ar' }); } catch {}
}

let channel = null;
let started = false;

/**
 * Start listening to all sensor_readings inserts and notify on low stability.
 * Safe to call multiple times — only one channel will be active.
 */
export function startStabilityWatcher() {
  if (started || !isPushSupported()) return () => {};
  started = true;

  channel = supabase
    .channel('stability-watch')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sensor_readings' }, async (payload) => {
      if (!getPushOptIn() || Notification.permission !== 'granted') return;
      const r = payload.new || {};
      const score = r.stability_score == null ? null : Number(r.stability_score);
      if (score == null || Number.isNaN(score) || score >= THRESHOLD) return;
      const assetId = r.asset_id;
      if (!assetId || !shouldNotify(assetId)) return;

      // Look up the asset name (best-effort; respects RLS)
      let name = assetId.slice(0, 8);
      try {
        const { data } = await supabase.from('assets').select('name').eq('id', assetId).maybeSingle();
        if (data?.name) name = data.name;
      } catch {}

      await showNotif({
        title: '⚠️ تنبيه استقرار منخفض',
        body: `الأصل "${name}" انخفض إلى ${Math.round(score)}/100. افتح جواز السفر للمراجعة.`,
        url: `/passport/${assetId}`,
        tag: `stab-${assetId}`,
      });
    })
    .subscribe();

  return () => {
    try { supabase.removeChannel(channel); } catch {}
    channel = null;
    started = false;
  };
}
