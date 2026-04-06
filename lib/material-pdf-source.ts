import { readFile } from "node:fs/promises";
import path from "node:path";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/** Parse `.../storage/v1/object/public/<bucket>/<objectPath>` for our Supabase project. */
export function parseSupabasePublicObjectUrl(
  pdfPath: string,
  supabaseUrl: string | undefined,
): { bucket: string; objectPath: string } | null {
  if (!supabaseUrl?.trim()) return null;
  let u: URL;
  let b: URL;
  try {
    u = new URL(pdfPath);
    b = new URL(supabaseUrl);
  } catch {
    return null;
  }
  if (u.origin !== b.origin) return null;
  const prefix = "/storage/v1/object/public/";
  const p = u.pathname;
  if (!p.startsWith(prefix)) return null;
  const rest = p.slice(prefix.length);
  const i = rest.indexOf("/");
  if (i <= 0) return null;
  const bucket = rest.slice(0, i);
  const objectPath = rest.slice(i + 1);
  if (!objectPath) return null;
  return { bucket, objectPath };
}

export async function readLocalMaterialPdf(pdfPath: string): Promise<Buffer | null> {
  const prefix = "/uploads/materials/";
  if (!pdfPath.startsWith(prefix)) return null;
  const rel = pdfPath.slice(prefix.length);
  if (!rel || rel.includes("..")) return null;
  const baseDir = path.join(process.cwd(), "public", "uploads", "materials");
  const abs = path.resolve(path.join(baseDir, rel));
  const baseResolved = path.resolve(baseDir);
  if (abs !== baseResolved && !abs.startsWith(baseResolved + path.sep)) return null;
  try {
    return await readFile(abs);
  } catch {
    return null;
  }
}

/** Load bytes for a stored `pdfPath` (local `/uploads/...` or Supabase public object URL). */
export async function loadMaterialPdfBytes(pdfPath: string): Promise<Buffer | null> {
  const local = await readLocalMaterialPdf(pdfPath);
  if (local) return local;

  if (!pdfPath.startsWith("http")) return null;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const parsed = parseSupabasePublicObjectUrl(pdfPath, base);
  if (parsed && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    try {
      const supabase = createSupabaseAdminClient();
      const { data, error } = await supabase.storage.from(parsed.bucket).download(parsed.objectPath);
      if (!error && data) {
        return Buffer.from(await data.arrayBuffer());
      }
      if (error) {
        console.error("material-pdf-source: Supabase download:", error.message);
      }
    } catch (e) {
      console.error("material-pdf-source: Supabase client error:", e);
    }
  }

  try {
    const res = await fetch(pdfPath, { cache: "no-store" });
    if (res.ok) {
      return Buffer.from(await res.arrayBuffer());
    }
  } catch (e) {
    console.error("material-pdf-source: fetch error:", e);
  }

  return null;
}
