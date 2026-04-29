import Link from "next/link";
import { notFound } from "next/navigation";
import { EnrollmentStatus } from "@prisma/client";
import { getCourseProgressSnapshot } from "@/lib/course-progress";
import { db } from "@/lib/db";
import { requireCourseLearnerView } from "@/lib/course-preview";
import { Card, PageHeader, WarningCard } from "@/components/ui";

export default async function CourseCompletionPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const { user, mode } = await requireCourseLearnerView(courseId);
  const isPreview = mode === "preview";

  const courseTitle = isPreview
    ? (await db.course.findUnique({ where: { id: courseId }, select: { title: true } }))?.title
    : null;

  if (isPreview) {
    if (!courseTitle) notFound();
    return (
      <div className="page-wrap gap-6">
        <PageHeader
          eyebrow="التقدّم والإكمال"
          title="سجل التقدّم في الدورة"
          subtitle={courseTitle}
          actions={
            <Link href={`/courses/${courseId}`} className="nk-btn nk-btn-secondary text-sm">
              مركز الدورة
            </Link>
          }
        />
        <WarningCard>
          هذه معاينة لصفحة التقدّم كما يراها المتدرب. لن يظهر هنا تقدّم فعلي لأن وضع العرض للقراءة فقط.
        </WarningCard>
      </div>
    );
  }

  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId } },
    include: { course: { select: { title: true } } },
  });
  if (!enrollment || enrollment.status !== EnrollmentStatus.APPROVED) notFound();

  const progress = await getCourseProgressSnapshot(user.id, courseId);

  return (
    <div className="page-wrap gap-6">
      <PageHeader
        eyebrow="التقدّم والإكمال"
        title="سجل التقدّم في الدورة"
        subtitle={enrollment.course.title}
        actions={
          <Link href={`/courses/${courseId}`} className="nk-btn nk-btn-secondary text-sm">
            مركز الدورة
          </Link>
        }
      />

      <Card elevated className="p-5">
        <p className="text-sm text-[var(--text-muted)]">نسبة الإكمال (مواد معروضة + اختبارات مُسلَّمة)</p>
        <p className="mt-2 text-3xl font-bold tabular-nums text-[var(--primary-strong)]">{progress.percent}%</p>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          {progress.total === 0
            ? "لا توجد عناصر بعد."
            : `${progress.completed} من ${progress.total} عنصرًا.`}
        </p>
        <div className="mt-4 h-2.5 w-full max-w-md overflow-hidden rounded-full bg-[var(--surface-muted)]">
          <div
            className="h-full rounded-full bg-[var(--primary)] transition-all duration-500"
            style={{ width: `${progress.percent}%` }}
          />
        </div>
      </Card>

      {progress.completion ? (
        <Card elevated className="border border-[var(--border)] bg-[var(--surface-muted)]/40 p-5">
          <h2 className="text-lg font-semibold">سجل إكمال الدورة</h2>
          <dl className="mt-3 grid gap-2 text-sm">
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="text-[var(--text-muted)]">رقم الشهادة / السجل</dt>
              <dd className="font-mono font-semibold" dir="ltr">
                {progress.completion.certificateNumber}
              </dd>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <dt className="text-[var(--text-muted)]">تاريخ التسجيل</dt>
              <dd>
                {progress.completion.completedAt.toLocaleString("ar-SA", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </dd>
            </div>
          </dl>
        </Card>
      ) : (
        <Card className="p-5">
          <p className="text-sm leading-relaxed text-[var(--text-muted)]">
            يُنشأ سجل الإكمال تلقائيًا عند استكمال جميع المواد (عرض كل ملف) وجميع الاختبارات النشطة (تسليم واحد على
            الأقل لكل اختبار).
          </p>
        </Card>
      )}
    </div>
  );
}
