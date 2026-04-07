import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SiteLogo } from "@/components/site-logo";
import { PageHeader } from "@/components/ui";
import { UpdatePasswordForm } from "@/components/update-password-form";

export default async function UpdatePasswordPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto grid w-full max-w-xl gap-5">
      <SiteLogo variant="auth" />
      <PageHeader title="تعيين كلمة مرور جديدة" subtitle="اختر كلمة مرور قوية ولا تشاركها مع أحد." />
      <UpdatePasswordForm />
      <Link href="/login" className="text-sm text-[var(--primary-strong)] hover:underline">
        العودة إلى تسجيل الدخول
      </Link>
    </div>
  );
}
