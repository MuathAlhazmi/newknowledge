import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { canEditCourse, requireCourseAccess, requireCourseEditor } from "@/lib/course-staff";
import { db } from "@/lib/db";
import { recomputeCourseGrade } from "@/lib/guards";
import { arCopy } from "@/lib/copy/ar";
import { FinalScoreBar, GradingCriteriaReadOnly, ScoreRow } from "@/components/grade-display";
import { Card, EmptyState, PageHeader, StatusBadge, WarningCard } from "@/components/ui";
import type { CourseGrade } from "@prisma/client";

const ag = arCopy.adminGrades;

async function recalcAction(formData: FormData) {
  "use server";
  const courseId = String(formData.get("courseId"));
  const userId = String(formData.get("userId"));
  await requireCourseEditor(courseId);
  await recomputeCourseGrade(userId, courseId);
  revalidatePath(`/admin/courses/${courseId}/grades`);
}

async function updateFinalGradeAction(formData: FormData) {
  "use server";
  const courseId = String(formData.get("courseId"));
  await requireCourseEditor(courseId);
  const userId = String(formData.get("userId"));
  const finalScore = Number(formData.get("finalScore"));
  const config = await db.gradingConfig.findUnique({ where: { courseId } });
  if (!config) return;
  await db.courseGrade.upsert({
    where: { courseId_userId: { courseId, userId } },
    create: {
      courseId,
      userId,
      finalScore,
      isPassed: finalScore >= config.passThreshold,
      updatedByAdmin: true,
    },
    update: {
      finalScore,
      isPassed: finalScore >= config.passThreshold,
      updatedByAdmin: true,
    },
  });
  revalidatePath(`/admin/courses/${courseId}/grades`);
}

function PassOutcomeBadge({ grade }: { grade: CourseGrade | undefined }) {
  if (!grade || grade.finalScore == null || grade.isPassed === null) {
    return <StatusBadge text="غير محسوبة بعد" tone="muted" />;
  }
  if (grade.isPassed) {
    return <StatusBadge text="ناجح" tone="success" />;
  }
  return <StatusBadge text="لم يجتز" tone="warning" />;
}

export default async function AdminGradesPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const { membership } = await requireCourseAccess(courseId);
  const canEdit = canEditCourse(membership.role);

  const [course, gradingConfig, rows, gradeRows] = await Promise.all([
    db.course.findUnique({ where: { id: courseId }, select: { title: true } }),
    db.gradingConfig.findUnique({ where: { courseId } }),
    db.enrollment.findMany({
      where: { courseId, status: "APPROVED" },
      include: { user: true },
      orderBy: { user: { name: "asc" } },
    }),
    db.courseGrade.findMany({ where: { courseId } }),
  ]);

  if (!course) notFound();

  const gradeByUser = new Map(gradeRows.map((g) => [g.userId, g]));

  return (
    <div className="page-wrap gap-6">
      <PageHeader
        eyebrow={arCopy.glossary.gradesSection}
        title={ag.title}
        subtitle={`${ag.subtitle} (${course.title})`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href={`/admin/courses/${courseId}`} className="nk-btn nk-btn-secondary text-sm">
              {ag.linkCourseHub}
            </Link>
            <Link href={`/admin/courses/${courseId}/exams`} className="nk-btn nk-btn-secondary text-sm">
              {ag.linkExams}
            </Link>
          </div>
        }
      />

      {!gradingConfig ? (
        <WarningCard>
          <p className="text-sm leading-relaxed">{ag.noConfigWarning}</p>
          <Link href={`/admin/courses/${courseId}/exams`} className="nk-btn nk-btn-primary mt-3 inline-flex text-sm">
            {ag.linkExams}
          </Link>
        </WarningCard>
      ) : (
        <Card elevated variant="highlight" interactive={false} className="p-5 md:p-6">
          <h2 className="mb-1 text-base font-bold text-[var(--primary-strong)]">{ag.criteriaSummaryTitle}</h2>
          <p className="mb-4 text-xs text-[var(--text-muted)]">{ag.criteriaSummaryHint}</p>
          <GradingCriteriaReadOnly config={gradingConfig} showHeading={false} />
        </Card>
      )}

      <section className="nk-section !my-0">
        <h2 className="nk-section-title">{ag.approvedSection}</h2>
        {rows.length === 0 ? (
          <EmptyState title={ag.emptyLearners} text={ag.emptyLearnersHint} />
        ) : (
          <ul className="nk-stagger-list grid gap-4">
            {rows.map((row) => {
              const grade = gradeByUser.get(row.userId);
              const threshold = gradingConfig?.passThreshold ?? 0;
              const showBar = Boolean(gradingConfig && grade?.finalScore != null);

              return (
                <li key={row.userId}>
                  <Card elevated className="overflow-hidden p-0">
                    <div className="flex flex-col gap-4 p-4 md:flex-row md:items-start md:justify-between md:gap-6 md:p-5">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                          <div>
                            <p className="font-semibold text-[var(--foreground)]">{row.user.name}</p>
                            <p className="text-sm text-[var(--text-muted)]" dir="ltr">
                              {row.user.email}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-wrap items-center gap-2">
                            <PassOutcomeBadge grade={grade} />
                            <StatusBadge
                              text={grade?.updatedByAdmin ? ag.manualFromAdmin : ag.computedAuto}
                              tone={grade?.updatedByAdmin ? "info" : "muted"}
                            />
                          </div>
                        </div>

                        <div className="mt-4 grid gap-4 lg:grid-cols-2">
                          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 px-3 py-2">
                            <ScoreRow label="درجة القبلي" value={grade?.preScore} />
                            <ScoreRow label="درجة البعدي" value={grade?.postScore} />
                            <ScoreRow label="النهائي" value={grade?.finalScore} />
                          </div>
                          {showBar && gradingConfig ? (
                            <div className="flex flex-col justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/40 px-4 py-3">
                              <p className="mb-2 text-xs font-medium text-[var(--text-muted)]">مقارنة بحد الاجتياز</p>
                              <FinalScoreBar final={grade!.finalScore} passThreshold={threshold} compact />
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    {canEdit ? (
                      <div className="flex flex-col gap-3 border-t border-[var(--border)] bg-[var(--surface-muted)]/30 px-4 py-3 md:flex-row md:flex-wrap md:items-end md:gap-3 md:px-5">
                        <form action={recalcAction}>
                          <input type="hidden" name="courseId" value={courseId} />
                          <input type="hidden" name="userId" value={row.userId} />
                          <button type="submit" className="nk-btn nk-btn-secondary text-sm">
                            {ag.recalc}
                          </button>
                        </form>
                        <form action={updateFinalGradeAction} className="flex flex-wrap items-end gap-2">
                          <input type="hidden" name="courseId" value={courseId} />
                          <input type="hidden" name="userId" value={row.userId} />
                          <label className="grid gap-1 text-sm">
                            <span className="text-[var(--text-muted)]">{ag.finalScoreField}</span>
                            <input
                              name="finalScore"
                              type="number"
                              min={0}
                              max={100}
                              step="0.1"
                              defaultValue={grade?.finalScore ?? 0}
                              className="!w-28"
                            />
                          </label>
                          <button type="submit" className="nk-btn nk-btn-primary text-sm">
                            {ag.saveEdit}
                          </button>
                        </form>
                      </div>
                    ) : null}
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
