"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { ForgotPasswordState } from "@/app/forgot-password/actions";
import { forgotPasswordAction } from "@/app/forgot-password/actions";
import { Card } from "@/components/ui";
import { arCopy } from "@/lib/copy/ar";
import { snackbarError, snackbarSuccess } from "@/lib/snackbar";
import { useOnSerialChange } from "@/lib/use-on-serial-change";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, null as ForgotPasswordState);

  useOnSerialChange(JSON.stringify(state ?? null), () => {
    if (!state) return;
    if ("ok" in state && state.ok) snackbarSuccess(arCopy.snackbar.forgotPasswordSent);
    if ("error" in state) snackbarError(state.error);
  });

  if (state && "ok" in state && state.ok) {
    return (
      <Card elevated className="p-4 text-sm text-[var(--foreground)]">
        <p className="mb-3">يُرجى مراجعة البريد الإلكتروني للحصول على رابط الاستعادة إن وُجد حساب مرتبط.</p>
        <Link href="/login" className="text-sm font-medium text-[var(--primary-strong)] hover:underline">
          العودة إلى تسجيل الدخول
        </Link>
      </Card>
    );
  }

  return (
    <Card elevated>
      <form action={formAction} className="grid gap-4">
        <label className="grid gap-2 text-sm">
          <span className="font-medium">البريد الإلكتروني</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            dir="ltr"
            className="text-left"
            placeholder="you@example.com"
          />
        </label>
        <button type="submit" disabled={pending} className="nk-btn nk-btn-primary w-fit disabled:opacity-50">
          {pending ? "جارٍ الإرسال..." : "إرسال رابط الاستعادة"}
        </button>
      </form>
    </Card>
  );
}
