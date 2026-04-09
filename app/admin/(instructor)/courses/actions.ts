"use server";

import { revalidatePath } from "next/cache";
import { CourseInstructorRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { requireInstructor } from "@/lib/auth";
import { db } from "@/lib/db";

export type CreateCourseState = { ok: false; error: string } | null;

export async function createCourseAction(
  _prev: CreateCourseState,
  formData: FormData,
): Promise<CreateCourseState> {
  const user = await requireInstructor();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!title || title.length > 300) {
    return { ok: false, error: "يرجى إدخال عنوان صالح للدورة (حتى 300 حرف)." };
  }
  if (!description || description.length > 8000) {
    return { ok: false, error: "يرجى إدخال وصف للدورة." };
  }

  const course = await db.course.create({
    data: {
      title,
      description,
      courseInstructors: {
        create: { userId: user.id, role: CourseInstructorRole.OWNER },
      },
    },
    select: { id: true },
  });

  revalidatePath("/admin/courses");
  redirect(`/admin/courses/${course.id}`);
}
