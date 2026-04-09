import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { arCopy } from "@/lib/copy/ar";
import { Card, EmptyState, PageHeader } from "@/components/ui";

export default async function AdminFeedbackPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;

  const [course, feedbacks] = await Promise.all([
    db.course.findUnique({ where: { id: courseId }, select: { title: true } }),
    db.feedback.findMany({
      where: { courseId },
      include: { user: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!course) notFound();

  return (
    <div className="page-wrap gap-6">
      <PageHeader
        title="ملاحظات المتدربين"
        subtitle={`آراء وملاحظات نصية حول الدورة (${course.title})`}
        actions={
          <Link href={`/admin/courses/${courseId}`} className="nk-btn nk-btn-secondary text-sm">
            {arCopy.adminFeedback.linkHub}
          </Link>
        }
      />
      {feedbacks.length === 0 ? (
        <EmptyState text="لا توجد تغذية راجعة حتى الآن." />
      ) : (
        <ul className="nk-stagger-list grid gap-4">
          {feedbacks.map((fb) => (
            <li key={fb.id}>
              <Card
                elevated
                interactive={false}
                className="border-s-4 border-s-[var(--primary)] ps-4 shadow-[var(--shadow-sm)]"
              >
                <div className="flex flex-col gap-1 border-b border-[var(--border-muted-edge)] pb-3">
                  <p className="text-sm font-semibold text-[var(--foreground)]">{fb.user.name}</p>
                  <p className="text-xs text-[var(--text-muted)]" dir="ltr">
                    {fb.user.email}
                  </p>
                  <time className="text-xs text-[var(--text-muted)]" dateTime={fb.createdAt.toISOString()}>
                    {new Date(fb.createdAt).toLocaleString("ar-SA")}
                  </time>
                </div>
                <blockquote className="mt-3 text-sm leading-relaxed text-[var(--foreground)]">
                  <p className="whitespace-pre-wrap">{fb.text}</p>
                </blockquote>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
