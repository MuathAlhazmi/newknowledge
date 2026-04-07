"use server";

import { revalidatePath } from "next/cache";
import { ExamType } from "@prisma/client";
import { z } from "zod";
import { requireInstructor } from "@/lib/auth";
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

export type SaveExamState = { ok: true; message: string } | { ok: false; error: string } | null;

export async function saveGradedExamAction(
  _prev: SaveExamState,
  formData: FormData,
): Promise<SaveExamState> {
  await requireInstructor();
  const errs = arCopy.adminExams.editorErrors;

  const courseId = String(formData.get("courseId") ?? "").trim();
  const examTypeRaw = String(formData.get("examType") ?? "").trim().toUpperCase();
  const payloadRaw = String(formData.get("payload") ?? "").trim();

  if (!courseId) {
    return { ok: false, error: errs.invalidPayload };
  }

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
    });
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
