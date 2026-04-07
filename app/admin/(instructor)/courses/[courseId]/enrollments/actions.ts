"use server";

import { EnrollmentStatus } from "@prisma/client";
import { requireInstructor } from "@/lib/auth";
import { arCopy } from "@/lib/copy/ar";
import { db } from "@/lib/db";
import { addLearnerEnrollment, approveEnrollmentById } from "@/lib/enrollment-admin";

export async function approveEnrollmentAction(formData: FormData) {
  await requireInstructor();
  const enrollmentId = String(formData.get("enrollmentId"));
  const courseId = String(formData.get("courseId"));
  await approveEnrollmentById(enrollmentId, courseId);
}

export type AddEnrollmentState = { error: string } | { success: true; message: string } | null;

export async function addEnrollmentAction(
  _prev: AddEnrollmentState,
  formData: FormData,
): Promise<AddEnrollmentState> {
  await requireInstructor();
  const courseId = String(formData.get("courseId") ?? "").trim();
  const userId = String(formData.get("userId") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "APPROVED").toUpperCase();

  if (!courseId || !userId) {
    return { error: "يرجى اختيار متدرب من القائمة." };
  }

  const status =
    statusRaw === "PENDING" ? EnrollmentStatus.PENDING : EnrollmentStatus.APPROVED;

  const err = await addLearnerEnrollment(courseId, userId, status);
  if (err) return { error: err };

  const [course, user] = await Promise.all([
    db.course.findUnique({ where: { id: courseId }, select: { title: true } }),
    db.user.findUnique({ where: { id: userId }, select: { name: true } }),
  ]);
  const courseTitle = course?.title ?? courseId;
  const learnerName = user?.name ?? userId;

  const message =
    status === EnrollmentStatus.APPROVED
      ? arCopy.adminUserHub.enrollmentAddedSuccess(courseTitle, learnerName)
      : arCopy.snackbar.enrollmentAddedPending(courseTitle, learnerName);

  return { success: true, message };
}
