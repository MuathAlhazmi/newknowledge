import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ExamType } from "@prisma/client";
import { requireInstructor } from "@/lib/auth";
import { db } from "@/lib/db";
import { recomputeCourseGrade } from "@/lib/guards";
import { arCopy } from "@/lib/copy/ar";
import { Card, PageHeader, StatusBadge } from "@/components/ui";

async function approvePostExamAction(formData: FormData) {
  "use server";
  const staff = await requireInstructor();
  const courseId = String(formData.get("courseId"));
  const userId = String(formData.get("userId"));

  await db.postExamApproval.upsert({
    where: { userId_courseId: { userId, courseId } },
    create: { userId, courseId, approvedById: staff.id },
    update: { approvedById: staff.id, approvedAt: new Date() },
  });
  revalidatePath(`/admin/courses/${courseId}/exams`);
}

async function updateGradingConfigAction(formData: FormData) {
  "use server";
  await requireInstructor();
  const courseId = String(formData.get("courseId"));
  const preWeight = Number(formData.get("preWeight"));
  const postWeight = Number(formData.get("postWeight"));
  const passThreshold = Number(formData.get("passThreshold"));
  if (preWeight + postWeight !== 100) return;

  await db.gradingConfig.upsert({
    where: { courseId },
    create: { courseId, preWeight, postWeight, passThreshold },
    update: { preWeight, postWeight, passThreshold },
  });

  const approvedEnrollments = await db.enrollment.findMany({
    where: { courseId, status: "APPROVED" },
  });
  await Promise.all(approvedEnrollments.map((e) => recomputeCourseGrade(e.userId, courseId)));
  revalidatePath(`/admin/courses/${courseId}/exams`);
}

export default async function AdminExamsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  await requireInstructor();
  const { courseId } = await params;

  const [course, config, preExam, participants] = await Promise.all([
    db.course.findUnique({ where: { id: courseId }, select: { title: true } }),
    db.gradingConfig.findUnique({ where: { courseId } }),
    db.exam.findFirst({ where: { courseId, type: ExamType.PRE } }),
    db.enrollment.findMany({
      where: { courseId, status: "APPROVED" },
      include: { user: true },
      orderBy: { user: { name: "asc" } },
    }),
  ]);

  const preAttempts = preExam
    ? await db.examAttempt.findMany({
        where: { examId: preExam.id, submittedAt: { not: null } },
      })
    : [];

  const approvals = await db.postExamApproval.findMany({ where: { courseId } });
  const approvedUserSet = new Set(approvals.map((a) => a.userId));
  const preSubmittedSet = new Set(preAttempts.map((a) => a.userId));

  if (!course) notFound();

  const ae = arCopy.adminExams;

  return (
    <div className="page-wrap gap-6">
      <PageHeader
        title="الاختبارات واعتماد البعدي"
        subtitle={`ضبط الأوزان واعتماد فتح الاختبار البعدي (${course.title})`}
        actions={
          <Link href={`/admin/courses/${courseId}`} className="nk-btn nk-btn-secondary text-sm">
            {arCopy.adminGrades.linkCourseHub}
          </Link>
        }
      />

      {config && (
        <Card elevated variant="highlight" interactive={false} className="p-5 md:p-6">
          <h2 className="mb-1 text-base font-bold text-[var(--primary-strong)]">معايير احتساب الدرجة</h2>
          <p className="mb-4 text-xs text-[var(--text-muted)]">{ae.configHelper}</p>
          <form action={updateGradingConfigAction} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 lg:items-end">
            <input type="hidden" name="courseId" value={courseId} />
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-[var(--foreground)]">وزن القبلي %</span>
              <input name="preWeight" type="number" min={0} max={100} defaultValue={config.preWeight} />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-[var(--foreground)]">وزن البعدي %</span>
              <input name="postWeight" type="number" min={0} max={100} defaultValue={config.postWeight} />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="font-medium text-[var(--foreground)]">درجة الاجتياز %</span>
              <input name="passThreshold" type="number" min={0} max={100} defaultValue={config.passThreshold} />
            </label>
            <button className="nk-btn nk-btn-primary w-full md:col-span-2 lg:col-span-1" type="submit">
              {arCopy.buttons.save}
            </button>
          </form>
        </Card>
      )}

      <section className="nk-section !my-0">
        <h2 className="nk-section-title">{ae.participantsSection}</h2>
        <ul className="nk-stagger-list grid gap-3">
          {participants.map(({ user }) => {
            const preDone = preSubmittedSet.has(user.id);
            const approved = approvedUserSet.has(user.id);
            return (
              <li key={user.id}>
                <Card elevated className="p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold text-[var(--foreground)]">{user.name}</p>
                      <p className="text-sm text-[var(--text-muted)]" dir="ltr">
                        {user.email}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs text-[var(--text-muted)]">القبلي:</span>
                      <StatusBadge text={preDone ? "مُكمَل" : "غير مُكمَل"} tone={preDone ? "success" : "muted"} />
                      <span className="text-xs text-[var(--text-muted)]">البعدي:</span>
                      <StatusBadge text={approved ? "معتمد" : "غير معتمد"} tone={approved ? "success" : "warning"} />
                    </div>
                  </div>
                  <form action={approvePostExamAction} className="mt-4">
                    <input type="hidden" name="courseId" value={courseId} />
                    <input type="hidden" name="userId" value={user.id} />
                    <button
                      disabled={!preDone}
                      type="submit"
                      className="nk-btn nk-btn-secondary text-sm disabled:opacity-50"
                    >
                      السماح بالاختبار البعدي
                    </button>
                  </form>
                </Card>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
