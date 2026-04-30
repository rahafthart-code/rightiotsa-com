// L4: lightweight client-side input sanitizer.
// Mirrors the rules of supabase/functions/_shared/validators.ts:sanitizeText.

export function sanitize(value, maxLength = 500) {
  if (typeof value !== "string") return "";
  return value
    .substring(0, maxLength)
    .replace(/[<>'"]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/\x00/g, "")
    .trim();
}

// Use for free-text fields where punctuation matters (notes, names) — keeps
// quotes but strips angle brackets + script-like protocols.
export function sanitizeRich(value, maxLength = 2000) {
  if (typeof value !== "string") return "";
  return value
    .substring(0, maxLength)
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/\x00/g, "");
}
