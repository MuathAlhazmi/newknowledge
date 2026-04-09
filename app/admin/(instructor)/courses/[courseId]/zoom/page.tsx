import { revalidatePath } from "next/cache";
import { canEditCourse, requireCourseAccess, requireCourseEditor } from "@/lib/course-staff";
import { db } from "@/lib/db";
import { Card, EmptyState, PageHeader } from "@/components/ui";

async function createZoomSessionAction(formData: FormData) {
  "use server";
  const courseId = String(formData.get("courseId"));
  await requireCourseEditor(courseId);
  const title = String(formData.get("title") ?? "").trim();
  const meetingUrl = String(formData.get("meetingUrl") ?? "").trim();
  const startsAt = String(formData.get("startsAt") ?? "");
  if (!title || !meetingUrl || !startsAt) return;

  await db.zoomSession.create({
    data: { courseId, title, meetingUrl, startsAt: new Date(startsAt) },
  });
  revalidatePath(`/admin/courses/${courseId}/zoom`);
}

export default async function AdminZoomPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const { membership } = await requireCourseAccess(courseId);
  const canEdit = canEditCourse(membership.role);
  const sessions = await db.zoomSession.findMany({
    where: { courseId },
    orderBy: { startsAt: "asc" },
  });

  return (
    <div className="page-wrap gap-5">
      <PageHeader title="إدارة الجلسات المباشرة" subtitle="أضف الجلسات مع الموعد ورابط الانضمام." />
      {canEdit ? (
        <Card elevated>
          <form action={createZoomSessionAction} className="grid gap-2">
            <input type="hidden" name="courseId" value={courseId} />
            <input name="title" required placeholder="عنوان الجلسة" />
            <input name="meetingUrl" required placeholder="رابط Zoom" />
            <input name="startsAt" type="datetime-local" required />
            <button type="submit" className="nk-btn nk-btn-primary w-fit">
              إضافة جلسة جديدة
            </button>
          </form>
        </Card>
      ) : (
        <p className="text-sm text-[var(--text-muted)]">صلاحية عرض فقط — لا يمكن إضافة جلسات.</p>
      )}
      {sessions.length === 0 ? (
        <EmptyState text="لا توجد جلسات مجدولة حاليًا." />
      ) : (
        sessions.map((s) => (
          <Card key={s.id}>
            <p className="font-medium">{s.title}</p>
            <p className="text-sm text-[var(--text-muted)]">{new Date(s.startsAt).toLocaleString("ar-SA")}</p>
            <p className="text-xs text-[var(--text-muted)]">{s.meetingUrl}</p>
          </Card>
        ))
      )}
    </div>
  );
}
