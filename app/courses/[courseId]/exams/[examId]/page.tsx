import { notFound, redirect } from "next/navigation";
import { requireParticipant } from "@/lib/auth";
import { ensureExamDraft } from "@/lib/exam-draft";
import { db } from "@/lib/db";
import { QuizAttemptShell } from "@/components/quiz-attempt-shell";
import { submitExamAction } from "@/app/courses/[courseId]/exams/[examId]/submit-exam-action";

export default async function ExamAttemptPage({
  params,
}: {
  params: Promise<{ courseId: string; examId: string }>;
}) {
  const user = await requireParticipant();
  const { courseId, examId } = await params;

  const examMeta = await db.exam.findFirst({
    where: { id: examId, courseId, isActive: true },
    select: {
      title: true,
      durationMinutes: true,
      allowReviewWhileAttempt: true,
      maxAttempts: true,
    },
  });
  if (!examMeta) notFound();

  const draft = await ensureExamDraft(user.id, courseId, examId);
  if (!draft) notFound();
  if (draft.blocked) {
    redirect(`/courses/${courseId}/exams?error=max_attempts`);
  }

  const startedAt = new Date();

  return (
    <QuizAttemptShell
      exam={{
        id: examId,
        title: examMeta.title,
        durationMinutes: examMeta.durationMinutes,
      }}
      attemptId={draft.attemptId}
      courseId={courseId}
      startedAtISO={startedAt.toISOString()}
      onSubmitAction={submitExamAction}
      userName={user.name}
      displayQuestions={draft.displayQuestions}
      examPolicies={{
        allowReviewWhileAttempt: examMeta.allowReviewWhileAttempt,
        maxAttempts: examMeta.maxAttempts,
      }}
    />
  );
}
