import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser, resolvePostLoginPath } from "@/lib/auth";
import { Card, PageHeader } from "@/components/ui";

export default async function Home() {
  const user = await getCurrentUser();
  if (user) {
    redirect(await resolvePostLoginPath(user));
  }

  return (
    <div className="page-wrap gap-6">
      <PageHeader
        title="منصة العلم الجديد"
        subtitle="بيئة تدريب عربية متكاملة لإدارة المحتوى، الاختبارات، والتواصل الرسمي."
      />
      <Card elevated variant="highlight" interactive={false} className="max-w-3xl">
        <p className="mb-4 text-[var(--text-muted)]">
          صممنا المنصة لتجربة تدريب سلسة: محتوى مرئي داخل المنصة، اختبارات قبلية وبعدية، جلسات مباشرة،
          محادثات، وتغذية راجعة مع متابعة واضحة للدرجات.
        </p>
        <Link href="/login" className="nk-btn nk-btn-primary">
          تسجيل الدخول
        </Link>
      </Card>
    </div>
  );
}
