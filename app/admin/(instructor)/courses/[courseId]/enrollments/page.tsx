import Link from "next/link";
import { notFound } from "next/navigation";
import { UserRole } from "@prisma/client";
import { canEditCourse, requireCourseAccess } from "@/lib/course-staff";
import { db } from "@/lib/db";
import { AddEnrollmentForm } from "@/components/add-enrollment-form";
import { arCopy } from "@/lib/copy/ar";
import { Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { approveEnrollmentAction } from "./actions";

export default async function AdminEnrollmentsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const { membership } = await requireCourseAccess(courseId);
  const canEdit = canEditCourse(membership.role);

  const [course, enrollments, candidates] = await Promise.all([
    db.course.findUnique({ where: { id: courseId }, select: { title: true } }),
    db.enrollment.findMany({
      where: { courseId },
      include: { user: true, course: true },
      orderBy: { createdAt: "desc" },
    }),
    db.user.findMany({
      where: {
        role: UserRole.PARTICIPANT,
        platformApproved: true,
        NOT: { enrollments: { some: { courseId } } },
      },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
  ]);

  if (!course) notFound();

  return (
    <div className="page-wrap gap-5">
      <PageHeader
        title={`التسجيلات (${course.title})`}
        subtitle="إضافة متدرب أو اعتماد الطلبات المعلّقة."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/courses" className="nk-btn nk-btn-secondary text-sm">
              الدورات
            </Link>
            <Link href={`/admin/courses/${courseId}`} className="nk-btn nk-btn-secondary text-sm">
              إدارة الدورة
            </Link>
          </div>
        }
      />
      {canEdit ? (
        <AddEnrollmentForm courseId={courseId} candidates={candidates} />
      ) : (
        <p className="text-sm text-[var(--text-muted)]">صلاحيتك في هذه الدورة عرض فقط؛ لا يمكن إضافة متدربين أو اعتماد الطلبات.</p>
      )}
      {enrollments.length === 0 ? (
        <EmptyState title={arCopy.adminEnrollments.emptyTitle} text={arCopy.adminEnrollments.emptyText} />
      ) : (
        <ul className="nk-stagger-list grid gap-3">
          {enrollments.map((enrollment) => (
            <li key={enrollment.id}>
              <Card elevated className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-[var(--foreground)]">{enrollment.user.name}</p>
                    <p className="text-sm text-[var(--text-muted)]" dir="ltr">
                      {enrollment.user.email}
                    </p>
                    <p className="text-sm text-[var(--text-muted)]" dir="ltr">
                      {enrollment.user.phone}
                    </p>
                  </div>
                  <StatusBadge
                    text={enrollment.status === "APPROVED" ? "تم الاعتماد" : "قيد المراجعة"}
                    tone={enrollment.status === "APPROVED" ? "success" : "warning"}
                  />
                </div>
                {canEdit && enrollment.status !== "APPROVED" && (
                  <form action={approveEnrollmentAction} className="mt-4 border-t border-[var(--border)] pt-4">
                    <input type="hidden" name="courseId" value={courseId} />
                    <input type="hidden" name="enrollmentId" value={enrollment.id} />
                    <button type="submit" className="nk-btn nk-btn-primary text-sm">
                      اعتماد الطلب
                    </button>
                  </form>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
