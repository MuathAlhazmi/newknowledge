"use client";

import { useActionState } from "react";
import type { AddEnrollmentState } from "@/app/admin/(instructor)/courses/[courseId]/enrollments/actions";
import { addEnrollmentAction } from "@/app/admin/(instructor)/courses/[courseId]/enrollments/actions";
import { Card } from "@/components/ui";

export type EnrollmentCandidate = { id: string; name: string; email: string };

export function AddEnrollmentForm({
  courseId,
  candidates,
}: {
  courseId: string;
  candidates: EnrollmentCandidate[];
}) {
  const [state, formAction, pending] = useActionState(addEnrollmentAction, null as AddEnrollmentState);

  if (candidates.length === 0) {
    return (
      <Card elevated className="p-4 text-sm text-[var(--text-muted)]">
        لا يوجد متدربون متاحون للإضافة؛ إذ إن جميع المتدربين مسجلون في هذه الدورة، أو لا يوجد متدربون معتمدو الحساب.
      </Card>
    );
  }

  return (
    <Card elevated className="grid gap-4 p-4">
      <h2 className="text-base font-semibold">إضافة متدرب إلى الدورة</h2>
      <form action={formAction} className="grid gap-3">
        <input type="hidden" name="courseId" value={courseId} />
        <label className="grid gap-2 text-sm">
          <span className="font-medium">المتدرب</span>
          <select name="userId" required className="max-w-xl">
            <option value="">اختر المتدرب</option>
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.email})
              </option>
            ))}
          </select>
        </label>
        <fieldset className="grid gap-2 text-sm">
          <legend className="font-medium">حالة التسجيل</legend>
          <label className="flex items-center gap-2">
            <input type="radio" name="status" value="APPROVED" defaultChecked />
            <span>اعتماد فوري (وصول كامل للمحتوى)</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="status" value="PENDING" />
            <span>قيد اعتماد التسجيل (يمكنك اعتماد الطلب لاحقًا)</span>
          </label>
        </fieldset>
        {state?.error && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {state.error}
          </p>
        )}
        <button type="submit" disabled={pending} className="nk-btn nk-btn-primary w-fit disabled:opacity-50">
          {pending ? "جارٍ الإضافة..." : "إضافة"}
        </button>
      </form>
    </Card>
  );
}
