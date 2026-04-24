import Link from "next/link";
import { AnnouncementKind } from "@prisma/client";
import { canEditCourse, requireCourseAccess } from "@/lib/course-staff";
import { db } from "@/lib/db";
import {
  createAnnouncementAction,
  deleteAnnouncementAction,
  togglePublishAnnouncementAction,
  updateAnnouncementAction,
} from "@/app/admin/(instructor)/courses/[courseId]/announcements/actions";
import { Card, EmptyState, PageHeader, WarningCard } from "@/components/ui";

const kindLabel: Record<AnnouncementKind, string> = {
  [AnnouncementKind.MANUAL]: "إعلان",
  [AnnouncementKind.CONTENT]: "محتوى",
  [AnnouncementKind.QUIZ]: "اختبار",
  [AnnouncementKind.TEAMS]: "Teams",
};

export default async function AdminCourseAnnouncementsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const { membership } = await requireCourseAccess(courseId);
  const canEdit = canEditCourse(membership.role);

  const rows = await db.announcement.findMany({
    where: { courseId },
    include: { createdBy: { select: { name: true } } },
    orderBy: [{ createdAt: "desc" }],
  });

  return (
    <div className="page-wrap gap-6">
      <PageHeader
        eyebrow="المدرب"
        title="إعلانات الدورة"
        subtitle="أنشئ ونشّر تنبيهات تظهر للمتدربين داخل صندوق الإعلانات."
        actions={
          <Link href={`/admin/courses/${courseId}`} className="nk-btn nk-btn-secondary text-sm">
            مركز الدورة
          </Link>
        }
      />

      {!canEdit ? (
        <WarningCard>صلاحية العرض فقط — لا يمكنك إنشاء أو تعديل أو حذف الإعلانات.</WarningCard>
      ) : (
        <Card elevated interactive={false} className="grid gap-4 p-5">
          <h2 className="text-base font-semibold">إضافة إعلان جديد</h2>
          <form action={createAnnouncementAction} className="grid gap-3">
            <input type="hidden" name="courseId" value={courseId} />
            <label className="grid gap-1 text-sm">
              <span>العنوان</span>
              <input name="title" required maxLength={300} className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2" />
            </label>
            <label className="grid gap-1 text-sm">
              <span>التفاصيل (اختياري)</span>
              <textarea name="body" rows={3} className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2" />
            </label>
            <label className="grid gap-1 text-sm">
              <span>النوع</span>
              <select name="kind" className="max-w-sm rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2">
                <option value={AnnouncementKind.MANUAL}>إعلان عام</option>
                <option value={AnnouncementKind.CONTENT}>محتوى</option>
                <option value={AnnouncementKind.QUIZ}>اختبار</option>
                <option value={AnnouncementKind.TEAMS}>Teams</option>
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="publishNow" defaultChecked className="nk-check" />
              نشر الآن
            </label>
            <button type="submit" className="nk-btn nk-btn-primary w-fit text-sm">
              حفظ الإعلان
            </button>
          </form>
        </Card>
      )}

      <section className="nk-section !my-0">
        <h2 className="nk-section-title">الإعلانات الحالية</h2>
        {rows.length === 0 ? (
          <EmptyState text="لا توجد إعلانات بعد." />
        ) : (
          <ul className="nk-stagger-list grid gap-3">
            {rows.map((row) => (
              <li key={row.id}>
                <Card elevated interactive={false} className="grid gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="nk-badge nk-badge-info">{kindLabel[row.kind]}</span>
                    <span className="text-[var(--text-muted)]">
                      {row.publishedAt ? "منشور" : "مسودة"} • بواسطة {row.createdBy.name} • {row.createdAt.toLocaleString("ar-SA")}
                    </span>
                  </div>
                  {canEdit ? (
                    <form action={updateAnnouncementAction} className="grid gap-2">
                      <input type="hidden" name="courseId" value={courseId} />
                      <input type="hidden" name="announcementId" value={row.id} />
                      <input
                        name="title"
                        defaultValue={row.title}
                        required
                        maxLength={300}
                        className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2"
                      />
                      <textarea
                        name="body"
                        defaultValue={row.body ?? ""}
                        rows={3}
                        className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2"
                      />
                      <select
                        name="kind"
                        defaultValue={row.kind}
                        className="max-w-sm rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2"
                      >
                        <option value={AnnouncementKind.MANUAL}>إعلان عام</option>
                        <option value={AnnouncementKind.CONTENT}>محتوى</option>
                        <option value={AnnouncementKind.QUIZ}>اختبار</option>
                        <option value={AnnouncementKind.TEAMS}>Teams</option>
                      </select>
                      <div className="flex flex-wrap gap-2">
                        <button type="submit" className="nk-btn nk-btn-secondary text-xs">
                          تحديث
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <p className="font-semibold text-[var(--foreground)]">{row.title}</p>
                      {row.body ? <p className="text-sm text-[var(--text-muted)]">{row.body}</p> : null}
                    </>
                  )}
                  {canEdit ? (
                    <div className="flex flex-wrap gap-2">
                      <form action={togglePublishAnnouncementAction}>
                        <input type="hidden" name="courseId" value={courseId} />
                        <input type="hidden" name="announcementId" value={row.id} />
                        <button type="submit" className="nk-btn nk-btn-secondary text-xs">
                          {row.publishedAt ? "إلغاء النشر" : "نشر الآن"}
                        </button>
                      </form>
                      <form action={deleteAnnouncementAction}>
                        <input type="hidden" name="courseId" value={courseId} />
                        <input type="hidden" name="announcementId" value={row.id} />
                        <button type="submit" className="nk-btn nk-btn-secondary text-xs text-rose-700">
                          حذف
                        </button>
                      </form>
                    </div>
                  ) : null}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
