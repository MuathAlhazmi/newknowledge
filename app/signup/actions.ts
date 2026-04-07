"use server";

import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { resolvePostLoginPath } from "@/lib/auth";
import { arCopy } from "@/lib/copy/ar";
import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SignupState = { error: string } | { verifyEmail: true } | null;

function normalizePhone(raw: string) {
  return raw.trim().replace(/\s+/g, "");
}

export async function signupAction(_prev: SignupState, formData: FormData): Promise<SignupState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!name) {
    return { error: "يرجى إدخال الاسم الكامل." };
  }
  if (!email) {
    return { error: "يرجى إدخال البريد الإلكتروني." };
  }
  if (phone.length < 8 || !/^[\d+][\d\s\-+()]*$/.test(phone)) {
    return { error: "يرجى إدخال رقم جوال صالح (8 أحرف على الأقل)." };
  }
  if (password.length < 8) {
    return { error: "كلمة المرور يجب أن لا تقل عن 8 أحرف." };
  }
  if (password !== confirm) {
    return { error: "تأكيد كلمة المرور غير متطابق." };
  }

  const byEmail = await db.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });
  if (byEmail) {
    return { error: "هذا البريد مسجّل مسبقًا." };
  }
  const byPhone = await db.user.findFirst({ where: { phone } });
  if (byPhone) {
    return { error: "رقم الجوال مسجّل مسبقًا." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: signData, error: signError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        phone,
        full_name: name,
      },
    },
  });

  if (signError) {
    if (signError.message.toLowerCase().includes("already") || signError.message.includes("registered")) {
      return { error: "هذا البريد مستخدم في نظام الدخول. جرّب تسجيل الدخول أو استعادة كلمة المرور." };
    }
    return { error: "تعذر إنشاء الحساب. حاول لاحقًا أو تواصل مع الدعم." };
  }

  try {
    const dbUser = await db.user.create({
      data: {
        name,
        email,
        phone,
        role: UserRole.PARTICIPANT,
        platformApproved: false,
      },
    });

    if (signData.session) {
      redirect(await resolvePostLoginPath(dbUser));
    }

    return { verifyEmail: true };
  } catch {
    return { error: arCopy.snackbar.signupCompleteFailed };
  }
}
