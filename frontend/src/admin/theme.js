// Scoped dark theme tokens for the Admin Panel.
// Mirrors OwnerDashboardDark palette but with a red accent (#E24B4A) to
// visually distinguish admin context from owner context.
export const ADMIN_BG = '#090d17';
export const ADMIN_PANEL = '#0f1626';
export const ADMIN_PANEL_2 = '#131c30';
export const ADMIN_BORDER = '#1c2640';
export const ADMIN_TEXT = '#f2efe3';
export const ADMIN_MUTED = '#7d8499';
export const ADMIN_RED = '#E24B4A';
export const ADMIN_RED_DIM = 'rgba(226,75,74,0.14)';
export const ADMIN_GOLD = '#d4af37';
export const ADMIN_GREEN = '#22c55e';
export const ADMIN_AMBER = '#f59e0b';

export function relTime(iso, isAr = true) {
  if (!iso) return isAr ? '—' : 'n/a';
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return isAr ? 'الآن' : 'just now';
  if (m < 60) return isAr ? `منذ ${m}د` : `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return isAr ? `منذ ${h}س` : `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return isAr ? `منذ ${d} يوم` : `${d}d`;
  const mo = Math.floor(d / 30);
  return isAr ? `منذ ${mo} شهر` : `${mo}mo`;
}

export function planBadge(plan) {
  switch (plan) {
    case 'enterprise':
      return { label: 'Enterprise', bg: 'rgba(212,175,55,0.16)', fg: '#e6c75a' };
    case 'pro':
      return { label: 'Pro', bg: 'rgba(34,197,94,0.16)', fg: '#5eea93' };
    case 'starter':
    default:
      return { label: 'Starter', bg: 'rgba(125,132,153,0.16)', fg: '#a8b0c4' };
  }
}

export function statusBadge(status) {
  switch (status) {
    case 'active':
      return { label: 'نشط', bg: 'rgba(34,197,94,0.16)', fg: '#5eea93' };
    case 'trial':
      return { label: 'تجربة', bg: 'rgba(212,175,55,0.16)', fg: '#e6c75a' };
    case 'suspended':
      return { label: 'موقوف', bg: 'rgba(226,75,74,0.16)', fg: '#ff7e7d' };
    case 'expired':
      return { label: 'منتهي', bg: 'rgba(125,132,153,0.16)', fg: '#a8b0c4' };
    default:
      return { label: status || '—', bg: 'rgba(125,132,153,0.16)', fg: '#a8b0c4' };
  }
}
