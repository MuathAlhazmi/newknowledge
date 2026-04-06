import { revalidatePath } from "next/cache";
import { EnrollmentStatus, UserRole } from "@prisma/client";
import { db } from "@/lib/db";

export function revalidateEnrollmentSurfaces(courseId: string) {
  revalidatePath("/admin");
  revalidatePath(`/admin/courses/${courseId}/enrollments`);
}

export async function approveEnrollmentById(enrollmentId: string, courseId: string): Promise<boolean> {
  const row = await db.enrollment.findFirst({
    where: { id: enrollmentId, courseId },
  });
  if (!row) return false;
  await db.enrollment.update({
    where: { id: enrollmentId },
    data: { status: EnrollmentStatus.APPROVED },
  });
  revalidateEnrollmentSurfaces(courseId);
  return true;
}

export async function addLearnerEnrollment(
  courseId: string,
  userId: string,
  status: EnrollmentStatus,
): Promise<string | null> {
  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course) return "الدورة غير موجودة.";

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== UserRole.PARTICIPANT) {
    return "المستخدم ليس متدربًا.";
  }
  if (!user.platformApproved) {
    return "لا يمكن إضافة متدرب لم يُفعَّل حسابه على المنصة بعد.";
  }

  const existing = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (existing) {
    return "هذا المتدرب مسجّل في الدورة مسبقًا.";
  }

  await db.enrollment.create({
    data: { userId, courseId, status },
  });
  revalidateEnrollmentSurfaces(courseId);
  return null;
}
