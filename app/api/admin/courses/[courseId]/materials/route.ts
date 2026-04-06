import { NextResponse } from "next/server";
import { requireInstructor } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  await requireInstructor();
  const { courseId } = await params;
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
