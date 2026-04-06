"use client";

import { useMemo, useState } from "react";
import { ExamTimer } from "@/components/exam-timer";
import { Card, PageHeader, StatusBadge } from "@/components/ui";

type Choice = { id: string; text: string };
type Question = { id: string; text: string; order: number; choices: Choice[] };
type ExamPayload = {
  id: string;
  title: string;
  durationMinutes: number;
  questions: Question[];
};

function scrollToQuestion(questionId: string) {
  document.getElementById(`question-${questionId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function BookmarkForReviewIcon({ filled }: { filled: boolean }) {
  if (filled) {
    return (
      <svg className="h-4 w-4 shrink-0 text-amber-700" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M6.75 3C5.784 3 5 3.784 5 4.75v15.502c0 .856.984 1.339 1.648.786l4.352-3.61a.75.75 0 011.008 0l4.352 3.61c.664.553 1.648.07 1.648-.786V4.75C18 3.784 17.216 3 16.25 3H6.75z" />
      </svg>
    );
  }
  return (
    <svg
      className="h-4 w-4 shrink-0 text-[var(--text-muted)]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 5.5V19a1 1 0 001.5.82l5.5-3.18 5.5 3.18a1 1 0 001.5-.82V5.5A2.5 2.5 0 0016.5 3h-9A2.5 2.5 0 005 5.5z"
      />
    </svg>
  );
}

export function QuizAttemptShell({
  exam,
  courseId,
  startedAtISO,
  onSubmitAction,
  userName,
}: {
  exam: ExamPayload;
  courseId: string;
  startedAtISO: string;
  onSubmitAction: (formData: FormData) => Promise<void>;
  userName: string;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [reviewFlags, setReviewFlags] = useState<Record<string, boolean>>({});

  const totalQuestions = exam.questions.length;
  const answeredCount = useMemo(
    () => exam.questions.filter((q) => Boolean(answers[q.id])).length,
    [answers, exam.questions],
  );
  const progress = totalQuestions === 0 ? 0 : Math.round((answeredCount / totalQuestions) * 100);
  const isDemoExam = exam.title.includes("تجريب");

  function toggleReviewFlag(questionId: string) {
    setReviewFlags((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  }

  return (
    <div className="page-wrap gap-5">
      <Card elevated interactive={false} className="sticky top-4 z-20">
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <PageHeader title={exam.title} subtitle="أجب عن جميع الأسئلة، ثم أرسل الاختبار." />
            <ExamTimer durationMinutes={exam.durationMinutes} startedAtISO={startedAtISO} />
          </div>

          {isDemoExam ? (
            <p className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]/80 px-3 py-2 text-xs text-[var(--text-muted)]">
              هذا الاختبار ضمن بيانات عرض تجريبية؛ الأسئلة لتوضيح آلية المنصة وليست امتحانًا معتمدًا.
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge text={`تمت الإجابة: ${answeredCount}/${totalQuestions}`} tone="info" />
            <StatusBadge text={`التقدم: ${progress}%`} tone="success" />
          </div>

          <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--surface-muted)]">
            <div
              className="h-full rounded-full bg-[var(--primary)] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {exam.questions.map((q, index) => {
              const answered = Boolean(answers[q.id]);
              const flagged = Boolean(reviewFlags[q.id]);
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => scrollToQuestion(q.id)}
                  className={`nk-btn nk-btn-secondary !px-3 !py-1 text-xs ${
                    flagged ? "ring-2 ring-amber-300" : answered ? "ring-2 ring-emerald-300" : ""
                  }`}
                >
                  س{index + 1}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      <form action={onSubmitAction} className="grid gap-4">
        <input type="hidden" name="examId" value={exam.id} />
        <input type="hidden" name="courseId" value={courseId} />

        {exam.questions.map((q, index) => {
          const answered = Boolean(answers[q.id]);
          const flagged = Boolean(reviewFlags[q.id]);
          return (
            <Card key={q.id} className="scroll-mt-32" id={`question-${q.id}`}>
              <input type="hidden" name={`q_${q.id}`} value={answers[q.id] ?? ""} />
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">
                  {index + 1}. {q.text}
                </p>
                <div className="flex items-center gap-2">
                  <StatusBadge text={answered ? "تمت الإجابة" : "بدون إجابة"} tone={answered ? "success" : "muted"} />
                  <button
                    type="button"
                    onClick={() => toggleReviewFlag(q.id)}
                    aria-pressed={flagged}
                    aria-label={flagged ? "إلغاء الإشارة للمراجعة" : "إشارة للمراجعة"}
                    title={flagged ? "إلغاء الإشارة للمراجعة" : "إشارة للمراجعة"}
                    className={`nk-btn nk-btn-secondary inline-flex items-center justify-center !p-2 text-xs ${flagged ? "ring-2 ring-amber-300" : ""}`}
                  >
                    <BookmarkForReviewIcon filled={flagged} />
                  </button>
                </div>
              </div>

              <div className="grid gap-2">
                {q.choices.map((c) => {
                  const selected = answers[q.id] === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: c.id }))}
                      type="button"
                      className={`grid grid-cols-[1fr_auto] items-start gap-3 rounded-xl border px-3 py-3 text-sm transition-all ${
                        selected
                          ? "border-[var(--primary)] bg-[var(--primary-soft)]"
                          : "border-[var(--border)] bg-[var(--surface-muted)]"
                      }`}
                    >
                      <span className="text-right leading-7">{c.text}</span>
                      <span
                        className={`mt-1 grid h-5 w-5 place-items-center justify-self-end rounded-full border-2 bg-white transition-all duration-200 ${
                          selected
                            ? "border-[var(--primary)] shadow-[0_0_0_3px_rgba(52,89,230,0.14)]"
                            : "border-[#94a3b8]"
                        }`}
                      >
                        <span
                          className={`h-2.5 w-2.5 rounded-full bg-[var(--primary)] transition-all duration-200 ${
                            selected ? "scale-100 opacity-100" : "scale-75 opacity-0"
                          }`}
                        />
                      </span>
                    </button>
                  );
                })}
              </div>
            </Card>
          );
        })}

        <button type="submit" disabled={answeredCount !== totalQuestions} className="nk-btn nk-btn-primary w-fit disabled:opacity-50 disabled:cursor-not-allowed">
          تسليم الاختبار
        </button>
        {answeredCount !== totalQuestions ? (
          <p className="text-xs text-amber-700">يرجى الإجابة على جميع الأسئلة قبل تسليم الاختبار.</p>
        ) : null}
      </form>

      <p className="text-xs text-zinc-500">عدد المحاولات متاح بدون حد في النسخة الحالية.</p>
      <p className="text-xs text-zinc-500">أنت مسجل باسم: {userName}</p>
    </div>
  );
}
