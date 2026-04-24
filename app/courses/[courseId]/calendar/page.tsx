import Link from "next/link";
import { notFound } from "next/navigation";
import { requireParticipant } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireApprovedEnrollment } from "@/lib/guards";
import { TeamsBrowserReminders } from "@/components/teams-browser-reminders";
import { Card, PageHeader } from "@/components/ui";

function sameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default async function CourseCalendarPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const user = await requireParticipant();
  const { courseId } = await params;
  const approved = await requireApprovedEnrollment(user.id, courseId);
  if (!approved) notFound();

  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { title: true },
  });
  if (!course) notFound();

  const sessions = await db.teamsSession.findMany({
    where: { courseId },
    orderBy: { startsAt: "asc" },
  });

  const icsHref = `/api/courses/${courseId}/calendar.ics`;
  const reminderPayload = sessions.map((s) => ({
    id: s.id,
    title: s.title,
    startsAt: s.startsAt.toISOString(),
  }));

  const groups: { day: Date; label: string; items: typeof sessions }[] = [];
  for (const s of sessions) {
    const d = new Date(s.startsAt);
    const last = groups[groups.length - 1];
    if (!last || !sameCalendarDay(last.day, d)) {
      groups.push({
        day: d,
        label: d.toLocaleDateString("ar-SA", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        items: [s],
      });
    } else {
      last.items.push(s);
    }
  }

  return (
    <div className="page-wrap gap-6">
      <PageHeader
        eyebrow="الجدول"
        title="تقويم الجلسات"
        subtitle={course.title}
        actions={
          <div className="flex flex-wrap gap-2">
            <a href={icsHref} className="nk-btn nk-btn-secondary text-sm">
              تنزيل / اشتراك ICS
            </a>
            <Link href={`/courses/${courseId}`} className="nk-btn nk-btn-secondary text-sm">
              مركز الدورة
            </Link>
          </div>
        }
      />

      <Card elevated className="p-4 md:p-5">
        <p className="text-sm text-[var(--text-muted)]">
          يمكنك إضافة الملف إلى تطبيق التقويم (Google Calendar، Apple Calendar، إلخ) للتحديث عند تغيّر الجلسات.
        </p>
        <div className="mt-4">
          <TeamsBrowserReminders sessions={reminderPayload} />
        </div>
      </Card>

      {groups.length === 0 ? (
        <Card className="p-5 text-sm text-[var(--text-muted)]">لا توجد جلسات Teams مسجّلة لهذه الدورة بعد.</Card>
      ) : (
        <div className="grid gap-6">
          {groups.map((g) => (
            <section key={g.label} className="nk-section !my-0">
              <h2 className="nk-section-title text-base">{g.label}</h2>
              <ul className="grid gap-3">
                {g.items.map((s) => (
                  <li key={s.id}>
                    <Card elevated className="p-4">
                      <p className="font-semibold">{s.title}</p>
                      <p className="mt-1 text-sm text-[var(--text-muted)]">
                        {new Date(s.startsAt).toLocaleString("ar-SA", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <a
                        href={s.meetingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex text-sm font-medium text-[var(--primary-strong)] underline-offset-2 hover:underline"
                      >
                        رابط الاجتماع
                      </a>
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
