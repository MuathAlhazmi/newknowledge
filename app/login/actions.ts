"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolvePostLoginPath } from "@/lib/auth";

export type LoginState = { error: string } | null;

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    return { error: "يرجى إدخال البريد الإلكتروني وكلمة المرور." };
  }

  const supabase = await createSupabaseServerClient();
  const { error: signError } = await supabase.auth.signInWithPassword({ email, password });
  if (signError) {
    return { error: "بيانات الدخول غير صحيحة." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    await supabase.auth.signOut();
    return { error: "تعذر إكمال تسجيل الدخول." };
  }

  const dbUser = await db.user.findFirst({
    where: { email: { equals: user.email, mode: "insensitive" } },
  });
  if (!dbUser) {
    await supabase.auth.signOut();
    return {
      error: "لا يوجد حساب في المنصة مرتبط بهذا البريد. تواصل مع المدير لإضافتك.",
    };
  }

  redirect(await resolvePostLoginPath(dbUser));
}
