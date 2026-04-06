"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { LoginState } from "@/app/login/actions";
import { loginAction } from "@/app/login/actions";
import { Card } from "@/components/ui";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, null as LoginState);

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
        {state?.error && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {state.error}
          </p>
        )}
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
