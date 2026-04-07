import Link from "next/link";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { requireInstructor } from "@/lib/auth";
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
import { StatusBadge } from "@/components/ui";

type TileDef = {
  title: string;
  description: string;
  href: string;
  icon: CourseHubTileIcon;
  badges?: ReactNode;
};

export default async function AdminCourseHubPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  await requireInstructor();
  const { courseId } = await params;

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
    },
  });

  if (!course) notFound();

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
      </div>
    </div>
  );
}
