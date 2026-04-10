"use server";

import { revalidatePath } from "next/cache";
import { ExamAttemptStatus, QuestionKind } from "@prisma/client";
import { requireCourseEditor } from "@/lib/course-staff";
import { scoreMcqBreakdown, totalQuestionPoints } from "@/lib/exam-submit";
import { db } from "@/lib/db";
import { recomputeCourseGrade } from "@/lib/guards";

export async function gradePendingAttemptAction(formData: FormData) {
  const courseId = String(formData.get("courseId") ?? "").trim();
  const attemptId = String(formData.get("attemptId") ?? "").trim();
  if (!courseId || !attemptId) return;

  await requireCourseEditor(courseId);

  const attempt = await db.examAttempt.findFirst({
    where: {
      id: attemptId,
      status: ExamAttemptStatus.PENDING_MANUAL,
      exam: { courseId },
    },
    include: {
      user: { select: { id: true } },
      exam: {
        include: {
          questions: { include: { choices: true }, orderBy: { order: "asc" } },
        },
      },
    },
  });

  if (!attempt?.answersJson) return;

  let parsed: { mcq?: Record<string, string>; short?: Record<string, string> };
  try {
    parsed = JSON.parse(attempt.answersJson) as { mcq?: Record<string, string>; short?: Record<string, string> };
  } catch {
    return;
  }

  const mcq = parsed.mcq ?? {};
  const { earned: mcqEarned } = scoreMcqBreakdown(attempt.exam.questions, mcq);

  const shortQuestions = attempt.exam.questions.filter((q) => q.kind === QuestionKind.SHORT_ANSWER);
  const shortScores: Record<string, number> = {};
  let shortEarned = 0;
  for (const q of shortQuestions) {
    const raw = Number(formData.get(`short_${q.id}`));
    const pts = Number.isFinite(raw) ? Math.min(q.points, Math.max(0, raw)) : 0;
    shortScores[q.id] = pts;
    shortEarned += pts;
  }

  const total = totalQuestionPoints(attempt.exam.questions);
  const finalScore = total === 0 ? 0 : ((mcqEarned + shortEarned) / total) * 100;

  await db.examAttempt.update({
    where: { id: attemptId },
    data: {
      status: ExamAttemptStatus.COMPLETE,
      score: finalScore,
      manualScore: shortEarned,
      shortAnswerScoresJson: JSON.stringify(shortScores),
    },
  });

  await recomputeCourseGrade(attempt.userId, courseId);

  revalidatePath(`/admin/courses/${courseId}/exams/grading`);
  revalidatePath(`/admin/courses/${courseId}/exams`);
  revalidatePath(`/admin/courses/${courseId}/grades`);
  revalidatePath(`/courses/${courseId}/grades`);
}
