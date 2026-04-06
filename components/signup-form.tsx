"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { SignupState } from "@/app/signup/actions";
import { signupAction } from "@/app/signup/actions";
import { Card } from "@/components/ui";

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signupAction, null as SignupState);

  if (state && "verifyEmail" in state && state.verifyEmail) {
    return (
      <Card elevated className="p-4 text-sm text-emerald-800">
        تم إنشاء طلب التسجيل بنجاح. تحقق من بريدك الإلكتروني واتبع رابط التأكيد إن وُجد، ثم سجّل الدخول. بعد اعتماد الحساب ستُتاح لك الدورات.
      </Card>
    );
  }

  return (
    <Card elevated>
      <form action={formAction} className="grid gap-4">
        <label className="grid gap-2 text-sm">
          <span className="font-medium">الاسم الكامل</span>
          <input name="name" type="text" autoComplete="name" required />
        </label>
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
          <span className="font-medium">رقم الجوال</span>
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            dir="ltr"
            className="text-left"
            placeholder="+9665xxxxxxxx"
          />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium">كلمة المرور</span>
          <input name="password" type="password" autoComplete="new-password" required minLength={8} dir="ltr" />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium">تأكيد كلمة المرور</span>
          <input
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            dir="ltr"
          />
        </label>
        {state && "error" in state && (
          <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {state.error}
          </p>
        )}
        <button type="submit" disabled={pending} className="nk-btn nk-btn-primary w-fit disabled:opacity-50">
          {pending ? "جارٍ إنشاء الحساب..." : "إنشاء حساب"}
        </button>
        <Link href="/login" className="text-sm text-[var(--primary-strong)] hover:underline">
          لديك حساب؟ تسجيل الدخول
        </Link>
      </form>
    </Card>
  );
}
