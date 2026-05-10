import { MaterialKind } from "@prisma/client";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCourseAccess } from "@/lib/course-staff";
import { materialContentDisposition } from "@/lib/material-content-disposition";
import { loadMaterialPdfBytes } from "@/lib/material-pdf-source";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ courseId: string; materialId: string }> },
) {
  const { courseId, materialId } = await params;
  await requireCourseAccess(courseId);

  const material = await db.material.findFirst({
    where: { id: materialId, courseId },
  });
  if (!material || !material.filePath) {
    return new NextResponse("Not found", { status: 404 });
  }

  if (material.kind !== MaterialKind.PDF && material.kind !== MaterialKind.DOCX) {
    return new NextResponse("Not found", { status: 404 });
  }

  const bytes = await loadMaterialPdfBytes(material.filePath);
  if (!bytes?.length) {
    return new NextResponse("Bad request", { status: 400 });
  }

  const isPdf = material.kind === MaterialKind.PDF;
  const disposition = materialContentDisposition(material.title, {
    ext: isPdf ? "pdf" : "docx",
    disposition: "attachment",
  });

  return new NextResponse(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Content-Type": isPdf
        ? "application/pdf"
        : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": disposition,
      "Cache-Control": "private, max-age=300",
    },
  });
}
