"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getRequestOrigin } from "@/lib/request-origin";

export type ForgotPasswordState = { error: string } | { ok: true } | null;

export async function forgotPasswordAction(
  _prev: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) {
    return { error: "يرجى إدخال البريد الإلكتروني." };
  }

  const origin = await getRequestOrigin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/update-password`,
  });

  if (error) {
    return { error: "تعذر إرسال رابط الاستعادة. تحقق من البريد أو حاول لاحقًا." };
  }

  return { ok: true };
}
