import { MaterialKind, UserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { materialContentDisposition } from "@/lib/material-content-disposition";
import { loadMaterialPdfBytes } from "@/lib/material-pdf-source";
import { hasCourseAccess } from "@/lib/course-staff";
import { requireApprovedEnrollment } from "@/lib/guards";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ courseId: string; materialId: string }> },
) {
  const user = await requireUser();
  const { courseId, materialId } = await params;

  const allowed =
    user.role === UserRole.PARTICIPANT
      ? await requireApprovedEnrollment(user.id, courseId)
      : await hasCourseAccess(user, courseId);
  if (!allowed) {
    return new NextResponse("Forbidden", { status: 403 });
  }

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

  const disposition = materialContentDisposition(material.title, {
    ext: "pdf",
    disposition: "inline",
  });

  return new NextResponse(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": disposition,
      "Cache-Control": "private, max-age=300",
    },
  });
}
