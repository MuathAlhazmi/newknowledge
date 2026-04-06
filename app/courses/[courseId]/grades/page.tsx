import Link from "next/link";
import { notFound } from "next/navigation";
import { requireParticipant } from "@/lib/auth";
import { db } from "@/lib/db";
import { recomputeCourseGrade, requireApprovedEnrollment } from "@/lib/guards";
import { FinalScoreBar, GradingCriteriaReadOnly, ScoreRow } from "@/components/grade-display";
import { Card, PageHeader, StatusBadge } from "@/components/ui";

export default async function GradesPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const user = await requireParticipant();
  const { courseId } = await params;
  const approved = await requireApprovedEnrollment(user.id, courseId);
  if (!approved) notFound();

  await recomputeCourseGrade(user.id, courseId);

  const [grade, config, course] = await Promise.all([
    db.courseGrade.findUnique({
      where: { courseId_userId: { courseId, userId: user.id } },
    }),
    db.gradingConfig.findUnique({ where: { courseId } }),
    db.course.findUnique({ where: { id: courseId }, select: { title: true } }),
  ]);

  if (!grade || !config || !course) notFound();

  const final = grade.finalScore;

  return (
    <div className="page-wrap gap-6">
      <PageHeader
        eyebrow="الدرجة العامة"
        title="النتيجة النهائية"
        subtitle={course.title}
        actions={
          <Link href={`/courses/${courseId}`} className="nk-btn nk-btn-secondary text-sm">
            مركز الدورة
          </Link>
        }
      />

      <Card elevated variant="highlight" interactive={false} className="p-6 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--text-muted)]">الدرجة المحسوبة</p>
            <p className="mt-1 flex flex-wrap items-baseline gap-1">
              <span className="text-4xl font-bold tabular-nums tracking-tight text-[var(--primary-strong)] md:text-5xl">
                {final != null ? final.toFixed(1) : "-"}
              </span>
              {final != null ? (
                <span className="text-lg font-semibold text-[var(--text-muted)]">/ 100</span>
              ) : (
                <span className="text-sm text-[var(--text-muted)]">بعد إكمال الاختبارات المعتمدة</span>
              )}
            </p>
          </div>
          <div className="shrink-0">
            {grade.isPassed === null ? (
              <StatusBadge text="غير محسوبة بعد" tone="muted" />
            ) : grade.isPassed ? (
              <StatusBadge text="ناجح" tone="success" />
            ) : (
              <StatusBadge text="لم يجتز" tone="warning" />
            )}
          </div>
        </div>

        <FinalScoreBar final={final} passThreshold={config.passThreshold} />

        {grade.updatedByAdmin ? (
          <p className="mt-4 text-xs text-[var(--text-muted)]">تم اعتماد أو تعديل جزء من الدرجة من قبل الإدارة.</p>
        ) : null}
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card elevated className="p-5">
          <h2 className="mb-1 text-base font-bold text-[var(--primary-strong)]">مكونات الدرجة</h2>
          <p className="mb-4 text-xs text-[var(--text-muted)]">من آخر محاولة مُسلَّمة لكل اختبار.</p>
          <ScoreRow label="درجة القبلي" value={grade.preScore} />
          <ScoreRow label="درجة البعدي" value={grade.postScore} />
        </Card>

        <Card elevated className="p-5">
          <GradingCriteriaReadOnly config={config} />
        </Card>
      </div>
    </div>
  );
}
