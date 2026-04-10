import { randomBytes } from "crypto";
import { CompletionMethod, EnrollmentStatus } from "@prisma/client";
import { db } from "@/lib/db";

function generateCertificateNumber(): string {
  const a = randomBytes(4).toString("hex").toUpperCase();
  const b = randomBytes(3).toString("hex").toUpperCase();
  return `NK-${a}-${b}`;
}

export type CourseProgressSnapshot = {
  total: number;
  completed: number;
  percent: number;
  completion: { certificateNumber: string; completedAt: Date } | null;
};

export async function getCourseProgressSnapshot(
  userId: string,
  courseId: string,
): Promise<CourseProgressSnapshot> {
  const completion = await db.courseCompletion.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { certificateNumber: true, completedAt: true },
  });

  const [materials, exams, attempts] = await Promise.all([
    db.material.findMany({ where: { courseId }, select: { id: true } }),
    db.exam.findMany({ where: { courseId, isActive: true }, select: { id: true } }),
    db.examAttempt.findMany({
      where: {
        userId,
        submittedAt: { not: null },
        exam: { courseId },
      },
      select: { examId: true },
    }),
  ]);

  const materialIds = materials.map((m) => m.id);
  const viewedRows =
    materialIds.length === 0
      ? []
      : await db.materialProgress.findMany({
          where: { userId, materialId: { in: materialIds } },
          select: { materialId: true },
        });
  const viewedSet = new Set(viewedRows.map((r) => r.materialId));

  const examIdSet = new Set(exams.map((e) => e.id));
  const attemptedExamIds = new Set(
    attempts.map((a) => a.examId).filter((id) => examIdSet.has(id)),
  );

  const total = materials.length + exams.length;
  const completed = viewedSet.size + attemptedExamIds.size;
  const percent = total === 0 ? 100 : Math.min(100, Math.round((completed / total) * 100));

  return {
    total,
    completed,
    percent,
    completion: completion
      ? { certificateNumber: completion.certificateNumber, completedAt: completion.completedAt }
      : null,
  };
}

/** Recompute and persist course completion when all tracked items are done. */
export async function ensureCourseCompletion(userId: string, courseId: string) {
  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (!enrollment || enrollment.status !== EnrollmentStatus.APPROVED) return;

  const snap = await getCourseProgressSnapshot(userId, courseId);
  if (snap.total === 0 || snap.completed < snap.total) return;

  const existing = await db.courseCompletion.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (existing) return;

  await db.courseCompletion.create({
    data: {
      userId,
      courseId,
      certificateNumber: generateCertificateNumber(),
      method: CompletionMethod.AUTO,
    },
  });
}

/**
 * Tracks first open of a material; idempotent.
 */
export async function recordMaterialOpened(userId: string, materialId: string, courseId: string) {
  await db.materialProgress.upsert({
    where: { userId_materialId: { userId, materialId } },
    create: { userId, materialId },
    update: {},
  });
  await ensureCourseCompletion(userId, courseId);
}
