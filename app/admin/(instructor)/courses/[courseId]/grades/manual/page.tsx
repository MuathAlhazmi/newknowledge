import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { EnrollmentStatus } from "@prisma/client";
import { requireCourseEditor } from "@/lib/course-staff";
import { db } from "@/lib/db";
import { PendingFieldset, PendingFormOverlay, PendingSubmitButton } from "@/components/form-pending";
import { recomputeCourseGrade } from "@/lib/guards";
import { Card, EmptyState, PageHeader } from "@/components/ui";

async function createManualAssessmentAction(formData: FormData) {
  "use server";
  const courseId = String(formData.get("courseId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const maxScore = Number(formData.get("maxScore"));
  if (!courseId || !title) return;
  if (!Number.isFinite(maxScore) || maxScore <= 0) return;

  const { user: staff } = await requireCourseEditor(courseId);
  await db.manualAssessment.create({
    data: {
      courseId,
      title,
      maxScore,
      createdById: staff.id,
    },
  });

  revalidatePath(`/admin/courses/${courseId}/grades/manual`);
  revalidatePath(`/admin/courses/${courseId}/grades`);
}

async function deleteManualAssessmentAction(formData: FormData) {
  "use server";
  const courseId = String(formData.get("courseId") ?? "").trim();
  const assessmentId = String(formData.get("assessmentId") ?? "").trim();
  if (!courseId || !assessmentId) return;

  await requireCourseEditor(courseId);

  const assessment = await db.manualAssessment.findFirst({
    where: { id: assessmentId, courseId },
    select: { id: true },
  });
  if (!assessment) return;

  await db.manualAssessment.delete({ where: { id: assessmentId } });

  revalidatePath(`/admin/courses/${courseId}/grades/manual`);
  revalidatePath(`/admin/courses/${courseId}/grades`);
}

async function upsertManualAssessmentScoresAction(formData: FormData) {
  "use server";
  const courseId = String(formData.get("courseId") ?? "").trim();
  const assessmentId = String(formData.get("assessmentId") ?? "").trim();
  if (!courseId || !assessmentId) return;

  const { user: staff } = await requireCourseEditor(courseId);

  const assessment = await db.manualAssessment.findFirst({
    where: { id: assessmentId, courseId },
    select: { id: true, maxScore: true },
  });
  if (!assessment) return;

  const approved = await db.enrollment.findMany({
    where: { courseId, status: EnrollmentStatus.APPROVED },
    select: { userId: true },
  });
  const approvedUserIds = new Set(approved.map((e) => e.userId));

  const impactedUserIds = new Set<string>();

  for (const [key, raw] of formData.entries()) {
    if (!key.startsWith("score_")) continue;
    const userId = key.slice("score_".length);
    if (!approvedUserIds.has(userId)) continue;
    impactedUserIds.add(userId);

    const rawStr = String(raw);
    if (rawStr.trim() === "") {
      await db.manualAssessmentScore.deleteMany({
        where: { assessmentId, userId },
      });
      continue;
    }

    const value = Number(rawStr);
    if (!Number.isFinite(value)) continue;
    const clamped = Math.max(0, Math.min(value, assessment.maxScore));

    await db.manualAssessmentScore.upsert({
      where: { assessmentId_userId: { assessmentId, userId } },
      update: { score: clamped, gradedById: staff.id, gradedAt: new Date() },
      create: { assessmentId, userId, score: clamped, gradedById: staff.id },
    });
  }

  await Promise.all([...impactedUserIds].map((userId) => recomputeCourseGrade(userId, courseId)));

  revalidatePath(`/admin/courses/${courseId}/grades/manual?assessmentId=${encodeURIComponent(assessmentId)}`);
  revalidatePath(`/admin/courses/${courseId}/grades`);
}

export default async function ManualAssessmentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ assessmentId?: string }>;
}) {
  const { courseId } = await params;
  const qs = await searchParams;
  const requestedAssessmentId = String(qs.assessmentId ?? "").trim();

  const { membership } = await requireCourseEditor(courseId);
  const canEdit = Boolean(membership); // requireCourseEditor already enforced
  if (!canEdit) return notFound();

  const [assessments, enrollments] = await Promise.all([
    db.manualAssessment.findMany({
      where: { courseId },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, maxScore: true, createdAt: true },
    }),
    db.enrollment.findMany({
      where: { courseId, status: EnrollmentStatus.APPROVED },
      include: { user: true },
      orderBy: { user: { name: "asc" } },
    }),
  ]);

  const selectedAssessment =
    (requestedAssessmentId && assessments.find((a) => a.id === requestedAssessmentId)) || assessments[0] || null;

  const selectedScores = selectedAssessment
    ? await db.manualAssessmentScore.findMany({
        where: {
          assessmentId: selectedAssessment.id,
          userId: { in: enrollments.map((e) => e.userId) },
        },
        select: { userId: true, score: true },
      })
    : [];

  const scoreByUserId = new Map(selectedScores.map((s) => [s.userId, s.score]));

  return (
    <div className="page-wrap gap-6">
      <PageHeader
        title="الدرجات اليدوية"
        subtitle="أضف اختبارات PDF أو أي درجة يدوية ثم أدخل درجات المتدربين."
        actions={
          <Link href={`/admin/courses/${courseId}/grades`} className="nk-btn nk-btn-secondary text-sm">
            العودة لإدارة الدرجات
          </Link>
        }
      />

      <Card elevated interactive={false} className="p-5 md:p-6">
        <h2 className="mb-4 text-base font-bold">{`إضافة درجة جديدة`}</h2>
        <form action={createManualAssessmentAction} className="grid gap-3 md:grid-cols-2 lg:items-end">
          <input type="hidden" name="courseId" value={courseId} />
          <label className="grid gap-1 text-sm">
            <span>العنوان</span>
            <input name="title" required maxLength={300} placeholder="مثال: اختبار PDF 1" />
          </label>
          <label className="grid gap-1 text-sm">
            <span>الدرجة القصوى</span>
            <input name="maxScore" type="number" min={1} step="0.1" defaultValue={100} required />
          </label>
          <button type="submit" className="nk-btn nk-btn-primary w-fit md:col-span-2">
            إنشاء الدرجة
          </button>
        </form>
      </Card>

      {assessments.length === 0 ? (
        <EmptyState text="لا توجد درجات يدوية بعد." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
          <div className="grid gap-3 lg:col-span-1">
            {assessments.map((a) => (
              <Card key={a.id} className="p-4">
                <div className="flex flex-col gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold">{a.title}</p>
                    <p className="text-xs text-[var(--text-muted)]">الدرجة القصوى: {a.maxScore}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/admin/courses/${courseId}/grades/manual?assessmentId=${encodeURIComponent(a.id)}`}
                      className={`nk-btn nk-btn-secondary text-xs ${a.id === selectedAssessment?.id ? "!bg-[var(--primary-strong)] !text-white" : ""}`}
                    >
                      فتح
                    </Link>
                    <form action={deleteManualAssessmentAction}>
                      <input type="hidden" name="courseId" value={courseId} />
                      <input type="hidden" name="assessmentId" value={a.id} />
                      <button type="submit" className="nk-btn nk-btn-secondary text-xs text-rose-700">
                        حذف
                      </button>
                    </form>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="lg:col-span-2">
            {!selectedAssessment ? (
              <EmptyState text="اختر درجة من القائمة لعرض درجات المتدربين." />
            ) : (
              <Card elevated interactive={false} className="p-5 md:p-6">
                <h2 className="mb-1 text-base font-bold">{selectedAssessment.title}</h2>
                <p className="mb-4 text-xs text-[var(--text-muted)]">{`الدرجة القصوى: ${selectedAssessment.maxScore}`}</p>

                <form action={upsertManualAssessmentScoresAction} className="relative grid gap-4">
                  <PendingFormOverlay text="جارٍ حفظ الدرجات..." variant="progress" />
                  <PendingFieldset className="grid gap-4">
                    <input type="hidden" name="courseId" value={courseId} />
                    <input type="hidden" name="assessmentId" value={selectedAssessment.id} />

                    {enrollments.length === 0 ? (
                      <EmptyState text="لا يوجد متدربون معتمدون لهذه الدورة." />
                    ) : (
                      <div className="grid gap-3">
                        {enrollments.map((e) => {
                          const current = scoreByUserId.get(e.userId);
                          return (
                            <Card key={e.userId} className="p-4">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0">
                                  <p className="font-semibold">{e.user.name}</p>
                                  <p className="text-sm text-[var(--text-muted)]" dir="ltr">
                                    {e.user.email}
                                  </p>
                                </div>
                                <label className="grid gap-1 text-sm">
                                  <span className="text-[var(--text-muted)]">{`درجة (من ${selectedAssessment.maxScore})`}</span>
                                  <input
                                    name={`score_${e.userId}`}
                                    type="number"
                                    step="0.1"
                                    min={0}
                                    max={selectedAssessment.maxScore}
                                    defaultValue={current ?? ""}
                                    className="!w-28"
                                  />
                                </label>
                              </div>
                            </Card>
                          );
                        })}
                      </div>
                    )}

                    <PendingSubmitButton
                      idleText="حفظ الدرجات"
                      pendingText="جارٍ حفظ الدرجات..."
                      className="nk-btn nk-btn-primary w-fit"
                    />
                  </PendingFieldset>
                </form>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

