import { notFound } from "next/navigation";
import { EnrollmentStatus } from "@prisma/client";
import { requireParticipant } from "@/lib/auth";
import { db } from "@/lib/db";
import { CourseHeroCard } from "@/components/course-hero-card";
import { CourseHubTile, type CourseHubTileIcon } from "@/components/course-hub-tile";
import { WarningCard } from "@/components/ui";

type TileDef = {
  title: string;
  description: string;
  href: string;
  icon: CourseHubTileIcon;
};

export default async function CourseDetailsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const user = await requireParticipant();
  const { courseId } = await params;
  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId } },
    include: { course: true },
  });
  if (!enrollment) notFound();

  const approved = enrollment.status === EnrollmentStatus.APPROVED;

  const learningTiles: TileDef[] = [
    {
      title: "المحتوى (PDF)",
      description: "عرض وتحميل مواد الدورة من داخل المنصة.",
      href: `/courses/${courseId}/materials`,
      icon: "materials",
    },
    {
      title: "الاختبارات",
      description: "اختبارات قبلية وبعدية ومتابعة النتائج.",
      href: `/courses/${courseId}/exams`,
      icon: "exams",
    },
    {
      title: "الدرجة العامة",
      description: "متابعة درجتك الإجمالية في الدورة.",
      href: `/courses/${courseId}/grades`,
      icon: "grades",
    },
  ];

  const sessionTiles: TileDef[] = [
    {
      title: "جلسات Zoom",
      description: "روابط الجلسات المباشرة والتنظيم.",
      href: `/courses/${courseId}/zoom`,
      icon: "zoom",
    },
    {
      title: "المحادثة المباشرة",
      description: "تواصل مع المدرب والمجموعة.",
      href: `/courses/${courseId}/chat`,
      icon: "chat",
    },
    {
      title: "التغذية الراجعة",
      description: "شارك ملاحظاتك وتقييمك للدورة.",
      href: `/courses/${courseId}/feedback`,
      icon: "feedback",
    },
  ];

  return (
    <div className="page-wrap gap-6">
      <CourseHeroCard
        title={enrollment.course.title}
        description={enrollment.course.description}
        approved={approved}
        helperText={approved ? "اختر أحد الأقسام أدناه للانتقال مباشرة." : undefined}
      />

      {!approved && (
        <WarningCard>
          لا يمكنك الوصول إلى محتوى الدورة قبل اعتماد طلبك من الإدارة. ستُفعّل الاختصارات أدناه بعد الاعتماد.
        </WarningCard>
      )}

      <div className="flex flex-col gap-10">
        <section className="nk-section !my-0">
          <h2 className="nk-section-title">التعلم</h2>
          <div className="nk-stagger-list grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {learningTiles.map((t) => (
              <CourseHubTile
                key={t.href}
                href={t.href}
                title={t.title}
                description={t.description}
                icon={t.icon}
                enabled={approved}
              />
            ))}
          </div>
        </section>

        <section className="nk-section !my-0">
          <h2 className="nk-section-title">التواصل والجلسات</h2>
          <div className="nk-stagger-list grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sessionTiles.map((t) => (
              <CourseHubTile
                key={t.href}
                href={t.href}
                title={t.title}
                description={t.description}
                icon={t.icon}
                enabled={approved}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
