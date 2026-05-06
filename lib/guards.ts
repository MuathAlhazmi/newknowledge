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

  const manualAssessments = await db.manualAssessment.findMany({
    where: { courseId },
    select: { id: true, maxScore: true },
  });

  const assessmentIds = manualAssessments.map((a) => a.id);
  let manualPercent = 0;
  let hasManualScore = false;
  if (assessmentIds.length > 0) {
    const manualScores = await db.manualAssessmentScore.findMany({
      where: { userId, assessmentId: { in: assessmentIds } },
      select: { assessmentId: true, score: true },
    });

    const scoreByAssessment = new Map(manualScores.map((s) => [s.assessmentId, s.score]));
    let sum = 0;
    let count = 0;
    for (const a of manualAssessments) {
      const score = scoreByAssessment.get(a.id);
      if (score == null) continue;
      if (a.maxScore <= 0) continue;
      sum += (score / a.maxScore) * 100;
      count++;
    }
    hasManualScore = count > 0;
    manualPercent = hasManualScore ? sum / count : 0;
  }

  let finalScore: number | null = null;
  if (preScore !== null || postScore !== null || hasManualScore) {
    const safePre = preScore ?? 0;
    const safePost = postScore ?? 0;
    const activeManualWeight = hasManualScore ? config.manualWeight : 0;
    const activeWeight = config.preWeight + config.postWeight + activeManualWeight;
    if (activeWeight > 0) {
      finalScore =
        (safePre * config.preWeight + safePost * config.postWeight + manualPercent * activeManualWeight) /
        activeWeight;
    }
  }

  const isPassed = finalScore !== null ? finalScore >= config.passThreshold : null;

  return db.courseGrade.upsert({
    where: { courseId_userId: { courseId, userId } },
    create: { courseId, userId, preScore, postScore, finalScore, isPassed, updatedByAdmin: false },
    update: { preScore, postScore, finalScore, isPassed, updatedByAdmin: false },
  });
}
