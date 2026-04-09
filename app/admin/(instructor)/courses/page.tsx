import Link from "next/link";
import { EnrollmentStatus } from "@prisma/client";
import { AdminCourseDashboardCard } from "@/components/admin-dashboard-ui";
import { requireInstructor } from "@/lib/auth";
import { db } from "@/lib/db";
import { EmptyState, PageHeader } from "@/components/ui";

export default async function InstructorCoursesIndexPage() {
  const user = await requireInstructor();
  const courses = await db.course.findMany({
    where: { courseInstructors: { some: { userId: user.id } } },
    orderBy: { title: "asc" },
    include: {
      _count: {
        select: {
          materials: true,
          exams: true,
        },
      },
    },
  });

  const courseIds = courses.map((c) => c.id);
  const [pendingByCourseRows, approvedByCourseRows] = courseIds.length
    ? await Promise.all([
        db.enrollment.groupBy({
          by: ["courseId"],
          where: { status: EnrollmentStatus.PENDING, courseId: { in: courseIds } },
          _count: { _all: true },
        }),
        db.enrollment.groupBy({
          by: ["courseId"],
          where: { status: EnrollmentStatus.APPROVED, courseId: { in: courseIds } },
          _count: { _all: true },
        }),
      ])
    : [[], []];

  const pendingByCourse = Object.fromEntries(
    pendingByCourseRows.map((r) => [r.courseId, r._count._all]),
  );
  const approvedByCourse = Object.fromEntries(
    approvedByCourseRows.map((r) => [r.courseId, r._count._all]),
  );

  return (
    <div className="page-wrap gap-6">
      <PageHeader
        eyebrow="المدرب"
        title="لوحة الدورات"
        subtitle="اختر دورة لإدارة المواد والاختبارات والتسجيلات والمحادثات."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/courses/new" className="nk-btn nk-btn-primary text-sm">
              إضافة دورة
            </Link>
            <Link href="/" className="nk-btn nk-btn-secondary text-sm">
              الرئيسية
            </Link>
          </div>
        }
      />

      <section className="nk-section !my-0">
        <h2 className="nk-section-title">الدورات</h2>
        {courses.length === 0 ? (
          <EmptyState
            title="لا توجد دورات"
            text="أنشئ دورة جديدة من هنا، أو يطلب منك المسؤول إضافتك لفريق تدريس دورة موجودة."
          />
        ) : (
          <div className="nk-stagger-list grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <AdminCourseDashboardCard
                key={course.id}
                courseId={course.id}
                title={course.title}
                description={course.description}
                counts={{
                  materials: course._count.materials,
                  exams: course._count.exams,
                  approvedEnrollments: approvedByCourse[course.id] ?? 0,
                }}
                pendingEnrollments={pendingByCourse[course.id] ?? 0}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
