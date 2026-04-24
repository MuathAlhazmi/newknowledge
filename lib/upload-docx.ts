import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { formatSupabaseStorageRef } from "@/lib/material-storage-ref";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "materials";

export const DOCX_UPLOAD_MAX_BYTES = 25 * 1024 * 1024;

function isSupabaseStorageConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(url?.trim() && key?.trim());
}

/** DOCX is an OOXML ZIP package (same leading bytes as other Office Open XML). */
function looksLikeDocxZip(buffer: Buffer) {
  if (buffer.length < 4) return false;
  return buffer[0] === 0x50 && buffer[1] === 0x4b && (buffer[2] === 0x03 || buffer[2] === 0x05 || buffer[2] === 0x07);
}

export type UploadDocxResult = { path: string };

async function saveDocxToLocalPublic(objectName: string, buffer: Buffer): Promise<UploadDocxResult> {
  const dir = path.join(process.cwd(), "public", "uploads", "materials");
  await mkdir(dir, { recursive: true });
  const filePath = path.join(dir, objectName);
  await writeFile(filePath, buffer);
  return { path: `/uploads/materials/${objectName}` };
}

function supabaseErrorSuggestsMissingOrWrongBucket(message: string) {
  const m = message.toLowerCase();
  return (
    m.includes("bucket not found") ||
    m.includes("bucket does not exist") ||
    m.includes("invalid bucket") ||
    (m.includes("not found") && m.includes("bucket"))
  );
}

export async function uploadDocxBuffer(buffer: Buffer): Promise<UploadDocxResult> {
  if (buffer.length > DOCX_UPLOAD_MAX_BYTES) {
    throw new Error("FILE_TOO_LARGE");
  }
  if (!looksLikeDocxZip(buffer)) {
    throw new Error("INVALID_DOCX");
  }

  const objectName = `${randomUUID()}.docx`;

  if (!isSupabaseStorageConfigured()) {
    return saveDocxToLocalPublic(objectName, buffer);
  }

  const supabase = createSupabaseAdminClient();
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(objectName, buffer, {
    contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    upsert: false,
  });

  if (!uploadError) {
    return { path: formatSupabaseStorageRef(BUCKET, objectName) };
  }

  if (supabaseErrorSuggestsMissingOrWrongBucket(uploadError.message)) {
    console.warn(
      `[upload-docx] Supabase bucket "${BUCKET}" unavailable (${uploadError.message}). Saving DOCX locally under public/uploads/materials/.`,
    );
    return saveDocxToLocalPublic(objectName, buffer);
  }

  console.error("Supabase storage upload (docx):", uploadError.message);
  throw new Error("STORAGE_FAILED");
}
