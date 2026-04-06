"use server";

import { EnrollmentStatus } from "@prisma/client";
import { requireInstructor } from "@/lib/auth";
import { addLearnerEnrollment, approveEnrollmentById } from "@/lib/enrollment-admin";

export async function approveEnrollmentAction(formData: FormData) {
  await requireInstructor();
  const enrollmentId = String(formData.get("enrollmentId"));
  const courseId = String(formData.get("courseId"));
  await approveEnrollmentById(enrollmentId, courseId);
}

export type AddEnrollmentState = { error: string } | null;

export async function addEnrollmentAction(
  _prev: AddEnrollmentState,
  formData: FormData,
): Promise<AddEnrollmentState> {
  await requireInstructor();
  const courseId = String(formData.get("courseId") ?? "").trim();
  const userId = String(formData.get("userId") ?? "").trim();
  const statusRaw = String(formData.get("status") ?? "APPROVED").toUpperCase();

  if (!courseId || !userId) {
    return { error: "اختر متدربًا من القائمة." };
  }

  const status =
    statusRaw === "PENDING" ? EnrollmentStatus.PENDING : EnrollmentStatus.APPROVED;

  const err = await addLearnerEnrollment(courseId, userId, status);
  return err ? { error: err } : null;
}
