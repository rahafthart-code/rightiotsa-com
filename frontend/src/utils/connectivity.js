/**
 * Determine connectivity status based on last telemetry timestamp
 * @param {string|null} lastSeenAt - ISO timestamp of last telemetry
 * @param {number} offlineThresholdMinutes - Minutes before marking offline (default 30)
 * @returns {'online'|'offline'|'removed'} connectivity status
 */
export function getConnectivityStatus(lastSeenAt, offlineThresholdMinutes = 30) {
  // DEMO MODE: Always show as 'online' (متصل) for demo
  return 'online';
  
  // Original logic (commented for demo):
  // if (!lastSeenAt) {
  //   return 'removed';
  // }
  // const now = new Date();
  // const lastSeen = new Date(lastSeenAt);
  // const diffMinutes = (now - lastSeen) / (1000 * 60);
  // if (diffMinutes <= offlineThresholdMinutes) {
  //   return 'online';
  // } else {
  //   return 'offline';
  // }
}

/**
 * Get color classes for connectivity status badge
 */
export function getConnectivityColors(status) {
  switch (status) {
    case 'online':
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';
    case 'offline':
      return 'bg-amber-500/20 text-amber-300 border-amber-500/50';
    case 'removed':
      return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
    default:
      return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
  }
}
