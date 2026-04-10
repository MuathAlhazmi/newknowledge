import Link from "next/link";
import { ExamType } from "@prisma/client";
import { notFound } from "next/navigation";
import { requireParticipant } from "@/lib/auth";
import { db } from "@/lib/db";
import { isPostExamUnlocked, requireApprovedEnrollment } from "@/lib/guards";
import { Card, PageHeader, WarningCard } from "@/components/ui";

export default async function ExamsPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireParticipant();
  const { courseId } = await params;
  const qs = await searchParams;
  const approved = await requireApprovedEnrollment(user.id, courseId);
  if (!approved) notFound();

  const exams = await db.exam.findMany({
    where: { courseId, isActive: true },
    orderBy: { type: "asc" },
  });
  const postUnlocked = await isPostExamUnlocked(user.id, courseId);

  return (
    <div className="page-wrap gap-5">
      <PageHeader title="الاختبارات" subtitle="اختبارات قبلية وبعدية بمدة زمنية محددة." />
      {qs.error === "max_attempts" ? (
        <WarningCard>لقد استنفدت المحاولات المسموحة لهذا الاختبار. تواصل مع المدرب إن احتجت محاولة إضافية.</WarningCard>
      ) : null}
      {exams.map((exam) => {
        const blocked = exam.type === ExamType.POST && !postUnlocked;
        const examTypeLabel = exam.type === ExamType.PRE ? "اختبار قبلي" : "اختبار بعدي";
        const isDemoExam = exam.title.includes("تجريب");
        return (
          <Card key={exam.id} elevated>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">{exam.title}</p>
              <div className="flex flex-wrap items-center gap-2">
                {isDemoExam ? (
                  <span className="nk-badge nk-badge-muted text-[0.65rem]">محتوى عرض فقط</span>
                ) : null}
                <span className="nk-badge nk-badge-info">{examTypeLabel}</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-muted)]">
              <span className="nk-badge nk-badge-muted">المدة: {exam.durationMinutes} دقيقة</span>
              <span className={`nk-badge ${blocked ? "nk-badge-muted" : "nk-badge-success"}`}>
                {blocked ? "مغلق" : "متاح"}
              </span>
            </div>
            {blocked ? (
              <div className="mt-3">
                <WarningCard>الاختبار البعدي مغلق حتى اعتماد الإدارة بعد إكمال الاختبار القبلي.</WarningCard>
              </div>
            ) : (
              <Link
                href={`/courses/${courseId}/exams/${exam.id}`}
                className="nk-btn nk-btn-primary mt-3"
              >
                بدء الاختبار
              </Link>
            )}
          </Card>
        );
      })}
    </div>
  );
}
