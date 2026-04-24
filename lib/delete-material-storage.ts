import { unlink } from "node:fs/promises";
import path from "node:path";
import { parseSupabasePublicObjectUrl } from "@/lib/material-pdf-source";
import { parseSupabaseStorageRef } from "@/lib/material-storage-ref";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Best-effort removal of a stored material file (local `public/uploads/materials/`, `supabase:...`, or legacy public URL).
 * Swallows errors so DB operations can still complete if cleanup fails.
 */
export async function deleteStoredMaterialFile(storagePath: string): Promise<void> {
  const p = storagePath.trim();
  if (!p) return;

  const localPrefix = "/uploads/materials/";
  if (p.startsWith(localPrefix)) {
    const rel = p.slice(localPrefix.length);
    if (!rel || rel.includes("..")) return;
    const baseDir = path.join(process.cwd(), "public", "uploads", "materials");
    const abs = path.resolve(path.join(baseDir, rel));
    const baseResolved = path.resolve(baseDir);
    if (abs !== baseResolved && !abs.startsWith(baseResolved + path.sep)) return;
    try {
      await unlink(abs);
    } catch (e) {
      const code = e && typeof e === "object" && "code" in e ? (e as NodeJS.ErrnoException).code : "";
      if (code !== "ENOENT") {
        console.warn("[delete-material-storage] local unlink:", e);
      }
    }
    return;
  }

  const refParsed = parseSupabaseStorageRef(p);
  if (refParsed && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    try {
      const supabase = createSupabaseAdminClient();
      const { error } = await supabase.storage.from(refParsed.bucket).remove([refParsed.objectPath]);
      if (error) {
        console.warn("[delete-material-storage] Supabase remove:", error.message);
      }
    } catch (e) {
      console.warn("[delete-material-storage] Supabase remove failed:", e);
    }
    return;
  }

  if (!p.startsWith("http")) {
    console.warn("[delete-material-storage] unknown path shape, skip:", p.slice(0, 80));
    return;
  }

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const parsed = parseSupabasePublicObjectUrl(p, base);
  if (!parsed || !process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) return;

  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.storage.from(parsed.bucket).remove([parsed.objectPath]);
    if (error) {
      console.warn("[delete-material-storage] Supabase remove:", error.message);
    }
  } catch (e) {
    console.warn("[delete-material-storage] Supabase remove failed:", e);
  }
}
