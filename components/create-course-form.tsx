"use client";

import { useActionState } from "react";
import { createCourseAction, type CreateCourseState } from "@/app/admin/(instructor)/courses/actions";
import { Card } from "@/components/ui";
import { snackbarError } from "@/lib/snackbar";
import { useOnSerialChange } from "@/lib/use-on-serial-change";

export function CreateCourseForm() {
  const [state, formAction, pending] = useActionState(createCourseAction, null as CreateCourseState);

  useOnSerialChange(JSON.stringify(state ?? null), () => {
    if (state?.ok === false) snackbarError(state.error);
  });

  return (
    <Card elevated className="max-w-2xl grid gap-4 p-5">
      <form action={formAction} className="grid gap-4">
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-[var(--foreground)]">عنوان الدورة</span>
          <input
            name="title"
            required
            maxLength={300}
            placeholder="مثال: مهارات التواصل الفعّال"
            className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span className="font-medium text-[var(--foreground)]">وصف الدورة</span>
          <textarea
            name="description"
            required
            rows={6}
            placeholder="نبذة يفهمها المتدربون عن أهداف الدورة ومحتواها."
            className="min-h-[8rem] rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2"
          />
        </label>
        {state?.ok === false ? <p className="text-sm text-rose-700">{state.error}</p> : null}
        <button type="submit" disabled={pending} className="nk-btn nk-btn-primary w-fit disabled:opacity-50">
          {pending ? "جارٍ الإنشاء…" : "إنشاء الدورة"}
        </button>
      </form>
    </Card>
  );
}
