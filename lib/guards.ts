import { EnrollmentStatus, ExamAttemptStatus, ExamType } from "@prisma/client";
import { db } from "@/lib/db";

export async function requireApprovedEnrollment(userId: string, courseId: string) {
  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });

  if (!enrollment || enrollment.status !== EnrollmentStatus.APPROVED) {
    return false;
  }
  return true;
}

export async function isPostExamUnlocked(userId: string, courseId: string) {
  const preExam = await db.exam.findFirst({
    where: { courseId, type: ExamType.PRE },
  });

  if (!preExam) return false;

  const hasPreSubmission = await db.examAttempt.findFirst({
    where: { userId, examId: preExam.id, submittedAt: { not: null } },
  });

  if (!hasPreSubmission) return false;

  const approved = await db.postExamApproval.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  return !!approved;
}

export async function recomputeCourseGrade(userId: string, courseId: string) {
  const config = await db.gradingConfig.findUnique({ where: { courseId } });
  if (!config) return null;

  const preExam = await db.exam.findFirst({ where: { courseId, type: ExamType.PRE } });
  const postExam = await db.exam.findFirst({ where: { courseId, type: ExamType.POST } });

  const preAttempt = preExam
    ? await db.examAttempt.findFirst({
        where: {
          userId,
          examId: preExam.id,
          submittedAt: { not: null },
          status: ExamAttemptStatus.COMPLETE,
        },
        orderBy: { submittedAt: "desc" },
      })
    : null;
  const postAttempt = postExam
    ? await db.examAttempt.findFirst({
        where: {
          userId,
          examId: postExam.id,
          submittedAt: { not: null },
          status: ExamAttemptStatus.COMPLETE,
        },
        orderBy: { submittedAt: "desc" },
      })
    : null;

  const preScore = preAttempt?.score ?? null;
  const postScore = postAttempt?.score ?? null;

  let finalScore: number | null = null;
  if (preScore !== null || postScore !== null) {
    const safePre = preScore ?? 0;
    const safePost = postScore ?? 0;
    finalScore = (safePre * config.preWeight + safePost * config.postWeight) / 100;
  }

  const isPassed = finalScore !== null ? finalScore >= config.passThreshold : null;

  return db.courseGrade.upsert({
    where: { courseId_userId: { courseId, userId } },
    create: { courseId, userId, preScore, postScore, finalScore, isPassed },
    update: { preScore, postScore, finalScore, isPassed },
  });
}
