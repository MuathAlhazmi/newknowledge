import { db } from "@/lib/db";
import { requireCourseLearnerView } from "@/lib/course-preview";
import { Card, EmptyState, PageHeader } from "@/components/ui";

export default async function TeamsSessionsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  await requireCourseLearnerView(courseId);

  const sessions = await db.teamsSession.findMany({
    where: { courseId },
    orderBy: { startsAt: "asc" },
  });

  return (
    <div className="page-wrap gap-5">
      <PageHeader title="جلسات Teams" subtitle="مواعيد الجلسات وروابط الانضمام إلى Microsoft Teams." />
      {sessions.length === 0 ? (
        <EmptyState text="لا توجد جلسات مجدولة حاليًا." />
      ) : (
        sessions.map((session) => (
          <Card key={session.id} elevated className="border border-[var(--border)] p-4 sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <p className="font-semibold text-[var(--foreground)]">{session.title}</p>
              <span className="nk-badge nk-badge-info w-fit">Microsoft Teams</span>
            </div>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              الموعد: {new Date(session.startsAt).toLocaleString("ar-SA")}
            </p>
            <a
              href={session.meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="nk-btn nk-btn-primary mt-4 w-fit"
            >
              دخول الجلسة
            </a>
          </Card>
        ))
      )}
    </div>
  );
}
