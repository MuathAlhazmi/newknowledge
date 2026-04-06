"use server";

import { revalidatePath } from "next/cache";
import { EnrollmentStatus, UserRole } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { createPlatformUser } from "@/lib/create-platform-user";
import { arCopy } from "@/lib/copy/ar";
import { db } from "@/lib/db";
import { addLearnerEnrollment, approveEnrollmentById } from "@/lib/enrollment-admin";

export async function approvePlatformUserAction(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("userId") ?? "").trim();
  if (!userId) return;

  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target || target.role !== UserRole.PARTICIPANT) return;

  await db.user.update({
    where: { id: userId },
    data: { platformApproved: true },
  });

  revalidatePath("/admin");
}

function roleLabelAr(role: UserRole): string {
  if (role === UserRole.ADMIN) return arCopy.roleLabels.ADMIN;
  if (role === UserRole.INSTRUCTOR) return arCopy.roleLabels.INSTRUCTOR;
  return arCopy.roleLabels.PARTICIPANT;
}

export type CreatePlatformUserState =
  | { kind: "success"; message: string; resetKey: number }
  | { kind: "error"; message: string }
  | null;

export async function createPlatformUserAction(
  _prev: CreatePlatformUserState,
  formData: FormData,
): Promise<CreatePlatformUserState> {
  await requireAdmin();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim().replace(/\s+/g, "");
  const roleRaw = String(formData.get("role") ?? "PARTICIPANT").toUpperCase();

  const role =
    roleRaw === "ADMIN"
      ? UserRole.ADMIN
      : roleRaw === "INSTRUCTOR"
        ? UserRole.INSTRUCTOR
        : UserRole.PARTICIPANT;

  if (!email || !password || !phone) {
    return { kind: "error", message: "يرجى تعبئة البريد وكلمة المرور والجوال." };
  }

  try {
    await createPlatformUser({
      email,
      password,
      name,
      phone,
      role,
      platformApproved: true,
    });
    revalidatePath("/admin");
    const display = name || email;
    return {
      kind: "success",
      message: arCopy.adminUserHub.userCreatedSuccess(display, email, roleLabelAr(role)),
      resetKey: Date.now(),
    };
  } catch (e) {
    return {
      kind: "error",
      message: e instanceof Error ? e.message : "تعذر إنشاء المستخدم.",
    };
  }
}

export async function approveGlobalEnrollmentAction(formData: FormData) {
  await requireAdmin();
  const enrollmentId = String(formData.get("enrollmentId") ?? "").trim();
  const courseId = String(formData.get("courseId") ?? "").trim();
  if (!enrollmentId || !courseId) return;
  await approveEnrollmentById(enrollmentId, courseId);
}

export type MinimalEnrollState =
  | { kind: "success"; message: string; resetKey: number }
  | { kind: "error"; message: string }
  | null;

export async function minimalEnrollAction(
  _prev: MinimalEnrollState,
  formData: FormData,
): Promise<MinimalEnrollState> {
  await requireAdmin();
  const courseId = String(formData.get("courseId") ?? "").trim();
  const userId = String(formData.get("userId") ?? "").trim();
  if (!courseId || !userId) {
    return { kind: "error", message: "اختر الدورة والمتدرب." };
  }
  const err = await addLearnerEnrollment(courseId, userId, EnrollmentStatus.APPROVED);
  if (err) return { kind: "error", message: err };

  const [course, user] = await Promise.all([
    db.course.findUnique({ where: { id: courseId }, select: { title: true } }),
    db.user.findUnique({ where: { id: userId }, select: { name: true } }),
  ]);

  revalidatePath("/admin");
  return {
    kind: "success",
    message: arCopy.adminUserHub.enrollmentAddedSuccess(
      course?.title ?? courseId,
      user?.name ?? userId,
    ),
    resetKey: Date.now(),
  };
}
