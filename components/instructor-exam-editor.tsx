"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  importExamFromSheetAction,
  saveGradedExamAction,
  type SaveExamState,
} from "@/app/admin/(instructor)/courses/[courseId]/exam-actions";
import { arCopy } from "@/lib/copy/ar";
import { Card } from "@/components/ui";
import { snackbarError, snackbarSuccess } from "@/lib/snackbar";
import { useOnSerialChange } from "@/lib/use-on-serial-change";
import {
  mapRowsWithMapping,
  parseExamImportFile,
  suggestImportMapping,
  type ImportColumnMapping,
  type ParsedImportTable,
} from "@/lib/exam-import-parser";

function makeRowId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `r_${Math.random().toString(36).slice(2)}`;
}

type ChoiceRow = { id: string; text: string; isCorrect: boolean };
type QuestionRow = {
  id: string;
  kind: "MCQ" | "SHORT_ANSWER";
  text: string;
  points: number;
  rubric: string;
  choices: ChoiceRow[];
};
type MappingField = keyof ImportColumnMapping;

const mappingFieldOrder: MappingField[] = [
  "question",
  "choice1",
  "choice2",
  "choice3",
  "choice4",
  "correct",
  "order",
];

function emptyMapping(): ImportColumnMapping {
  return {
    question: "",
    choice1: "",
    choice2: "",
    choice3: "",
    choice4: "",
    correct: "",
    order: "",
  };
}

function defaultQuestion(seed?: string): QuestionRow {
  const qid = seed ?? makeRowId();
  const c1 = seed ? `${seed}-c-1` : makeRowId();
  const c2 = seed ? `${seed}-c-2` : makeRowId();
  return {
    id: qid,
    kind: "MCQ",
    text: "",
    points: 1,
    rubric: "",
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
    return [defaultQuestion("init-q-1")];
  }
  return initial.questions.map((q, qi) => {
    const kind = q.kind === "SHORT_ANSWER" ? "SHORT_ANSWER" : "MCQ";
    const mappedChoices =
      kind === "MCQ"
        ? q.choices.map((c, ci) => ({
            id: `init-q-${qi + 1}-c-${ci + 1}`,
            text: c.text,
            isCorrect: c.isCorrect,
          }))
        : [];
    const choices =
      kind === "MCQ" && mappedChoices.length >= 2
        ? mappedChoices
        : kind === "MCQ"
          ? defaultQuestion(`init-q-${qi + 1}`).choices
          : [];
    return {
      id: `init-q-${qi + 1}`,
      kind,
      text: q.text,
      points: q.points ?? 1,
      rubric: q.rubric?.trim() ?? "",
      choices,
    };
  });
}

export type InstructorExamEditorProps = {
  courseId: string;
  examType: "PRE" | "POST";
  canEdit?: boolean;
  initial: {
    title: string;
    durationMinutes: number;
    isActive: boolean;
    questions: {
      text: string;
      kind?: "MCQ" | "SHORT_ANSWER";
      points?: number;
      rubric?: string | null;
      choices: { text: string; isCorrect: boolean }[];
    }[];
  };
};

export function InstructorExamEditor({ courseId, examType, initial, canEdit = true }: InstructorExamEditorProps) {
  const router = useRouter();
  const ae = arCopy.adminExams;
  const [title, setTitle] = useState(initial.title);
  const [durationMinutes, setDurationMinutes] = useState(String(initial.durationMinutes));
  const [isActive, setIsActive] = useState(initial.isActive);
  const [questions, setQuestions] = useState<QuestionRow[]>(() => rowsFromInitial(initial));
  const [state, setState] = useState<SaveExamState>(null);
  const [isPending, startTransition] = useTransition();
  const [importTable, setImportTable] = useState<ParsedImportTable | null>(null);
  const [mapping, setMapping] = useState<ImportColumnMapping>(() => emptyMapping());
  const [importPreview, setImportPreview] = useState<
    { questionText: string; choices: [string, string, string, string]; correctRaw: string; orderRaw: string }[]
  >([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importPending, startImportTransition] = useTransition();

  useOnSerialChange(JSON.stringify(state ?? null), () => {
    if (!state) return;
    if (state.ok === true) snackbarSuccess(state.message);
    if (state.ok === false) snackbarError(state.error);
  });

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

  function setQuestionKind(id: string, kind: "MCQ" | "SHORT_ANSWER") {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;
        if (kind === "SHORT_ANSWER") {
          return { ...q, kind: "SHORT_ANSWER", choices: [] };
        }
        const nextChoices =
          q.choices.length >= 2
            ? q.choices
            : defaultQuestion().choices;
        return { ...q, kind: "MCQ", choices: nextChoices };
      }),
    );
  }

  function updateQuestionPoints(id: string, points: number) {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, points } : q)));
  }

  function updateRubric(id: string, rubric: string) {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, rubric } : q)));
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

  function recalcPreview(table: ParsedImportTable, nextMapping: ImportColumnMapping) {
    const mapped = mapRowsWithMapping(table.rows, nextMapping);
    setImportPreview(mapped.slice(0, 5));
  }

  async function handleImportFile(file: File | null) {
    if (!file) {
      setImportTable(null);
      setMapping(emptyMapping());
      setImportPreview([]);
      return;
    }
    setImportLoading(true);
    const parsed = await parseExamImportFile(file);
    setImportLoading(false);
    if (!parsed.ok) {
      const ie = ae.import.errors;
      const msg =
        parsed.code === "empty_file"
          ? ie.emptyFile
          : parsed.code === "unsupported_type"
            ? ie.unsupportedType
            : parsed.code === "empty_sheet"
              ? ie.emptySheet
              : ie.parseFailed;
      snackbarError(msg);
      setImportTable(null);
      setImportPreview([]);
      setMapping(emptyMapping());
      return;
    }
    const guessed = suggestImportMapping(parsed.table.headers);
    setImportTable(parsed.table);
    setMapping(guessed);
    recalcPreview(parsed.table, guessed);
    snackbarSuccess(ae.import.mappingTitle);
  }

  function setMappingField(field: MappingField, value: string) {
    const next = { ...mapping, [field]: value };
    setMapping(next);
    if (importTable) recalcPreview(importTable, next);
  }

  function runImport() {
    if (!importTable) return;
    const mappedRows = mapRowsWithMapping(importTable.rows, mapping);
    const fd = new FormData();
    fd.set("courseId", courseId);
    fd.set("examType", examType);
    fd.set(
      "payload",
      JSON.stringify({
        title: title.trim(),
        durationMinutes: Number(durationMinutes),
        isActive,
        rows: mappedRows,
      }),
    );
    startImportTransition(async () => {
      const next = await importExamFromSheetAction(state, fd);
      setState(next);
      if (next?.ok === true) {
        router.refresh();
      }
    });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canEdit) return;
    const dur = Number(durationMinutes);
    const payload = {
      title: title.trim(),
      durationMinutes: dur,
      isActive,
      shuffleQuestions: false,
      shuffleChoices: false,
      maxAttempts: null as number | null,
      reviewWindowMinutes: null as number | null,
      showSolutionsAfter: "NEVER" as const,
      allowReviewWhileAttempt: true,
      questions: questions.map((q) =>
        q.kind === "SHORT_ANSWER"
          ? {
              kind: "SHORT_ANSWER" as const,
              points: q.points,
              text: q.text.trim(),
              rubric: q.rubric.trim(),
              choices: [],
            }
          : {
              kind: "MCQ" as const,
              points: q.points,
              text: q.text.trim(),
              choices: q.choices.map((c) => ({
                text: c.text.trim(),
                isCorrect: c.isCorrect,
              })),
            },
      ),
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
      {!canEdit ? (
        <p className="text-sm text-[var(--text-muted)]">صلاحية عرض فقط — التعديل والحفظ غير متاحين.</p>
      ) : null}
      <fieldset disabled={!canEdit} className="grid gap-6 [fieldset:disabled]:opacity-70">
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
            className="nk-check"
          />
          <span className="font-medium text-[var(--foreground)]">{ae.activeLabel}</span>
        </label>
      </Card>

      <Card elevated className="grid gap-4 p-5">
        <h2 className="text-base font-bold text-[var(--foreground)]">{ae.import.title}</h2>
        <p className="text-xs text-[var(--text-muted)]">{ae.import.hint}</p>
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-[var(--foreground)]">{ae.import.uploadLabel}</span>
          <input
            type="file"
            accept=".csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            className="max-w-xl"
            onChange={(e) => void handleImportFile(e.target.files?.[0] ?? null)}
          />
        </label>
        <p className="text-xs text-[var(--text-muted)]">{ae.import.sampleColumnsHint}</p>
        {importLoading ? (
          <p className="text-xs text-[var(--text-muted)]">{ae.import.importing}</p>
        ) : null}

        {importTable ? (
          <div className="grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/30 p-3">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">{ae.import.mappingTitle}</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {mappingFieldOrder.map((field) => (
                <label key={field} className="grid gap-1 text-xs">
                  <span className="font-medium text-[var(--foreground)]">
                    {ae.import.fields[field]}
                  </span>
                  <select
                    value={mapping[field]}
                    onChange={(e) => setMappingField(field, e.target.value)}
                    className="rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-1.5"
                  >
                    <option value="">—</option>
                    {importTable.headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>

            <h3 className="text-sm font-semibold text-[var(--foreground)]">{ae.import.previewTitle}</h3>
            {importPreview.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)]">{ae.import.noMappingYet}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[38rem] text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-start">
                      <th className="py-1 pe-2">{ae.import.fields.question}</th>
                      <th className="py-1 pe-2">{ae.import.fields.choice1}</th>
                      <th className="py-1 pe-2">{ae.import.fields.choice2}</th>
                      <th className="py-1 pe-2">{ae.import.fields.choice3}</th>
                      <th className="py-1 pe-2">{ae.import.fields.choice4}</th>
                      <th className="py-1 pe-2">{ae.import.fields.correct}</th>
                      <th className="py-1">{ae.import.fields.order}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importPreview.map((r, i) => (
                      <tr key={i} className="border-b border-[var(--border-muted-edge)]">
                        <td className="py-1 pe-2">{r.questionText}</td>
                        <td className="py-1 pe-2">{r.choices[0]}</td>
                        <td className="py-1 pe-2">{r.choices[1]}</td>
                        <td className="py-1 pe-2">{r.choices[2]}</td>
                        <td className="py-1 pe-2">{r.choices[3]}</td>
                        <td className="py-1 pe-2">{r.correctRaw}</td>
                        <td className="py-1">{r.orderRaw}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <button
              type="button"
              className="nk-btn nk-btn-secondary w-fit"
              onClick={runImport}
              disabled={importPending || !mapping.question || !mapping.choice1 || !mapping.choice2 || !mapping.correct}
            >
              {importPending ? ae.import.importing : ae.import.importButton}
            </button>
          </div>
        ) : null}
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
            <div className="flex flex-wrap gap-3">
              <label className="grid gap-1 text-sm">
                <span className="font-medium">نوع السؤال</span>
                <select
                  className="rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-1.5"
                  value={q.kind}
                  onChange={(e) => setQuestionKind(q.id, e.target.value === "SHORT_ANSWER" ? "SHORT_ANSWER" : "MCQ")}
                >
                  <option value="MCQ">اختيار من متعدد</option>
                  <option value="SHORT_ANSWER">إجابة قصيرة (تصحيح يدوي)</option>
                </select>
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium">الدرجة</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  className="w-24 rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-1.5"
                  value={q.points}
                  onChange={(e) => updateQuestionPoints(q.id, Number(e.target.value) || 1)}
                />
              </label>
            </div>
            <textarea
              className="min-h-[4rem] w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)]"
              value={q.text}
              onChange={(e) => updateQuestionText(q.id, e.target.value)}
              required
            />
            {q.kind === "SHORT_ANSWER" ? (
              <label className="grid gap-1 text-sm">
                <span className="font-medium text-[var(--foreground)]">سلم التقييم / المعايير (للمصحح)</span>
                <textarea
                  className="min-h-[5rem] w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
                  value={q.rubric}
                  onChange={(e) => updateRubric(q.id, e.target.value)}
                  required
                />
              </label>
            ) : (
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
                          name={`correct-${qi}`}
                          checked={c.isCorrect}
                          onChange={() => setCorrectAnswer(q.id, c.id)}
                          className="nk-radio"
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
            )}
          </Card>
        ))}
        <button type="button" className="nk-btn nk-btn-secondary w-fit text-sm" onClick={addQuestion}>
          {ae.addQuestion}
        </button>
      </div>

      {canEdit ? (
        <button type="submit" className="nk-btn nk-btn-primary w-fit" disabled={isPending}>
          {isPending ? ae.savingQuiz : ae.saveQuiz}
        </button>
      ) : null}
      </fieldset>
    </form>
  );
}
