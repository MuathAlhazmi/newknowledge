import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseSupabaseStorageRef } from "@/lib/material-storage-ref";
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

async function downloadFromSupabaseRef(bucket: string, objectPath: string): Promise<Buffer | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) return null;
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase.storage.from(bucket).download(objectPath);
    if (!error && data) {
      return Buffer.from(await data.arrayBuffer());
    }
    if (error) {
      console.error("material-pdf-source: Supabase download:", error.message);
    }
  } catch (e) {
    console.error("material-pdf-source: Supabase client error:", e);
  }
  return null;
}

/** Load bytes for stored material `filePath` (local `/uploads/...`, `supabase:bucket:key`, or legacy https URL). */
export async function loadMaterialPdfBytes(filePath: string): Promise<Buffer | null> {
  const local = await readLocalMaterialPdf(filePath);
  if (local) return local;

  const refParsed = parseSupabaseStorageRef(filePath);
  if (refParsed) {
    return downloadFromSupabaseRef(refParsed.bucket, refParsed.objectPath);
  }

  if (!filePath.startsWith("http")) return null;

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const parsed = parseSupabasePublicObjectUrl(filePath, base);
  if (parsed && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    const fromSvc = await downloadFromSupabaseRef(parsed.bucket, parsed.objectPath);
    if (fromSvc) return fromSvc;
  }

  try {
    const res = await fetch(filePath, { cache: "no-store" });
    if (res.ok) {
      return Buffer.from(await res.arrayBuffer());
    }
  } catch (e) {
    console.error("material-pdf-source: fetch error:", e);
  }

  return null;
}
