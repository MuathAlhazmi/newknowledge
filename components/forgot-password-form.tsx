"use client";

import { useActionState } from "react";
import type { ForgotPasswordState } from "@/app/forgot-password/actions";
import { forgotPasswordAction } from "@/app/forgot-password/actions";
import { Card } from "@/components/ui";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, null as ForgotPasswordState);

  if (state && "ok" in state && state.ok) {
    return (
      <Card elevated className="p-4 text-sm text-emerald-800">
        إن وُجد حساب مرتبط بهذا البريد، ستصلك رسالة قريبًا. راجع صندوق الوارد أو البريد غير المرغوب.
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
        {state && "error" in state && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {state.error}
          </p>
        )}
        <button type="submit" disabled={pending} className="nk-btn nk-btn-primary w-fit disabled:opacity-50">
          {pending ? "جارٍ الإرسال..." : "إرسال رابط الاستعادة"}
        </button>
      </form>
    </Card>
  );
}
