import { CourseInstructorRole } from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import { requireInstructor } from "@/lib/auth";
import { db } from "@/lib/db";

const rank: Record<CourseInstructorRole, number> = {
  VIEWER: 0,
  EDITOR: 1,
  OWNER: 2,
};

export function roleAtLeast(role: CourseInstructorRole, min: CourseInstructorRole): boolean {
  return rank[role] >= rank[min];
}

export function canEditCourse(role: CourseInstructorRole): boolean {
  return roleAtLeast(role, CourseInstructorRole.EDITOR);
}

export function canManageCourseTeam(role: CourseInstructorRole): boolean {
  return role === CourseInstructorRole.OWNER;
}

export async function getCourseMembership(userId: string, courseId: string) {
  return db.courseInstructor.findUnique({
    where: { courseId_userId: { courseId, userId } },
  });
}

/** Any staff on the course (VIEWER+). */
export async function requireCourseAccess(courseId: string) {
  const user = await requireInstructor();
  const membership = await getCourseMembership(user.id, courseId);
  if (!membership) notFound();
  return { user, membership };
}

/** Materials, exams, enrollments, grading, chat replies, Teams sessions, etc. */
export async function requireCourseEditor(courseId: string) {
  const ctx = await requireCourseAccess(courseId);
  if (!canEditCourse(ctx.membership.role)) {
    redirect(`/admin/courses/${courseId}`);
  }
  return ctx;
}

/** Team membership CRUD (co-instructors). */
export async function requireCourseOwner(courseId: string) {
  const ctx = await requireCourseAccess(courseId);
  if (!canManageCourseTeam(ctx.membership.role)) {
    redirect(`/admin/courses/${courseId}`);
  }
  return ctx;
}
