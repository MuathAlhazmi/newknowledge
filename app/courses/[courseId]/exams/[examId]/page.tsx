import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { requireParticipant } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateScoreFromCorrectChoices } from "@/lib/exam";
import { QuizAttemptShell } from "@/components/quiz-attempt-shell";

function getInternalBaseUrl(h: Headers): string | null {
  const envBase = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL;
  if (envBase?.trim()) return envBase.trim().replace(/\/$/, "");
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return null;
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

async function submitExamAction(formData: FormData) {
  "use server";
  const user = await requireParticipant();
  const examId = String(formData.get("examId") ?? "").trim();
  const courseId = String(formData.get("courseId") ?? "").trim();
  if (!examId || !courseId) return;

  const exam = await db.exam.findFirst({
    where: { id: examId, courseId, isActive: true },
    select: {
      id: true,
      courseId: true,
      questions: {
        select: {
          id: true,
          choices: {
            where: { isCorrect: true },
            select: { id: true },
            take: 1,
          },
        },
      },
    },
  });
  if (!exam) return;

  const answers = exam.questions
    .map((q) => ({ questionId: q.id, choiceId: String(formData.get(`q_${q.id}`) ?? "") }))
    .filter((a) => a.choiceId);

  const correctChoices = exam.questions
    .map((q) => {
      const correct = q.choices[0];
      if (!correct) return null;
      return { questionId: q.id, correctChoiceId: correct.id };
    })
    .filter((row): row is { questionId: string; correctChoiceId: string } => row !== null);

  const score = calculateScoreFromCorrectChoices(correctChoices, answers);
  const answersCompact = Object.fromEntries(answers.map((a) => [a.questionId, a.choiceId]));

  await db.examAttempt.create({
    data: {
      userId: user.id,
      examId: exam.id,
      submittedAt: new Date(),
      score,
      answersJson: JSON.stringify(answersCompact),
    },
  });

  const internalSecret = process.env.INTERNAL_RECOMPUTE_SECRET?.trim();
  const h = await headers();
  const baseUrl = getInternalBaseUrl(h);
  if (internalSecret && baseUrl) {
    void fetch(`${baseUrl}/api/internal/recompute-grade`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-internal-recompute-secret": internalSecret,
      },
      body: JSON.stringify({ userId: user.id, courseId }),
    }).catch((err) => {
      console.warn("[submitExamAction] async grade recompute trigger failed", err);
    });
  } else {
    console.warn("[submitExamAction] skipped async grade recompute trigger; missing base URL or secret");
  }

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
