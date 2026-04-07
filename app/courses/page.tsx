import Link from "next/link";
import { EnrollmentStatus } from "@prisma/client";
import { requireParticipant } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui";

export default async function CoursesPage() {
  const user = await requireParticipant();
  const enrollments = await db.enrollment.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      status: true,
      courseId: true,
      course: {
        select: {
          title: true,
          description: true,
        },
      },
    },
  });

  return (
    <div className="page-wrap gap-5">
      <PageHeader title="دوراتي" subtitle="دوراتك وحالة التسجيل في مكان واحد." />
      {enrollments.length === 0 ? (
        <EmptyState title="لا دورات بعد" text="لم تُضف أي دورة إلى حسابك. تواصل مع الإدارة إن احتجت الوصول." />
      ) : (
        <div className="nk-stagger-list grid gap-3 md:grid-cols-2">
          {enrollments.map((enrollment) => (
            <Card key={enrollment.id} elevated>
              <h2 className="mb-1 text-lg font-semibold">{enrollment.course.title}</h2>
              <p className="text-sm text-[var(--text-muted)]">{enrollment.course.description}</p>
              <div className="mt-3">
                {enrollment.status === EnrollmentStatus.APPROVED ? (
                  <StatusBadge text="معتمد" tone="success" />
                ) : (
                  <StatusBadge text="قيد اعتماد التسجيل" tone="warning" />
                )}
              </div>
              <Link
                href={`/courses/${enrollment.courseId}`}
                className="nk-btn nk-btn-secondary mt-4"
              >
                انتقال إلى الدورة
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
