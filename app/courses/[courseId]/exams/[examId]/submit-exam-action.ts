"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ExamAttemptStatus } from "@prisma/client";
import { requireParticipant } from "@/lib/auth";
import { ensureCourseCompletion } from "@/lib/course-progress";
import { db } from "@/lib/db";
import { finalizeExamAttemptFromForm } from "@/lib/exam-submit";

function getInternalBaseUrl(h: Headers): string | null {
  const envBase = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL;
  if (envBase?.trim()) return envBase.trim().replace(/\/$/, "");
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return null;
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export async function submitExamAction(formData: FormData) {
  const user = await requireParticipant();
  const examId = String(formData.get("examId") ?? "").trim();
  const courseId = String(formData.get("courseId") ?? "").trim();
  const attemptId = String(formData.get("attemptId") ?? "").trim();
  if (!examId || !courseId || !attemptId) return;

  const result = await finalizeExamAttemptFromForm(user.id, courseId, attemptId, formData);
  if (!result.ok) return;

  const updated = await db.examAttempt.findUnique({
    where: { id: attemptId },
    select: { status: true },
  });

  if (updated?.status === ExamAttemptStatus.COMPLETE) {
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
  }

  await ensureCourseCompletion(user.id, courseId);

  revalidatePath(`/courses/${courseId}/exams`);
  redirect(`/courses/${courseId}/exams`);
}
