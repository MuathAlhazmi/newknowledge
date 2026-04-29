import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { requireInstructor } from "@/lib/auth";
import { formatSupabaseStorageRef } from "@/lib/material-storage-ref";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { DOCX_UPLOAD_MAX_BYTES } from "@/lib/upload-docx";
import { PDF_UPLOAD_MAX_BYTES } from "@/lib/upload-pdf";

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "materials";

type UploadKind = "pdf" | "docx";

function inferUploadKind(filename: string, mime: string | null | undefined): UploadKind | null {
  const name = filename.toLowerCase();
  if (name.endsWith(".docx")) return "docx";
  if (name.endsWith(".pdf")) return "pdf";
  const m = (mime ?? "").toLowerCase();
  if (m === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") return "docx";
  if (m === "application/pdf") return "pdf";
  return null;
}

function isSupabaseStorageConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(url?.trim() && key?.trim());
}

function looksLikeMissingBucket(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("bucket not found") ||
    m.includes("bucket does not exist") ||
    m.includes("invalid bucket") ||
    (m.includes("not found") && m.includes("bucket"))
  );
}

export async function POST(req: Request) {
  await requireInstructor();

  let body: { filename?: unknown; mime?: unknown; size?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "INVALID_BODY", code: "INVALID_BODY" }, { status: 400 });
  }

  const filename = typeof body.filename === "string" ? body.filename.trim() : "";
  const mime = typeof body.mime === "string" ? body.mime : "";
  const size = typeof body.size === "number" && Number.isFinite(body.size) ? body.size : -1;
  if (!filename || size < 0) {
    return NextResponse.json({ error: "INVALID_BODY", code: "INVALID_BODY" }, { status: 400 });
  }

  const kind = inferUploadKind(filename, mime);
  if (!kind) {
    return NextResponse.json(
      { error: "UNSUPPORTED_TYPE", code: "UNSUPPORTED_TYPE" },
      { status: 400 },
    );
  }

  const maxBytes = kind === "pdf" ? PDF_UPLOAD_MAX_BYTES : DOCX_UPLOAD_MAX_BYTES;
  if (size > maxBytes) {
    return NextResponse.json(
      { error: "FILE_TOO_LARGE", code: "FILE_TOO_LARGE", maxBytes },
      { status: 413 },
    );
  }

  if (!isSupabaseStorageConfigured()) {
    return NextResponse.json({ fallback: true, kind });
  }

  const objectName = `${randomUUID()}.${kind}`;
  const contentType =
    kind === "pdf"
      ? "application/pdf"
      : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(objectName);

  if (error) {
    if (looksLikeMissingBucket(error.message)) {
      console.warn(
        `[upload-sign] Supabase bucket "${BUCKET}" unavailable (${error.message}). Falling back to /api/upload.`,
      );
      return NextResponse.json({ fallback: true, kind });
    }
    console.error("[upload-sign] createSignedUploadUrl failed:", error.message);
    return NextResponse.json({ error: "SIGN_FAILED", code: "SIGN_FAILED" }, { status: 500 });
  }

  return NextResponse.json({
    fallback: false,
    kind,
    bucket: BUCKET,
    objectName,
    signedUrl: data.signedUrl,
    token: data.token,
    storageRef: formatSupabaseStorageRef(BUCKET, objectName),
    contentType,
    maxBytes,
  });
}
