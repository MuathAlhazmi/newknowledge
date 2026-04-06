import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, resolvePostLoginPath } from "@/lib/auth";
import { Card, PageHeader } from "@/components/ui";
import { SignupForm } from "@/components/signup-form";

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect(await resolvePostLoginPath(user));

  const supabaseConfigured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    (Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY) ||
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY));

  return (
    <div className="mx-auto grid w-full max-w-xl gap-6">
      <PageHeader
        eyebrow="البداية"
        title="إنشاء حساب"
        subtitle="أدخل بياناتك للتسجيل كمتدرب. سيتم اعتماد الحساب قبل إتاحة الدورات."
      />
      {supabaseConfigured ? (
        <SignupForm />
      ) : (
        <Card elevated className="p-4 text-sm text-[var(--text-muted)]">
          لم يُضبط Supabase بعد. راجع ملف <code className="rounded bg-zinc-100 px-1">.env.example</code>.
        </Card>
      )}
      <Link href="/login" className="text-sm text-[var(--primary-strong)] hover:underline">
        العودة إلى تسجيل الدخول
      </Link>
    </div>
  );
}
