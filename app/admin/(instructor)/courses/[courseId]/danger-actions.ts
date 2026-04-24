"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCourseOwner } from "@/lib/course-staff";
import { db } from "@/lib/db";
import { deleteStoredMaterialFile } from "@/lib/delete-material-storage";

export async function deleteCourseAction(formData: FormData) {
  const courseId = String(formData.get("courseId") ?? "").trim();
  const confirmTitle = String(formData.get("confirmTitle") ?? "").trim();
  const confirmWord = String(formData.get("confirmWord") ?? "").trim().toUpperCase();
  const acknowledgeCascade = String(formData.get("acknowledgeCascade") ?? "").trim();

  await requireCourseOwner(courseId);

  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { id: true, title: true },
  });
  if (!course) {
    redirect("/admin/courses");
  }

  const confirmationFailed =
    confirmTitle !== course.title || confirmWord !== "DELETE" || acknowledgeCascade !== "on";
  if (confirmationFailed) {
    redirect(`/admin/courses/${courseId}?deleteError=confirm`);
  }

  const materialRows = await db.material.findMany({
    where: { courseId },
    select: { filePath: true },
  });

  await db.course.delete({ where: { id: courseId } });

  await Promise.allSettled(materialRows.map((m) => deleteStoredMaterialFile(m.filePath)));

  revalidatePath("/admin/courses");
  redirect("/admin/courses?deleted=course");
}
