import { NextResponse } from "next/server";
import { requireInstructor } from "@/lib/auth";
import { PDF_UPLOAD_MAX_BYTES, uploadPdfBuffer } from "@/lib/upload-pdf";

export async function POST(req: Request) {
  await requireInstructor();

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "INVALID_FILE", code: "INVALID_FILE" }, { status: 400 });
  }

  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "NOT_PDF", code: "NOT_PDF" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  try {
    const { path } = await uploadPdfBuffer(buffer);
    return NextResponse.json({ path });
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
