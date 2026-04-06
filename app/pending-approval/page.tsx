import Link from "next/link";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { requireUser, resolvePostLoginPath } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Card, PageHeader } from "@/components/ui";

async function logoutAction() {
  "use server";
  const hasKey =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY) ||
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && hasKey) {
    try {
      const supabase = await createSupabaseServerClient();
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
  }
}

export default async function PendingApprovalPage() {
  const user = await requireUser();
  if (user.role !== UserRole.PARTICIPANT || user.platformApproved) {
    redirect(await resolvePostLoginPath(user));
  }

  return (
    <div className="mx-auto grid w-full max-w-xl gap-5">
      <PageHeader
        title="في انتظار اعتماد الحساب"
        subtitle="تم تسجيل الدخول بنجاح. لا يزال حسابك قيد اعتماد الإدارة قبل إتاحة الدورات والمحتوى."
      />
      <Card elevated className="grid gap-4 p-5">
        <p className="text-sm text-[var(--text-muted)]">
          عند اعتماد الحساب ستتمكن من الدخول إلى «دوراتي» والمتابعة. يمكنك تحديث الصفحة لاحقًا أو تسجيل الخروج والعودة في وقت لاحق.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/" className="nk-btn nk-btn-secondary w-fit">
            الصفحة الرئيسية
          </Link>
          <form action={logoutAction}>
            <button type="submit" className="nk-btn nk-btn-primary">
              تسجيل الخروج
            </button>
          </form>
        </div>
      </Card>
    </div>
  );
}
