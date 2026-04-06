import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { requireParticipant } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateScore } from "@/lib/exam";
import { recomputeCourseGrade } from "@/lib/guards";
import { QuizAttemptShell } from "@/components/quiz-attempt-shell";

async function submitExamAction(formData: FormData) {
  "use server";
  const user = await requireParticipant();
  const examId = String(formData.get("examId"));
  const courseId = String(formData.get("courseId"));

  const exam = await db.exam.findUnique({
    where: { id: examId },
    include: { questions: true },
  });
  if (!exam) return;

  const answers = exam.questions
    .map((q) => ({ questionId: q.id, choiceId: String(formData.get(`q_${q.id}`) ?? "") }))
    .filter((a) => a.choiceId);

  const score = await calculateScore(exam.id, answers);
  await db.examAttempt.create({
    data: {
      userId: user.id,
      examId: exam.id,
      submittedAt: new Date(),
      score,
      answersJson: JSON.stringify(answers),
    },
  });

  await recomputeCourseGrade(user.id, courseId);
  revalidatePath(`/courses/${courseId}/exams`);
  redirect(`/courses/${courseId}/exams`);
}

export default async function ExamAttemptPage({
  params,
}: {
  params: Promise<{ courseId: string; examId: string }>;
}) {
  const user = await requireParticipant();
  const { courseId, examId } = await params;
  const exam = await db.exam.findFirst({
    where: { id: examId, courseId, isActive: true },
    include: { questions: { include: { choices: true }, orderBy: { order: "asc" } } },
  });
  if (!exam) notFound();

  const startedAt = new Date();

  return (
    <QuizAttemptShell
      exam={{
        id: exam.id,
        title: exam.title,
        durationMinutes: exam.durationMinutes,
        questions: exam.questions.map((q) => ({
          id: q.id,
          text: q.text,
          order: q.order,
          choices: q.choices.map((c) => ({ id: c.id, text: c.text })),
        })),
      }}
      courseId={courseId}
      startedAtISO={startedAt.toISOString()}
      onSubmitAction={submitExamAction}
      userName={user.name}
    />
  );
}
