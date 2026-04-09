import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { CourseInstructorRole } from "@prisma/client";
import { db } from "@/lib/db";
import { CourseHeroCard } from "@/components/course-hero-card";
import { CourseHubTile, type CourseHubTileIcon } from "@/components/course-hub-tile";
import {
  arCountEnrollments,
  arCountExams,
  arCountFeedbackReplies,
  arCountMaterials,
  arCountZoomSessions,
} from "@/lib/copy/ar";
import { CourseTeamPanel } from "@/components/course-team-panel";
import { canManageCourseTeam, requireCourseAccess } from "@/lib/course-staff";
import { deleteCourseAction } from "@/app/admin/(instructor)/courses/[courseId]/danger-actions";
import { StatusBadge, WarningCard } from "@/components/ui";

const teamRoleLabel: Record<CourseInstructorRole, string> = {
  [CourseInstructorRole.OWNER]: "مسؤول الدورة",
  [CourseInstructorRole.EDITOR]: "محرر",
  [CourseInstructorRole.VIEWER]: "عرض فقط",
};

type TileDef = {
  title: string;
  description: string;
  href: string;
  icon: CourseHubTileIcon;
  badges?: ReactNode;
};

export default async function AdminCourseHubPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ deleteError?: string }>;
}) {
  const { courseId } = await params;
  const qs = await searchParams;
  const { membership } = await requireCourseAccess(courseId);

  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      _count: {
        select: {
          materials: true,
          exams: true,
          feedbacks: true,
          zoomSessions: true,
          enrollments: true,
        },
      },
      courseInstructors: {
        include: { user: { select: { name: true, email: true } } },
        orderBy: [{ role: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!course) notFound();

  const teamMembers = course.courseInstructors.map((row) => ({
    userId: row.userId,
    name: row.user.name,
    email: row.user.email,
    role: row.role,
  }));
  const showTeamEditor = canManageCourseTeam(membership.role);

  const base = `/admin/courses/${courseId}`;
  const c = course._count;

  const learningTiles: TileDef[] = [
    {
      title: "المحتوى (PDF)",
      description: "رفع مواد PDF وتنظيمها لعرضها داخل المنصة دون مغادرة الواجهة التدريبية.",
      badges: <StatusBadge text={arCountMaterials(c.materials)} tone="info" />,
      href: `${base}/materials`,
      icon: "materials",
    },
    {
      title: "الاختبارات",
      description: "اختبارات قبلية وبعدية بمدد زمنية واضحة وتسليم منظم.",
      badges: <StatusBadge text={arCountExams(c.exams)} tone="info" />,
      href: `${base}/exams`,
      icon: "exams",
    },
    {
      title: "الدرجات",
      description: "ضبط معايير التقييم ومتابعة درجات المتدربين والملاحظات.",
      href: `${base}/grades`,
      icon: "grades",
    },
  ];

  const opsTiles: TileDef[] = [
    {
      title: "التسجيلات",
      description: "اعتماد طلبات التسجيل ومتابعة المسجّلين.",
      badges: <StatusBadge text={arCountEnrollments(c.enrollments)} tone="info" />,
      href: `${base}/enrollments`,
      icon: "enrollments",
    },
    {
      title: "جلسات Zoom",
      description: "روابط وتنظيم للجلسات الحضورية عن بُعد.",
      badges: <StatusBadge text={arCountZoomSessions(c.zoomSessions)} tone="info" />,
      href: `${base}/zoom`,
      icon: "zoom",
    },
    {
      title: "الإعلانات",
      description: "إنشاء إعلانات وتنبيهات مرتبة زمنيًا تظهر للمتدربين داخل صندوق الإعلانات.",
      href: `${base}/announcements`,
      icon: "announcements",
    },
    {
      title: "المحادثات",
      description: "متابعة المحادثات الرسمية مع المتدربين والرد عليها.",
      href: `${base}/chat`,
      icon: "chat",
    },
    {
      title: "التغذية الراجعة",
      description: "قراءة ملاحظات المتدربين وتقييماتهم.",
      badges: <StatusBadge text={arCountFeedbackReplies(c.feedbacks)} tone="info" />,
      href: `${base}/feedback`,
      icon: "feedback",
    },
  ];

  return (
    <div className="page-wrap gap-6">
      <CourseHeroCard
        variant="admin"
        title={course.title}
        description={course.description}
        helperText="اختر أحد الأقسام أدناه للانتقال مباشرة إلى إدارة ذلك الجزء من الدورة."
        actions={
          <>
            <Link href="/admin/courses" className="nk-btn nk-btn-secondary text-sm">
              جميع الدورات
            </Link>
          </>
        }
      />

      {showTeamEditor ? (
        <CourseTeamPanel courseId={courseId} members={teamMembers} />
      ) : (
        <section className="nk-section !my-0 rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-4">
          <h2 className="nk-section-title !mb-2">فريق التدريس</h2>
          <ul className="grid gap-2 text-sm">
            {teamMembers.map((m) => (
              <li key={m.userId} className="flex flex-wrap justify-between gap-2 border-b border-[var(--border-muted-edge)] pb-2 last:border-0 last:pb-0">
                <span className="font-medium">{m.name}</span>
                <span className="text-[var(--text-muted)]">{teamRoleLabel[m.role]}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-col gap-10">
        <section className="nk-section !my-0">
          <h2 className="nk-section-title">التعلم والتقييم</h2>
          <div className="nk-stagger-list grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {learningTiles.map((t) => (
              <CourseHubTile
                key={t.href}
                href={t.href}
                title={t.title}
                description={t.description}
                badges={t.badges}
                icon={t.icon}
                enabled
              />
            ))}
          </div>
        </section>

        <section className="nk-section !my-0">
          <h2 className="nk-section-title">المتدربون والتواصل</h2>
          <div className="nk-stagger-list grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {opsTiles.map((t) => (
              <CourseHubTile
                key={t.href}
                href={t.href}
                title={t.title}
                description={t.description}
                badges={t.badges}
                icon={t.icon}
                enabled
              />
            ))}
          </div>
        </section>

        {showTeamEditor ? (
          <section className="nk-section !my-0">
            <h2 className="nk-section-title text-rose-700">حذف الدورة</h2>
            <WarningCard>
              <div className="grid gap-3 text-sm leading-relaxed">
                <p>
                  حذف الدورة نهائي ولا يمكن التراجع عنه. سيتم حذف جميع البيانات المرتبطة بهذه الدورة فقط:
                  التسجيلات، المواد، الاختبارات، المحاولات، الدرجات، جلسات Zoom، المحادثات، التغذية الراجعة، والإعلانات.
                </p>
                <p>
                  لن يتم حذف المستخدمين أو دوراتهم الأخرى. نوصي بأخذ نسخة احتياطية قبل التنفيذ.
                </p>
                <ul className="grid gap-1">
                  <li>• المواد الحالية: {c.materials}</li>
                  <li>• الاختبارات الحالية: {c.exams}</li>
                  <li>• التسجيلات الحالية: {c.enrollments}</li>
                  <li>• الجلسات الحالية: {c.zoomSessions}</li>
                  <li>• الملاحظات الحالية: {c.feedbacks}</li>
                </ul>
              </div>
            </WarningCard>
            {qs.deleteError === "confirm" ? (
              <p className="mt-3 text-sm text-rose-700">
                فشل الحذف: تأكيدات الأمان غير مكتملة. أدخل عنوان الدورة حرفيًا، واكتب DELETE، وفعّل مربع الإقرار.
              </p>
            ) : null}
            <form action={deleteCourseAction} className="mt-4 grid gap-3 rounded-xl border border-rose-300/60 bg-rose-50/40 p-4 dark:bg-rose-950/20">
              <input type="hidden" name="courseId" value={courseId} />
              <label className="grid gap-1 text-sm">
                <span className="font-medium">للتأكيد، اكتب عنوان الدورة كما هو:</span>
                <input
                  name="confirmTitle"
                  placeholder={course.title}
                  className="max-w-xl rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2"
                  required
                />
              </label>
              <label className="grid gap-1 text-sm">
                <span className="font-medium">اكتب DELETE بالأحرف الكبيرة:</span>
                <input
                  name="confirmWord"
                  placeholder="DELETE"
                  className="max-w-xs rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2"
                  required
                />
              </label>
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" name="acknowledgeCascade" className="nk-check mt-0.5" />
                <span>أقر بأن حذف الدورة سيزيل بياناتها نهائيًا ولا يمكن التراجع عن ذلك.</span>
              </label>
              <button type="submit" className="nk-btn nk-btn-secondary w-fit text-sm text-rose-700 hover:bg-rose-100 dark:hover:bg-rose-950/40">
                حذف الدورة نهائيًا
              </button>
            </form>
          </section>
        ) : null}
      </div>
    </div>
  );
}
