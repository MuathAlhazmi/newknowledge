"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type UpdatePasswordState = { error: string } | null;

export async function updatePasswordAction(
  _prev: UpdatePasswordState,
  formData: FormData,
): Promise<UpdatePasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 8) {
    return { error: "كلمة المرور يجب أن لا تقل عن 8 أحرف." };
  }
  if (password !== confirm) {
    return { error: "تأكيد كلمة المرور غير متطابق." };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { error: "تعذر تحديث كلمة المرور. حاول مرة أخرى." };
  }

  redirect("/login?password=updated");
}
