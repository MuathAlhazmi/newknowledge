import { redirect } from "next/navigation";
import { getCurrentUser, resolvePostLoginPath } from "@/lib/auth";
import { LoginPageFeedback } from "@/components/login-page-feedback";
import { Card, PageHeader } from "@/components/ui";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ password?: string; error?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect(await resolvePostLoginPath(user));

  const sp = await searchParams;
  const passwordUpdated = sp.password === "updated";
  const authError = sp.error === "auth";

  const supabaseConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    (Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY) ||
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY));

  return (
    <div className="mx-auto grid w-full max-w-xl gap-6">
      <PageHeader
        eyebrow="الوصول"
        title="تسجيل الدخول"
        subtitle="استخدم البريد الإلكتروني وكلمة المرور المعتمدين. يجب أن يكون بريدك مسجلًا في المنصة."
      />
      <LoginPageFeedback passwordUpdated={passwordUpdated} authError={authError} />
      {supabaseConfigured ? (
        <LoginForm />
      ) : (
        <Card elevated className="p-4 text-sm text-[var(--text-muted)]">
          لم يُضبط Supabase بعد. انسخ <code className="rounded bg-zinc-100 px-1">.env.example</code> إلى{" "}
          <code className="rounded bg-zinc-100 px-1">.env</code> وعبّئ عنوان المشروع والمفاتيح.
        </Card>
      )}
    </div>
  );
}
