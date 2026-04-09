"use server";

import { CourseInstructorRole, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireCourseOwner } from "@/lib/course-staff";

function parseJoinRole(raw: string): Extract<CourseInstructorRole, "EDITOR" | "VIEWER"> | null {
  const u = raw.toUpperCase();
  if (u === CourseInstructorRole.EDITOR) return CourseInstructorRole.EDITOR;
  if (u === CourseInstructorRole.VIEWER) return CourseInstructorRole.VIEWER;
  return null;
}

export async function addCourseInstructorAction(formData: FormData) {
  const courseId = String(formData.get("courseId") ?? "").trim();
  const userId = String(formData.get("userId") ?? "").trim();
  const role = parseJoinRole(String(formData.get("role") ?? "").toUpperCase());
  await requireCourseOwner(courseId);

  if (!userId || !role) {
    return;
  }

  const target = await db.user.findFirst({
    where: { id: userId, role: UserRole.INSTRUCTOR },
    select: { id: true },
  });
  if (!target) return;

  const existing = await db.courseInstructor.findUnique({
    where: { courseId_userId: { courseId, userId } },
    select: { role: true },
  });
  if (existing) {
    if (existing.role === CourseInstructorRole.OWNER) return;
    await db.courseInstructor.update({
      where: { courseId_userId: { courseId, userId } },
      data: { role },
    });
  } else {
    await db.courseInstructor.create({
      data: { courseId, userId, role },
    });
  }

  revalidatePath(`/admin/courses/${courseId}`);
}

export async function updateCourseInstructorRoleAction(formData: FormData) {
  const courseId = String(formData.get("courseId") ?? "").trim();
  const userId = String(formData.get("userId") ?? "").trim();
  const role = parseJoinRole(String(formData.get("role") ?? "").toUpperCase());
  await requireCourseOwner(courseId);

  if (!userId || !role) return;

  const row = await db.courseInstructor.findUnique({
    where: { courseId_userId: { courseId, userId } },
    select: { role: true },
  });
  if (!row || row.role === CourseInstructorRole.OWNER) return;

  await db.courseInstructor.update({
    where: { courseId_userId: { courseId, userId } },
    data: { role },
  });

  revalidatePath(`/admin/courses/${courseId}`);
}

export async function removeCourseInstructorAction(formData: FormData) {
  const courseId = String(formData.get("courseId") ?? "").trim();
  const userId = String(formData.get("userId") ?? "").trim();
  await requireCourseOwner(courseId);

  if (!userId) return;

  const row = await db.courseInstructor.findUnique({
    where: { courseId_userId: { courseId, userId } },
    select: { role: true },
  });
  if (!row || row.role === CourseInstructorRole.OWNER) return;

  await db.courseInstructor.delete({
    where: { courseId_userId: { courseId, userId } },
  });

  revalidatePath(`/admin/courses/${courseId}`);
}
