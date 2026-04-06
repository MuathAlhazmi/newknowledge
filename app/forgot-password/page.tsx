import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto grid w-full max-w-xl gap-5">
      <PageHeader
        title="استعادة كلمة المرور"
        subtitle="أدخل بريدك المسجّل في المنصة. ستصلك رسالة من Supabase برابط لإعادة التعيين."
      />
      <ForgotPasswordForm />
      <Link href="/login" className="text-sm text-[var(--primary-strong)] hover:underline">
        العودة إلى تسجيل الدخول
      </Link>
    </div>
  );
}
