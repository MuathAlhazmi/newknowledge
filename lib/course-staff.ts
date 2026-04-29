import type { CourseInstructor } from "@prisma/client";
import { CourseInstructorRole, UserRole } from "@prisma/client";
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

/**
 * True when the given user can act as course staff for `courseId`:
 * - has a real CourseInstructor row on this course, OR
 * - is a platform ADMIN (implicit OWNER everywhere).
 *
 * Use from contexts that must NOT redirect (e.g. API routes).
 */
export async function hasCourseAccess(
  user: { id: string; role: UserRole },
  courseId: string,
): Promise<boolean> {
  if (user.role === UserRole.ADMIN) return true;
  if (user.role !== UserRole.INSTRUCTOR) return false;
  const membership = await getCourseMembership(user.id, courseId);
  return Boolean(membership);
}

/** Any staff on the course (VIEWER+). Platform ADMIN gets a synthetic OWNER membership. */
export async function requireCourseAccess(courseId: string) {
  const user = await requireInstructor();
  const real = await getCourseMembership(user.id, courseId);
  if (real) return { user, membership: real };
  if (user.role === UserRole.ADMIN) {
    const synthetic: CourseInstructor = {
      id: `admin:${user.id}:${courseId}`,
      courseId,
      userId: user.id,
      role: CourseInstructorRole.OWNER,
      createdAt: new Date(0),
    };
    return { user, membership: synthetic };
  }
  notFound();
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
