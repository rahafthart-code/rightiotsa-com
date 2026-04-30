// Input validation primitives shared across edge functions.
// Throws plain Errors — callers should catch and convert to 400 secureError responses.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// Saudi mobile: 05XXXXXXXX, +9665XXXXXXXX, or 9665XXXXXXXX
const SA_MOBILE_RE = /^(?:\+?966|0)?5\d{8}$/;

export function sanitizeText(input: unknown, maxLength = 1000): string {
  if (typeof input !== "string") throw new Error("Expected string input");
  return input
    .substring(0, maxLength)
    .replace(/[<>'"]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/\x00/g, "")
    .trim();
}

export function validateUUID(input: unknown): string {
  if (typeof input !== "string" || !UUID_RE.test(input)) {
    throw new Error("Invalid UUID format");
  }
  return input;
}

export function validateEmail(input: unknown): string {
  if (typeof input !== "string") throw new Error("Email must be a string");
  const trimmed = input.trim().toLowerCase();
  if (trimmed.length > 254 || !EMAIL_RE.test(trimmed)) {
    throw new Error("Invalid email address");
  }
  return trimmed;
}

export function validateSaudiMobile(input: unknown): string {
  if (typeof input !== "string") throw new Error("Mobile must be a string");
  const cleaned = input.replace(/[\s-]/g, "");
  if (!SA_MOBILE_RE.test(cleaned)) {
    throw new Error("Invalid Saudi mobile number");
  }
  // Normalize to +9665XXXXXXXX
  const digits = cleaned.replace(/^\+?966/, "").replace(/^0/, "");
  return `+966${digits}`;
}

/** Accepts either a Saudi mobile or an email and returns a normalized identifier. */
export function validateContactIdentifier(
  input: unknown,
): { kind: "email" | "mobile"; value: string } {
  if (typeof input !== "string") throw new Error("Identifier must be a string");
  const trimmed = input.trim();
  if (trimmed.includes("@")) {
    return { kind: "email", value: validateEmail(trimmed) };
  }
  return { kind: "mobile", value: validateSaudiMobile(trimmed) };
}

export function validateOtpCode(input: unknown, length = 6): string {
  if (typeof input !== "string") throw new Error("OTP must be a string");
  const cleaned = input.replace(/\D/g, "");
  if (cleaned.length < 4 || cleaned.length > length) {
    throw new Error("OTP must be 4–6 digits");
  }
  return cleaned;
}

export async function safeJson<T = unknown>(
  req: Request,
  maxBytes = 64 * 1024,
): Promise<T> {
  const len = req.headers.get("content-length");
  if (len && parseInt(len, 10) > maxBytes) {
    throw new Error("Request body too large");
  }
  const text = await req.text();
  if (text.length > maxBytes) throw new Error("Request body too large");
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Invalid JSON body");
  }
}

const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(previous|above|all)\s+instructions/i,
  /system\s*:/i,
  /you\s+are\s+now/i,
  /\[INST\]/i,
  /<<SYS>>/i,
  /forget\s+everything/i,
];

export function sanitizeAIInput(input: unknown, maxLength = 2000): string {
  const text = sanitizeText(input, maxLength);
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(text)) throw new Error("Potential prompt injection detected");
  }
  return text;
}
