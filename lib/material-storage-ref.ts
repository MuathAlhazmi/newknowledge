/**
 * Canonical non-https storage reference for Supabase uploads (same-origin policy in the browser).
 * Format: `supabase:<bucket>:<objectPath>` — objectPath must not contain `:`.
 */
const SUPABASE_REF_PREFIX = "supabase:";

export function formatSupabaseStorageRef(bucket: string, objectPath: string): string {
  const b = bucket.trim();
  const o = objectPath.trim();
  if (!b || !o || o.includes(":")) {
    throw new Error("INVALID_STORAGE_REF");
  }
  return `${SUPABASE_REF_PREFIX}${b}:${o}`;
}

export function parseSupabaseStorageRef(ref: string): { bucket: string; objectPath: string } | null {
  const s = ref.trim();
  if (!s.startsWith(SUPABASE_REF_PREFIX)) return null;
  const rest = s.slice(SUPABASE_REF_PREFIX.length);
  const i = rest.indexOf(":");
  if (i <= 0 || i >= rest.length - 1) return null;
  const bucket = rest.slice(0, i);
  const objectPath = rest.slice(i + 1);
  if (!bucket || !objectPath || objectPath.includes(":")) return null;
  return { bucket, objectPath };
}
