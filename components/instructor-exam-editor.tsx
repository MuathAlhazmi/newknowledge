"use client";

import { useState, useTransition, type FormEvent } from "react";
import {
  saveGradedExamAction,
  type SaveExamState,
} from "@/app/admin/(instructor)/courses/[courseId]/exam-actions";
import { arCopy } from "@/lib/copy/ar";
import { Card, WarningCard } from "@/components/ui";

function makeRowId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `r_${Math.random().toString(36).slice(2)}`;
}

type ChoiceRow = { id: string; text: string; isCorrect: boolean };
type QuestionRow = { id: string; text: string; choices: ChoiceRow[] };

function defaultQuestion(): QuestionRow {
  const c1 = makeRowId();
  const c2 = makeRowId();
  return {
    id: makeRowId(),
    text: "",
    choices: [
      { id: c1, text: "", isCorrect: true },
      { id: c2, text: "", isCorrect: false },
    ],
  };
}

function rowsFromInitial(
  initial: InstructorExamEditorProps["initial"],
): QuestionRow[] {
  if (initial.questions.length === 0) {
    return [defaultQuestion()];
  }
  return initial.questions.map((q) => ({
    id: makeRowId(),
    text: q.text,
    choices: q.choices.map((c) => ({
      id: makeRowId(),
      text: c.text,
      isCorrect: c.isCorrect,
    })),
  }));
}

export type InstructorExamEditorProps = {
  courseId: string;
  examType: "PRE" | "POST";
  initial: {
    title: string;
    durationMinutes: number;
    isActive: boolean;
    questions: { text: string; choices: { text: string; isCorrect: boolean }[] }[];
  };
};

export function InstructorExamEditor({ courseId, examType, initial }: InstructorExamEditorProps) {
  const ae = arCopy.adminExams;
  const [title, setTitle] = useState(initial.title);
  const [durationMinutes, setDurationMinutes] = useState(String(initial.durationMinutes));
  const [isActive, setIsActive] = useState(initial.isActive);
  const [questions, setQuestions] = useState<QuestionRow[]>(() => rowsFromInitial(initial));
  const [state, setState] = useState<SaveExamState>(null);
  const [isPending, startTransition] = useTransition();

  function setCorrectAnswer(questionId: string, choiceId: string) {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? {
              ...q,
              choices: q.choices.map((c) => ({
                ...c,
                isCorrect: c.id === choiceId,
              })),
            }
          : q,
      ),
    );
  }

  function addQuestion() {
    setQuestions((prev) => [...prev, defaultQuestion()]);
  }

  function removeQuestion(id: string) {
    setQuestions((prev) => (prev.length <= 1 ? prev : prev.filter((q) => q.id !== id)));
  }

  function addChoice(questionId: string) {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? {
              ...q,
              choices: [
                ...q.choices,
                { id: makeRowId(), text: "", isCorrect: false },
              ],
            }
          : q,
      ),
    );
  }

  function removeChoice(questionId: string, choiceId: string) {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== questionId || q.choices.length <= 2) return q;
        const next = q.choices.filter((c) => c.id !== choiceId);
        if (!next.some((c) => c.isCorrect) && next.length > 0) {
          next[0] = { ...next[0], isCorrect: true };
        }
        return { ...q, choices: next };
      }),
    );
  }

  function updateQuestionText(id: string, text: string) {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, text } : q)));
  }

  function updateChoiceText(questionId: string, choiceId: string, text: string) {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId
          ? {
              ...q,
              choices: q.choices.map((c) => (c.id === choiceId ? { ...c, text } : c)),
            }
          : q,
      ),
    );
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const dur = Number(durationMinutes);
    const payload = {
      title: title.trim(),
      durationMinutes: dur,
      isActive,
      questions: questions.map((q) => ({
        text: q.text.trim(),
        choices: q.choices.map((c) => ({
          text: c.text.trim(),
          isCorrect: c.isCorrect,
        })),
      })),
    };

    const fd = new FormData();
    fd.set("courseId", courseId);
    fd.set("examType", examType);
    fd.set("payload", JSON.stringify(payload));

    startTransition(async () => {
      const next = await saveGradedExamAction(state, fd);
      setState(next);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      {state?.ok === false ? <WarningCard>{state.error}</WarningCard> : null}
      {state?.ok === true ? (
        <Card elevated variant="highlight" interactive={false} className="border border-emerald-700/30 bg-emerald-950/20 p-4 text-sm text-emerald-100">
          {state.message}
        </Card>
      ) : null}

      <Card elevated className="grid gap-4 p-5">
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-[var(--foreground)]">{ae.examTitleLabel}</span>
          <input
            className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)]"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-[var(--foreground)]">{ae.durationLabel}</span>
          <input
            type="number"
            min={1}
            max={600}
            className="w-full max-w-[12rem] rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-[var(--foreground)]"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            required
          />
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-[var(--border)]"
          />
          <span className="font-medium text-[var(--foreground)]">{ae.activeLabel}</span>
        </label>
      </Card>

      <div className="grid gap-4">
        <h2 className="text-base font-bold text-[var(--foreground)]">{ae.questionsTitle}</h2>
        {questions.map((q, qi) => (
          <Card key={q.id} elevated className="grid gap-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold text-[var(--text-muted)]">
                {ae.questionLabel} {qi + 1}
              </span>
              <button
                type="button"
                className="nk-btn nk-btn-secondary text-xs"
                onClick={() => removeQuestion(q.id)}
                disabled={questions.length <= 1}
              >
                {ae.removeQuestion}
              </button>
            </div>
            <textarea
              className="min-h-[4rem] w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
              value={q.text}
              onChange={(e) => updateQuestionText(q.id, e.target.value)}
              required
            />
            <div className="grid gap-2">
              <span className="text-sm font-medium text-[var(--foreground)]">{ae.choicesTitle}</span>
              <ul className="grid gap-3">
                {q.choices.map((c) => (
                  <li
                    key={c.id}
                    className="flex flex-col gap-2 rounded-md border border-[var(--border)] p-3 sm:flex-row sm:items-center sm:gap-3"
                  >
                    <label className="flex shrink-0 items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name={`correct-${q.id}`}
                        checked={c.isCorrect}
                        onChange={() => setCorrectAnswer(q.id, c.id)}
                        className="h-4 w-4"
                      />
                      <span className="text-[var(--text-muted)]">{ae.correctLabel}</span>
                    </label>
                    <input
                      className="min-w-0 flex-1 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
                      value={c.text}
                      onChange={(e) => updateChoiceText(q.id, c.id, e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="nk-btn nk-btn-secondary shrink-0 text-xs disabled:opacity-50"
                      onClick={() => removeChoice(q.id, c.id)}
                      disabled={q.choices.length <= 2}
                    >
                      {ae.removeChoice}
                    </button>
                  </li>
                ))}
              </ul>
              <button type="button" className="nk-btn nk-btn-secondary w-fit text-xs" onClick={() => addChoice(q.id)}>
                {ae.addChoice}
              </button>
            </div>
          </Card>
        ))}
        <button type="button" className="nk-btn nk-btn-secondary w-fit text-sm" onClick={addQuestion}>
          {ae.addQuestion}
        </button>
      </div>

      <button type="submit" className="nk-btn nk-btn-primary w-fit" disabled={isPending}>
        {isPending ? ae.savingQuiz : ae.saveQuiz}
      </button>
    </form>
  );
}
