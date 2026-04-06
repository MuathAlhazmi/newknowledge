import { notFound } from "next/navigation";
import { requireParticipant } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireApprovedEnrollment } from "@/lib/guards";
import { Card, EmptyState, PageHeader } from "@/components/ui";

export default async function ZoomPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const user = await requireParticipant();
  const { courseId } = await params;
  const approved = await requireApprovedEnrollment(user.id, courseId);
  if (!approved) notFound();

  const sessions = await db.zoomSession.findMany({
    where: { courseId },
    orderBy: { startsAt: "asc" },
  });

  return (
    <div className="page-wrap gap-5">
      <PageHeader title="الجلسات المباشرة" subtitle="مواعيد الجلسات وروابط الانضمام." />
      {sessions.length === 0 ? (
        <EmptyState text="لا توجد جلسات مجدولة حاليًا." />
      ) : (
        sessions.map((session) => (
          <Card key={session.id} elevated>
            <p className="font-semibold">{session.title}</p>
            <p className="text-sm text-[var(--text-muted)]">
              الموعد: {new Date(session.startsAt).toLocaleString("ar-SA")}
            </p>
            <a
              href={session.meetingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="nk-btn nk-btn-primary mt-3"
            >
              دخول الجلسة
            </a>
          </Card>
        ))
      )}
    </div>
  );
}
