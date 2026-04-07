"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { LoginState } from "@/app/login/actions";
import { loginAction } from "@/app/login/actions";
import { Card } from "@/components/ui";
import { snackbarError } from "@/lib/snackbar";
import { useOnSerialChange } from "@/lib/use-on-serial-change";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, null as LoginState);

  useOnSerialChange(JSON.stringify(state ?? null), () => {
    if (state?.error) snackbarError(state.error);
  });

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
        <label className="grid gap-2 text-sm">
          <span className="font-medium">كلمة المرور</span>
          <input name="password" type="password" autoComplete="current-password" required dir="ltr" />
        </label>
        <button type="submit" disabled={pending} className="nk-btn nk-btn-primary w-fit disabled:opacity-50">
          {pending ? "جارٍ الدخول..." : "تسجيل الدخول"}
        </button>
        <div className="flex flex-col gap-2">
          <Link href="/forgot-password" className="text-sm text-[var(--primary-strong)] hover:underline">
            نسيت كلمة المرور؟
          </Link>
          <Link href="/signup" className="text-sm text-[var(--primary-strong)] hover:underline">
            إنشاء حساب جديد
          </Link>
        </div>
      </form>
    </Card>
  );
}
