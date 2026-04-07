"use client";

import { useActionState } from "react";
import type {
  CreatePlatformUserState,
  MinimalEnrollState,
} from "@/app/admin/manage-actions";
import {
  createPlatformUserAction,
  minimalEnrollAction,
} from "@/app/admin/manage-actions";
import { Card } from "@/components/ui";
import { snackbarError, snackbarSuccess } from "@/lib/snackbar";
import { useOnSerialChange } from "@/lib/use-on-serial-change";

export function CreatePlatformUserForm() {
  const [state, formAction, pending] = useActionState(
    createPlatformUserAction,
    null as CreatePlatformUserState,
  );

  const formKey = state?.kind === "success" ? String(state.resetKey) : "create-user";

  useOnSerialChange(JSON.stringify(state ?? null), () => {
    if (!state) return;
    if (state.kind === "success") snackbarSuccess(state.message);
    if (state.kind === "error") snackbarError(state.message);
  });

  return (
    <Card elevated className="grid gap-4 p-4">
      <h2 className="text-base font-semibold">إنشاء حساب</h2>
      <p className="text-sm text-[var(--text-muted)]">
        إداري، مدرب، أو متدرب. يُفعَّل الحساب على المنصة مباشرة. كلمة المرور للعرض التجريبي فقط.
      </p>
      <form key={formKey} action={formAction} className="grid gap-3">
        <label className="grid gap-2 text-sm">
          <span className="font-medium">الدور</span>
          <select name="role" required className="max-w-xl">
            <option value="PARTICIPANT">متدرب</option>
            <option value="INSTRUCTOR">مدرب</option>
            <option value="ADMIN">إدارة المنصة</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium">الاسم</span>
          <input name="name" type="text" required className="max-w-xl" />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium">البريد</span>
          <input name="email" type="email" required dir="ltr" className="max-w-xl" />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium">الجوال</span>
          <input name="phone" type="tel" required dir="ltr" className="max-w-xl" />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium">كلمة المرور (٨ أحرف على الأقل)</span>
          <input name="password" type="password" required minLength={8} className="max-w-xl" />
        </label>
        <button type="submit" disabled={pending} className="nk-btn nk-btn-primary w-fit disabled:opacity-50">
          {pending ? "جارٍ الإنشاء..." : "إنشاء الحساب"}
        </button>
      </form>
    </Card>
  );
}

export type MinimalEnrollOption = { id: string; name: string; email: string };

export function MinimalEnrollForm({
  courses,
  learners,
}: {
  courses: { id: string; title: string }[];
  learners: MinimalEnrollOption[];
}) {
  const [state, formAction, pending] = useActionState(
    minimalEnrollAction,
    null as MinimalEnrollState,
  );

  useOnSerialChange(JSON.stringify(state ?? null), () => {
    if (!state) return;
    if (state.kind === "success") snackbarSuccess(state.message);
    if (state.kind === "error") snackbarError(state.message);
  });

  if (courses.length === 0) {
    return (
      <Card elevated className="p-4 text-sm text-[var(--text-muted)]">
        لا توجد دورات في النظام بعد.
      </Card>
    );
  }

  if (learners.length === 0) {
    return (
      <Card elevated className="p-4 text-sm text-[var(--text-muted)]">
        لا يوجد متدربون باعتماد منصة جاهزون للإضافة.
      </Card>
    );
  }

  const formKey = state?.kind === "success" ? String(state.resetKey) : "minimal-enroll";

  return (
    <Card elevated className="grid gap-4 p-4">
      <h2 className="text-base font-semibold">إضافة متدرب معتمد إلى دورة</h2>
      <p className="text-sm text-[var(--text-muted)]">للدعم الفني فقط؛ إدارة الدورات اليومية من لوحة المدرب.</p>
      <form key={formKey} action={formAction} className="grid gap-3">
        <label className="grid gap-2 text-sm">
          <span className="font-medium">الدورة</span>
          <select name="courseId" required className="max-w-xl">
            <option value="">اختر الدورة</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium">المتدرب</span>
          <select name="userId" required className="max-w-xl">
            <option value="">اختر المتدرب</option>
            {learners.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={pending} className="nk-btn nk-btn-primary w-fit disabled:opacity-50">
          {pending ? "جارٍ الإضافة..." : "إضافة باعتماد فوري"}
        </button>
      </form>
    </Card>
  );
}
