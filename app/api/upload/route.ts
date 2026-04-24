import { NextResponse } from "next/server";
import { requireInstructor } from "@/lib/auth";
import { DOCX_UPLOAD_MAX_BYTES, uploadDocxBuffer } from "@/lib/upload-docx";
import { PDF_UPLOAD_MAX_BYTES, uploadPdfBuffer } from "@/lib/upload-pdf";

function inferUploadKind(file: File): "pdf" | "docx" | null {
  const name = file.name.toLowerCase();
  if (name.endsWith(".docx")) return "docx";
  if (name.endsWith(".pdf")) return "pdf";
  const mime = (file.type || "").toLowerCase();
  if (mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return "docx";
  }
  if (mime === "application/pdf") return "pdf";
  return null;
}

export async function POST(req: Request) {
  await requireInstructor();

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "INVALID_FILE", code: "INVALID_FILE" }, { status: 400 });
  }

  const inferred = inferUploadKind(file);
  if (!inferred) {
    return NextResponse.json(
      { error: "UNSUPPORTED_TYPE", code: "UNSUPPORTED_TYPE" },
      { status: 400 },
    );
  }

  const kindRaw = formData.get("kind");
  const expected =
    kindRaw == null || kindRaw === ""
      ? null
      : String(kindRaw).toLowerCase() === "docx"
        ? "docx"
        : String(kindRaw).toLowerCase() === "pdf"
          ? "pdf"
          : null;
  if (expected && expected !== inferred) {
    return NextResponse.json({ error: "KIND_MISMATCH", code: "KIND_MISMATCH" }, { status: 400 });
  }

  const kind = inferred;
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  if (kind === "docx") {
    try {
      const { path } = await uploadDocxBuffer(buffer);
      return NextResponse.json({ path, kind: "docx" });
    } catch (e) {
      const code = e instanceof Error ? e.message : "UNKNOWN";
      if (code === "FILE_TOO_LARGE") {
        return NextResponse.json(
          { error: "FILE_TOO_LARGE", code: "FILE_TOO_LARGE", maxBytes: DOCX_UPLOAD_MAX_BYTES },
          { status: 413 },
        );
      }
      if (code === "INVALID_DOCX") {
        return NextResponse.json({ error: "INVALID_DOCX", code: "INVALID_DOCX" }, { status: 400 });
      }
      console.error("DOCX upload:", e);
      return NextResponse.json({ error: "UPLOAD_FAILED", code: "UPLOAD_FAILED" }, { status: 500 });
    }
  }

  try {
    const { path } = await uploadPdfBuffer(buffer);
    return NextResponse.json({ path, kind: "pdf" });
  } catch (e) {
    const code = e instanceof Error ? e.message : "UNKNOWN";
    if (code === "FILE_TOO_LARGE") {
      return NextResponse.json(
        { error: "FILE_TOO_LARGE", code: "FILE_TOO_LARGE", maxBytes: PDF_UPLOAD_MAX_BYTES },
        { status: 413 },
      );
    }
    if (code === "INVALID_PDF") {
      return NextResponse.json({ error: "INVALID_PDF", code: "INVALID_PDF" }, { status: 400 });
    }
    console.error("PDF upload:", e);
    return NextResponse.json({ error: "UPLOAD_FAILED", code: "UPLOAD_FAILED" }, { status: 500 });
  }
}
