import { NextResponse } from "next/server";
import { requireCourseEditor } from "@/lib/course-staff";
import { db } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const { courseId } = await params;
  await requireCourseEditor(courseId);
  const formData = await req.formData();
  const title = String(formData.get("title") ?? "").trim();
  const pdfPath = String(formData.get("pdfPath") ?? "").trim();

  if (!title || !pdfPath) {
    return NextResponse.redirect(new URL(`/admin/courses/${courseId}/materials`, req.url));
  }

  await db.material.create({
    data: { courseId, title, pdfPath },
  });

  return NextResponse.redirect(new URL(`/admin/courses/${courseId}/materials`, req.url));
}
