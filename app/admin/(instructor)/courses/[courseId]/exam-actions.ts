"use server";

import { revalidatePath } from "next/cache";
import { ExamType } from "@prisma/client";
import { z } from "zod";
import { requireCourseEditor } from "@/lib/course-staff";
import { arCopy } from "@/lib/copy/ar";
import { db } from "@/lib/db";

const choiceSchema = z.object({
  text: z.string().trim().min(1),
  isCorrect: z.boolean(),
});

const questionSchema = z
  .object({
    text: z.string().trim().min(1),
    choices: z.array(choiceSchema).min(2).max(12),
  })
  .superRefine((q, ctx) => {
    const correct = q.choices.filter((c) => c.isCorrect).length;
    if (correct !== 1) {
      ctx.addIssue({
        code: "custom",
        message: "one_correct",
        path: ["choices"],
      });
    }
  });

const payloadSchema = z.object({
  title: z.string().trim().min(1).max(300),
  durationMinutes: z.coerce.number().int().min(1).max(600),
  isActive: z.boolean(),
  questions: z.array(questionSchema).min(1).max(80),
});

const importRowSchema = z.object({
  questionText: z.string().trim().min(1),
  choices: z.tuple([z.string(), z.string(), z.string(), z.string()]),
  correctRaw: z.string().trim().min(1),
  orderRaw: z.string().optional().default(""),
});

const importPayloadSchema = z.object({
  title: z.string().trim().min(1).max(300),
  durationMinutes: z.coerce.number().int().min(1).max(600),
  isActive: z.boolean(),
  rows: z.array(importRowSchema).min(1).max(500),
});

const INTERACTIVE_TX_OPTIONS = {
  // Import can write hundreds of rows (question + choices), so default 5s may expire.
  maxWait: 20_000,
  timeout: 60_000,
} as const;

export type SaveExamState = { ok: true; message: string } | { ok: false; error: string } | null;

function parseCorrectIndex(raw: string): number | null {
  const v = raw.trim().toUpperCase();
  if (v === "A" || v === "1") return 0;
  if (v === "B" || v === "2") return 1;
  if (v === "C" || v === "3") return 2;
  if (v === "D" || v === "4") return 3;
  return null;
}

function normalizeImportedQuestions(rows: z.infer<typeof importRowSchema>[]) {
  const out: { order: number; text: string; choices: { text: string; isCorrect: boolean }[] }[] = [];
  rows.forEach((row, idx) => {
    const correctIdx = parseCorrectIndex(row.correctRaw);
    if (correctIdx == null) {
      throw new Error(`INVALID_CORRECT_${idx + 1}`);
    }
    const withIndex = row.choices
      .map((c, i) => ({ i, text: c.trim() }))
      .filter((c) => c.text.length > 0);
    if (withIndex.length < 2) {
      throw new Error(`MIN_CHOICES_${idx + 1}`);
    }
    if (!withIndex.some((c) => c.i === correctIdx)) {
      throw new Error(`CORRECT_EMPTY_${idx + 1}`);
    }
    const orderRaw = row.orderRaw?.trim() ?? "";
    const orderNum = orderRaw ? Number(orderRaw) : Number.NaN;
    out.push({
      order: Number.isFinite(orderNum) && orderNum > 0 ? Math.floor(orderNum) : idx + 1,
      text: row.questionText.trim(),
      choices: withIndex.map((c) => ({
        text: c.text,
        isCorrect: c.i === correctIdx,
      })),
    });
  });
  return out.sort((a, b) => a.order - b.order);
}

export async function saveGradedExamAction(
  _prev: SaveExamState,
  formData: FormData,
): Promise<SaveExamState> {
  const errs = arCopy.adminExams.editorErrors;

  const courseId = String(formData.get("courseId") ?? "").trim();
  if (!courseId) {
    return { ok: false, error: errs.invalidPayload };
  }
  await requireCourseEditor(courseId);
  const examTypeRaw = String(formData.get("examType") ?? "").trim().toUpperCase();
  const payloadRaw = String(formData.get("payload") ?? "").trim();

  if (examTypeRaw !== "PRE" && examTypeRaw !== "POST") {
    return { ok: false, error: errs.invalidExamType };
  }
  const type = examTypeRaw as ExamType;

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(payloadRaw) as unknown;
  } catch {
    return { ok: false, error: errs.jsonParse };
  }

  const parsed = payloadSchema.safeParse(parsedJson);
  if (!parsed.success) {
    return { ok: false, error: errs.questions };
  }

  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { id: true },
  });
  if (!course) {
    return { ok: false, error: errs.courseNotFound };
  }

  const { title, durationMinutes, isActive, questions } = parsed.data;

  try {
    await db.$transaction(async (tx) => {
      // Use findFirst + update/create instead of upsert: upsert relies on ON CONFLICT
      // matching a DB unique on (courseId, type). If migration `exam_course_type_unique`
      // is not applied yet, upsert throws Postgres 42P10.
      const existing = await tx.exam.findFirst({
        where: { courseId, type },
        select: { id: true },
      });
      const exam = existing
        ? await tx.exam.update({
            where: { id: existing.id },
            data: { title, durationMinutes, isActive },
          })
        : await tx.exam.create({
            data: {
              courseId,
              type,
              title,
              durationMinutes,
              isActive,
            },
          });

      await tx.question.deleteMany({ where: { examId: exam.id } });

      let order = 1;
      for (const q of questions) {
        await tx.question.create({
          data: {
            examId: exam.id,
            text: q.text,
            order: order++,
            choices: {
              create: q.choices.map((c) => ({
                text: c.text,
                isCorrect: c.isCorrect,
              })),
            },
          },
        });
      }
    }, INTERACTIVE_TX_OPTIONS);
  } catch {
    return { ok: false, error: errs.generic };
  }

  revalidatePath(`/admin/courses/${courseId}/exams`);
  revalidatePath(`/admin/courses/${courseId}/exams/edit`);
  revalidatePath(`/courses/${courseId}/exams`);
  revalidatePath(`/courses/${courseId}/exams`, "layout");
  revalidatePath(`/admin/courses/${courseId}/grades`);

  return { ok: true, message: arCopy.adminExams.saveSuccess };
}

export async function importExamFromSheetAction(
  _prev: SaveExamState,
  formData: FormData,
): Promise<SaveExamState> {
  const errs = arCopy.adminExams.import?.errors ?? arCopy.adminExams.editorErrors;
  const courseId = String(formData.get("courseId") ?? "").trim();
  if (!courseId) {
    return { ok: false, error: errs.invalidPayload };
  }
  await requireCourseEditor(courseId);

  const examTypeRaw = String(formData.get("examType") ?? "").trim().toUpperCase();
  if (examTypeRaw !== "PRE" && examTypeRaw !== "POST") {
    return { ok: false, error: errs.invalidExamType };
  }
  const type = examTypeRaw as ExamType;

  const payloadRaw = String(formData.get("payload") ?? "").trim();
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(payloadRaw);
  } catch {
    return { ok: false, error: errs.jsonParse };
  }

  const parsed = importPayloadSchema.safeParse(parsedJson);
  if (!parsed.success) {
    return { ok: false, error: errs.validation };
  }
  let normalized;
  try {
    normalized = normalizeImportedQuestions(parsed.data.rows);
  } catch {
    return { ok: false, error: errs.validation };
  }

  try {
    await db.$transaction(async (tx) => {
      const existing = await tx.exam.findFirst({
        where: { courseId, type },
        select: { id: true },
      });
      const exam = existing
        ? await tx.exam.update({
            where: { id: existing.id },
            data: {
              title: parsed.data.title,
              durationMinutes: parsed.data.durationMinutes,
              isActive: parsed.data.isActive,
            },
          })
        : await tx.exam.create({
            data: {
              courseId,
              type,
              title: parsed.data.title,
              durationMinutes: parsed.data.durationMinutes,
              isActive: parsed.data.isActive,
            },
          });

      await tx.question.deleteMany({ where: { examId: exam.id } });
      for (const q of normalized) {
        await tx.question.create({
          data: {
            examId: exam.id,
            text: q.text,
            order: q.order,
            choices: {
              create: q.choices,
            },
          },
        });
      }
    }, INTERACTIVE_TX_OPTIONS);
  } catch {
    return { ok: false, error: errs.generic };
  }

  revalidatePath(`/admin/courses/${courseId}/exams`);
  revalidatePath(`/admin/courses/${courseId}/exams/edit`);
  revalidatePath(`/courses/${courseId}/exams`);
  revalidatePath(`/courses/${courseId}/exams`, "layout");
  revalidatePath(`/admin/courses/${courseId}/grades`);

  return {
    ok: true,
    message: arCopy.adminExams.import?.success ?? arCopy.adminExams.saveSuccess,
  };
}
