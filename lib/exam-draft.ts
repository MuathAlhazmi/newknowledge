import { randomBytes } from "crypto";
import { ExamAttemptStatus, QuestionKind } from "@prisma/client";
import { db } from "@/lib/db";
import { shuffleIds, type ExamLayoutPayload } from "@/lib/exam-shuffle";

export type DisplayQuestion =
  | {
      id: string;
      text: string;
      order: number;
      kind: "MCQ";
      choices: { id: string; text: string }[];
    }
  | {
      id: string;
      text: string;
      order: number;
      kind: "SHORT_ANSWER";
      rubric: string | null;
    };

export function buildDisplayQuestions(
  questions: Array<{
    id: string;
    text: string;
    order: number;
    kind: QuestionKind;
    rubric: string | null;
    choices: Array<{ id: string; text: string }>;
  }>,
  layout: ExamLayoutPayload,
): DisplayQuestion[] {
  const qMap = new Map(questions.map((q) => [q.id, q]));
  return layout.questionIds.map((id, idx) => {
    const q = qMap.get(id);
    if (!q) {
      throw new Error(`missing_question:${id}`);
    }
    const order = idx + 1;
    if (q.kind === QuestionKind.SHORT_ANSWER) {
      return { id: q.id, text: q.text, order, kind: "SHORT_ANSWER" as const, rubric: q.rubric };
    }
    const cOrder = layout.choiceOrders[q.id] ?? q.choices.map((c) => c.id);
    const cmap = new Map(q.choices.map((c) => [c.id, c]));
    const choices = cOrder.map((cid) => cmap.get(cid)).filter((c): c is (typeof q.choices)[0] => Boolean(c));
    return {
      id: q.id,
      text: q.text,
      order,
      kind: "MCQ" as const,
      choices: choices.map((c) => ({ id: c.id, text: c.text })),
    };
  });
}

type QuestionWithChoices = {
  id: string;
  order: number;
  kind: QuestionKind;
  choices: { id: string }[];
};

export function buildExamLayout(
  questions: QuestionWithChoices[],
  exam: { shuffleQuestions: boolean; shuffleChoices: boolean },
  seed: string,
): ExamLayoutPayload {
  const sorted = [...questions].sort((a, b) => a.order - b.order);
  const baseIds = sorted.map((q) => q.id);
  const questionIds = exam.shuffleQuestions ? shuffleIds(baseIds, `${seed}:q`) : baseIds;

  const choiceOrders: Record<string, string[]> = {};
  for (const q of sorted) {
    if (q.kind !== QuestionKind.MCQ) continue;
    const cids = q.choices.map((c) => c.id);
    choiceOrders[q.id] = exam.shuffleChoices ? shuffleIds(cids, `${seed}:c:${q.id}`) : cids;
  }

  return { questionIds, choiceOrders };
}

export type DraftExamResult =
  | { blocked: true; reason: "max_attempts" }
  | {
      blocked: false;
      attemptId: string;
      layout: ExamLayoutPayload;
      displayQuestions: DisplayQuestion[];
    };

export async function ensureExamDraft(
  userId: string,
  courseId: string,
  examId: string,
): Promise<DraftExamResult | null> {
  const exam = await db.exam.findFirst({
    where: { id: examId, courseId, isActive: true },
    include: {
      questions: {
        include: { choices: { select: { id: true, text: true, isCorrect: true } } },
        orderBy: { order: "asc" },
      },
    },
  });
  if (!exam) {
    return null;
  }

  const submittedCount = await db.examAttempt.count({
    where: { userId, examId, submittedAt: { not: null } },
  });
  if (exam.maxAttempts != null && submittedCount >= exam.maxAttempts) {
    return { blocked: true, reason: "max_attempts" };
  }

  await db.examAttempt.deleteMany({
    where: { userId, examId, submittedAt: null },
  });

  const seed = randomBytes(16).toString("hex");
  const layout = buildExamLayout(exam.questions, exam, seed);
  const attemptNumber = submittedCount + 1;

  const draft = await db.examAttempt.create({
    data: {
      userId,
      examId,
      attemptNumber,
      status: ExamAttemptStatus.DRAFT,
      shuffleSeed: seed,
      layoutJson: JSON.stringify(layout),
    },
  });

  const displayQuestions = buildDisplayQuestions(
    exam.questions.map((q) => ({
      id: q.id,
      text: q.text,
      order: q.order,
      kind: q.kind,
      rubric: q.rubric,
      choices: q.choices.map((c) => ({ id: c.id, text: c.text })),
    })),
    layout,
  );

  return { blocked: false, attemptId: draft.id, layout, displayQuestions };
}
