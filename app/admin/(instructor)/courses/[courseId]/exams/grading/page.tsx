import Link from "next/link";
import { notFound } from "next/navigation";
import { ExamAttemptStatus, QuestionKind } from "@prisma/client";
import { requireCourseAccess } from "@/lib/course-staff";
import { db } from "@/lib/db";
import { gradePendingAttemptAction } from "@/app/admin/(instructor)/courses/[courseId]/exams/grading-actions";
import { Card, PageHeader } from "@/components/ui";

export default async function ExamGradingQueuePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  await requireCourseAccess(courseId);

  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { title: true },
  });
  if (!course) notFound();

  const pending = await db.examAttempt.findMany({
    where: {
      status: ExamAttemptStatus.PENDING_MANUAL,
      exam: { courseId },
    },
    include: {
      user: { select: { name: true, email: true } },
      exam: { select: { title: true, id: true } },
    },
    orderBy: { submittedAt: "asc" },
  });

  const withQuestions = await Promise.all(
    pending.map(async (row) => {
      const questions = await db.question.findMany({
        where: { examId: row.examId, kind: QuestionKind.SHORT_ANSWER },
        orderBy: { order: "asc" },
      });
      let shortTexts: Record<string, string> = {};
      try {
        const parsed = JSON.parse(row.answersJson ?? "{}") as { short?: Record<string, string> };
        shortTexts = parsed.short ?? {};
      } catch {
        shortTexts = {};
      }
      return { row, questions, shortTexts };
    }),
  );

  return (
    <div className="page-wrap gap-6">
      <PageHeader
        title="تصحيح إجابات قصيرة"
        subtitle={`${course.title} · محاولات بانتظار التقييم اليدوي`}
        actions={
          <Link href={`/admin/courses/${courseId}/exams`} className="nk-btn nk-btn-secondary text-sm">
            العودة للاختبارات
          </Link>
        }
      />

      {withQuestions.length === 0 ? (
        <Card className="p-5 text-sm text-[var(--text-muted)]">لا توجد محاولات معلّقة حاليًا.</Card>
      ) : (
        <ul className="grid gap-6">
          {withQuestions.map(({ row, questions, shortTexts }) => (
            <li key={row.id}>
              <Card elevated className="p-5">
                <div className="mb-4 flex flex-wrap justify-between gap-2">
                  <div>
                    <p className="font-semibold">{row.exam.title}</p>
                    <p className="text-sm text-[var(--text-muted)]">{row.user.name}</p>
                    <p className="text-xs text-[var(--text-muted)]" dir="ltr">
                      {row.user.email}
                    </p>
                  </div>
                </div>

                {questions.map((q) => (
                  <div key={q.id} className="mb-4 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]/40 p-3">
                    <p className="text-sm font-medium">{q.text}</p>
                    {q.rubric ? (
                      <p className="mt-1 text-xs text-[var(--text-muted)]">السلم: {q.rubric}</p>
                    ) : null}
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{shortTexts[q.id] ?? "—"}</p>
                    <label className="mt-2 grid gap-1 text-sm">
                      <span>درجة مكتسبة (من {q.points})</span>
                      <input
                        type="number"
                        name={`short_${q.id}`}
                        min={0}
                        max={q.points}
                        step={0.5}
                        defaultValue={0}
                        className="max-w-[8rem] rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-1"
                        required
                      />
                    </label>
                  </div>
                ))}

                <form action={gradePendingAttemptAction} className="mt-2 flex flex-wrap gap-2">
                  <input type="hidden" name="courseId" value={courseId} />
                  <input type="hidden" name="attemptId" value={row.id} />
                  <button type="submit" className="nk-btn nk-btn-primary text-sm">
                    حفظ التقييم وإغلاق المحاولة
                  </button>
                </form>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
