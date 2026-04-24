import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { formatSupabaseStorageRef } from "@/lib/material-storage-ref";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "materials";

/** Max PDF size for admin upload (bytes). */
export const PDF_UPLOAD_MAX_BYTES = 25 * 1024 * 1024;

function isSupabaseStorageConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(url?.trim() && key?.trim());
}

function looksLikePdf(buffer: Buffer) {
  const n = Math.min(2048, buffer.length);
  if (n < 5) return false;
  return buffer.subarray(0, n).toString("binary").includes("%PDF");
}

export type UploadPdfResult = { path: string };

async function savePdfToLocalPublic(objectName: string, buffer: Buffer): Promise<UploadPdfResult> {
  const dir = path.join(process.cwd(), "public", "uploads", "materials");
  await mkdir(dir, { recursive: true });
  const filePath = path.join(dir, objectName);
  await writeFile(filePath, buffer);
  return { path: `/uploads/materials/${objectName}` };
}

/** When the project has API keys but Storage bucket was never created (or name mismatches env). */
function supabaseErrorSuggestsMissingOrWrongBucket(message: string) {
  const m = message.toLowerCase();
  return (
    m.includes("bucket not found") ||
    m.includes("bucket does not exist") ||
    m.includes("invalid bucket") ||
    (m.includes("not found") && m.includes("bucket"))
  );
}

/**
 * Stores a PDF either in Supabase Storage (when configured) or under
 * `public/uploads/materials/` so `/uploads/materials/...` is served statically.
 */
export async function uploadPdfBuffer(buffer: Buffer): Promise<UploadPdfResult> {
  if (buffer.length > PDF_UPLOAD_MAX_BYTES) {
    const err = new Error("FILE_TOO_LARGE");
    throw err;
  }
  if (!looksLikePdf(buffer)) {
    const err = new Error("INVALID_PDF");
    throw err;
  }

  const objectName = `${randomUUID()}.pdf`;

  if (!isSupabaseStorageConfigured()) {
    return savePdfToLocalPublic(objectName, buffer);
  }

  const supabase = createSupabaseAdminClient();
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(objectName, buffer, {
    contentType: "application/pdf",
    upsert: false,
  });

  if (!uploadError) {
    return { path: formatSupabaseStorageRef(BUCKET, objectName) };
  }

  if (supabaseErrorSuggestsMissingOrWrongBucket(uploadError.message)) {
    console.warn(
      `[upload-pdf] Supabase bucket "${BUCKET}" unavailable (${uploadError.message}). Saving PDF locally under public/uploads/materials/. Create a public bucket named "${BUCKET}" in Supabase → Storage for production.`,
    );
    return savePdfToLocalPublic(objectName, buffer);
  }

  console.error("Supabase storage upload:", uploadError.message);
  const err = new Error("STORAGE_FAILED");
  throw err;
}
