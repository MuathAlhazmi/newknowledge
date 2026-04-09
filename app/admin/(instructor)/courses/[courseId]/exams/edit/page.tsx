import Link from "next/link";
import { notFound } from "next/navigation";
import { ExamType } from "@prisma/client";
import { canEditCourse, requireCourseAccess } from "@/lib/course-staff";
import { arCopy } from "@/lib/copy/ar";
import { db } from "@/lib/db";
import { InstructorExamEditor } from "@/components/instructor-exam-editor";
import { PageHeader } from "@/components/ui";

export default async function InstructorExamEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { courseId } = await params;
  const { membership } = await requireCourseAccess(courseId);
  const canEdit = canEditCourse(membership.role);
  const { type: typeParam } = await searchParams;
  const raw = String(typeParam ?? "PRE").toUpperCase();
  if (raw !== "PRE" && raw !== "POST") notFound();
  const examType = raw as ExamType;

  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { title: true },
  });
  if (!course) notFound();

  const exam = await db.exam.findUnique({
    where: { courseId_type: { courseId, type: examType } },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: { choices: true },
      },
    },
  });

  const ae = arCopy.adminExams;
  const defaultTitle = examType === ExamType.PRE ? ae.editorPageTitlePre : ae.editorPageTitlePost;

  const initial = {
    title: exam?.title ?? defaultTitle,
    durationMinutes: exam?.durationMinutes ?? 30,
    isActive: exam?.isActive ?? true,
    questions:
      exam?.questions.map((q) => ({
        text: q.text,
        choices: q.choices.map((c) => ({
          text: c.text,
          isCorrect: c.isCorrect,
        })),
      })) ?? [],
  };

  const pageTitle =
    examType === ExamType.PRE ? ae.editorPageTitlePre : ae.editorPageTitlePost;

  return (
    <div className="page-wrap gap-6">
      <PageHeader
        title={pageTitle}
        subtitle={`${ae.editorSubtitle} (${course.title})`}
        actions={
          <Link href={`/admin/courses/${courseId}/exams`} className="nk-btn nk-btn-secondary text-sm">
            {ae.backToExams}
          </Link>
        }
      />
      <InstructorExamEditor courseId={courseId} examType={examType} initial={initial} canEdit={canEdit} />
    </div>
  );
}
