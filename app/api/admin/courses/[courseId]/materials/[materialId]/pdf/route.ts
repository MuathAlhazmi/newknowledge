import { MaterialKind } from "@prisma/client";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireCourseAccess } from "@/lib/course-staff";
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
  if (!material || material.kind !== MaterialKind.PDF || !material.filePath) {
    return new NextResponse("Not found", { status: 404 });
  }

  const bytes = await loadMaterialPdfBytes(material.filePath);
  if (!bytes?.length) {
    return new NextResponse("Bad request", { status: 400 });
  }

  const asciiFilename = `${material.title.replace(/[^\w.-]+/g, "_").slice(0, 80) || "material"}.pdf`;

  return new NextResponse(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${asciiFilename}"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}
