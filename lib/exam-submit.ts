import { ExamAttemptStatus, QuestionKind } from "@prisma/client";
import { db } from "@/lib/db";
import type { ExamLayoutPayload } from "@/lib/exam-shuffle";

export function scoreMcqBreakdown(
  questions: Array<{
    id: string;
    kind: QuestionKind;
    points: number;
    choices: Array<{ id: string; isCorrect: boolean }>;
  }>,
  mcqAnswers: Record<string, string>,
): { earned: number; max: number } {
  let earned = 0;
  let max = 0;
  for (const q of questions) {
    if (q.kind !== QuestionKind.MCQ) continue;
    max += q.points;
    const sel = mcqAnswers[q.id];
    if (!sel) continue;
    const correct = q.choices.find((c) => c.isCorrect);
    if (correct && sel === correct.id) earned += q.points;
  }
  return { earned, max };
}

export function totalQuestionPoints(questions: Array<{ kind: QuestionKind; points: number }>): number {
  return questions.reduce((s, q) => s + q.points, 0);
}

function scoreMcqPercent(
  questions: Array<{
    id: string;
    kind: QuestionKind;
    points: number;
    choices: Array<{ id: string; isCorrect: boolean }>;
  }>,
  mcqAnswers: Record<string, string>,
): number {
  const { earned, max } = scoreMcqBreakdown(questions, mcqAnswers);
  if (max === 0) return 100;
  return (earned / max) * 100;
}

export async function finalizeExamAttemptFromForm(
  userId: string,
  courseId: string,
  attemptId: string,
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const attempt = await db.examAttempt.findFirst({
    where: {
      id: attemptId,
      userId,
      submittedAt: null,
      status: ExamAttemptStatus.DRAFT,
      exam: { courseId },
    },
    include: {
      exam: {
        include: {
          questions: {
            include: { choices: true },
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });

  if (!attempt) {
    return { ok: false, error: "invalid_attempt" };
  }

  const layout = JSON.parse(attempt.layoutJson ?? "{}") as ExamLayoutPayload;
  const allIds = layout.questionIds;

  const qMap = new Map(attempt.exam.questions.map((q) => [q.id, q]));
  const mcq: Record<string, string> = {};
  const short: Record<string, string> = {};
  for (const id of allIds) {
    const q = qMap.get(id);
    if (!q) continue;
    if (q.kind === QuestionKind.MCQ) {
      const v = String(formData.get(`q_${id}`) ?? "").trim();
      if (v) mcq[id] = v;
    } else {
      const v = String(formData.get(`sa_${id}`) ?? "").trim();
      if (v) short[id] = v;
    }
  }
  const missingMcq: string[] = [];
  const missingShort: string[] = [];
  let hasShort = false;

  for (const id of allIds) {
    const q = qMap.get(id);
    if (!q) continue;
    if (q.kind === QuestionKind.MCQ) {
      if (!mcq[id]) missingMcq.push(id);
    } else {
      hasShort = true;
      if (!short[id]?.trim()) missingShort.push(id);
    }
  }

  if (missingMcq.length > 0 || missingShort.length > 0) {
    return { ok: false, error: "incomplete" };
  }

  const answersPayload = JSON.stringify({ mcq, short });
  const mcqPercent = scoreMcqPercent(attempt.exam.questions, mcq);

  if (hasShort) {
    await db.examAttempt.update({
      where: { id: attemptId },
      data: {
        submittedAt: new Date(),
        status: ExamAttemptStatus.PENDING_MANUAL,
        score: null,
        answersJson: answersPayload,
      },
    });
    return { ok: true };
  }

  await db.examAttempt.update({
    where: { id: attemptId },
    data: {
      submittedAt: new Date(),
      status: ExamAttemptStatus.COMPLETE,
      score: mcqPercent,
      answersJson: answersPayload,
    },
  });

  return { ok: true };
}
