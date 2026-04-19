/**
 * Returns a localized "x minutes ago" string in Arabic or English.
 * @param {string|Date|null} timestamp
 * @param {boolean} isAr
 */
export function timeAgo(timestamp, isAr = true) {
  if (!timestamp) return isAr ? 'لم يُسجَّل بعد' : 'Never';
  const then = new Date(timestamp).getTime();
  if (Number.isNaN(then)) return isAr ? 'غير متاح' : 'Unknown';
  const diffSec = Math.max(1, Math.floor((Date.now() - then) / 1000));

  if (diffSec < 60) {
    return isAr ? `نشط الآن` : 'Active now';
  }
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return isAr ? `نشط قبل ${diffMin} د` : `Active ${diffMin} min ago`;
  }
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) {
    return isAr ? `نشط قبل ${diffHr} س` : `Active ${diffHr} hr ago`;
  }
  const diffDay = Math.floor(diffHr / 24);
  return isAr ? `نشط قبل ${diffDay} ي` : `Active ${diffDay} d ago`;
}
