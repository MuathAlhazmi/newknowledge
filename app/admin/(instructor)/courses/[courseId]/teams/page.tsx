import Link from "next/link";
import { revalidatePath } from "next/cache";
import { canEditCourse, requireCourseAccess, requireCourseEditor } from "@/lib/course-staff";
import { db } from "@/lib/db";
import { PendingFieldset, PendingSubmitButton } from "@/components/form-pending";
import { Card, EmptyState, PageHeader } from "@/components/ui";

async function createTeamsSessionAction(formData: FormData) {
  "use server";
  const courseId = String(formData.get("courseId"));
  await requireCourseEditor(courseId);
  const title = String(formData.get("title") ?? "").trim();
  const meetingUrl = String(formData.get("meetingUrl") ?? "").trim();
  const startsAt = String(formData.get("startsAt") ?? "");
  if (!title || !meetingUrl || !startsAt) return;

  await db.teamsSession.create({
    data: { courseId, title, meetingUrl, startsAt: new Date(startsAt) },
  });
  revalidateTeamsSessionPaths(courseId);
}

async function deleteTeamsSessionAction(formData: FormData) {
  "use server";
  const courseId = String(formData.get("courseId") ?? "").trim();
  await requireCourseEditor(courseId);
  const sessionId = String(formData.get("sessionId") ?? "").trim();
  if (!sessionId) return;

  const row = await db.teamsSession.findFirst({
    where: { id: sessionId, courseId },
    select: { id: true },
  });
  if (!row) return;

  await db.teamsSession.delete({ where: { id: sessionId } });
  revalidateTeamsSessionPaths(courseId);
}

function revalidateTeamsSessionPaths(courseId: string) {
  revalidatePath(`/admin/courses/${courseId}/teams`);
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath(`/courses/${courseId}/teams`);
  revalidatePath(`/courses/${courseId}/calendar`);
  revalidatePath(`/courses/${courseId}`);
}

export default async function AdminTeamsSessionsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const { membership } = await requireCourseAccess(courseId);
  const canEdit = canEditCourse(membership.role);
  const sessions = await db.teamsSession.findMany({
    where: { courseId },
    orderBy: { startsAt: "asc" },
  });

  return (
    <div className="page-wrap gap-5">
      <PageHeader title="إدارة جلسات Teams" subtitle="أضف الجلسات مع الموعد ورابط الاجتماع في Microsoft Teams." />
      {canEdit ? (
        <Card elevated>
          <form action={createTeamsSessionAction} className="grid gap-2">
            <PendingFieldset className="grid gap-2">
              <input type="hidden" name="courseId" value={courseId} />
              <input name="title" required placeholder="عنوان الجلسة" />
              <input name="meetingUrl" required placeholder="رابط Teams" />
              <input name="startsAt" type="datetime-local" required />
              <PendingSubmitButton
                idleText="إضافة جلسة جديدة"
                pendingText="جارٍ الإضافة..."
                className="nk-btn nk-btn-primary w-fit"
              />
            </PendingFieldset>
          </form>
        </Card>
      ) : (
        <p className="text-sm text-[var(--text-muted)]">صلاحية عرض فقط — لا يمكن إضافة جلسات.</p>
      )}
      {sessions.length === 0 ? (
        <EmptyState text="لا توجد جلسات مجدولة حاليًا." />
      ) : (
        sessions.map((s) => (
          <Card key={s.id} elevated className="flex flex-col gap-4 border border-[var(--border)] p-4 sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="font-semibold text-[var(--foreground)]">{s.title}</p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">الموعد: {new Date(s.startsAt).toLocaleString("ar-SA")}</p>
              </div>
              <span className="nk-badge nk-badge-info w-fit">Microsoft Teams</span>
            </div>

            {canEdit ? (
              <div className="flex flex-wrap gap-2">
                <a
                  href={s.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nk-btn nk-btn-primary text-xs"
                >
                  فتح الاجتماع
                </a>
                <Link
                  href={`/admin/courses/${courseId}/teams/${s.id}/attendance`}
                  className="nk-btn nk-btn-secondary text-xs"
                >
                  الحضور
                </Link>
                <form action={deleteTeamsSessionAction}>
                  <input type="hidden" name="courseId" value={courseId} />
                  <input type="hidden" name="sessionId" value={s.id} />
                  <PendingSubmitButton
                    idleText="حذف"
                    pendingText="جارٍ الحذف..."
                    className="nk-btn nk-btn-secondary text-xs text-rose-700"
                  />
                </form>
              </div>
            ) : null}
          </Card>
        ))
      )}
    </div>
  );
}
