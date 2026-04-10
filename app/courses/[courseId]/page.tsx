import Link from "next/link";
import { notFound } from "next/navigation";
import { EnrollmentStatus } from "@prisma/client";
import { requireParticipant } from "@/lib/auth";
import { getCourseAnnouncements } from "@/lib/course-announcements";
import { getCourseProgressSnapshot } from "@/lib/course-progress";
import { db } from "@/lib/db";
import { CourseAnnouncementsList } from "@/components/course-announcements-list";
import { CourseHeroCard } from "@/components/course-hero-card";
import { CourseHubTile, type CourseHubTileIcon } from "@/components/course-hub-tile";
import { Card, WarningCard } from "@/components/ui";

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
    select: {
      status: true,
      course: {
        select: {
          title: true,
          description: true,
        },
      },
    },
  });
  if (!enrollment) notFound();

  const approved = enrollment.status === EnrollmentStatus.APPROVED;
  const progress = approved ? await getCourseProgressSnapshot(user.id, courseId) : null;
  const announcementPreview = approved
    ? await getCourseAnnouncements(courseId, { limit: 4 })
    : [];

  const learningTiles: TileDef[] = [
    {
      title: "المحتوى (PDF)",
      description: "عرض ملفات PDF مباشرة دون مغادرة الواجهة التدريبية، مع إمكانية التحميل عند الحاجة.",
      href: `/courses/${courseId}/materials`,
      icon: "materials",
    },
    {
      title: "الاختبارات",
      description: "قياس الأداء بمدد زمنية واضحة وتسليم منظم.",
      href: `/courses/${courseId}/exams`,
      icon: "exams",
    },
    {
      title: "الدرجة العامة",
      description: "متابعة لدرجتك الإجمالية والملاحظات داخل الدورة.",
      href: `/courses/${courseId}/grades`,
      icon: "grades",
    },
  ];

  const sessionTiles: TileDef[] = [
    {
      title: "الإعلانات",
      description: "تحديثات الدورة والتنبيهات المهمة مرتبة زمنيًا.",
      href: `/courses/${courseId}/announcements`,
      icon: "announcements",
    },
    {
      title: "جلسات Zoom",
      description: "روابط وتنظيم للجلسات الحضورية عن بُعد.",
      href: `/courses/${courseId}/zoom`,
      icon: "zoom",
    },
    {
      title: "التقويم",
      description: "عرض الجلسات زمنيًا، وتصدير ICS وتنبيهات المتصفح.",
      href: `/courses/${courseId}/calendar`,
      icon: "zoom",
    },
    {
      title: "المحادثة المباشرة",
      description: "محادثة رسمية مع المدرب والمجموعة داخل الدورة.",
      href: `/courses/${courseId}/chat`,
      icon: "chat",
    },
    {
      title: "التغذية الراجعة",
      description: "شارك ملاحظاتك وتقييمك لمساعدتنا على تحسين التجربة التدريبية.",
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

      {approved && progress ? (
        <Card elevated className="p-4 md:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[var(--foreground)]">تقدّم الدورة</p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                {progress.total === 0
                  ? "لا توجد عناصر بعد (مواد أو اختبارات)."
                  : `تم إكمال ${progress.completed} من ${progress.total} عناصر (مواد معروضة واختبارات مُسلَّمة).`}
              </p>
            </div>
            <div className="text-start md:text-end">
              <span className="text-2xl font-bold tabular-nums text-[var(--primary-strong)]">
                {progress.percent}%
              </span>
              {progress.completion ? (
                <Link
                  href={`/courses/${courseId}/completion`}
                  className="mt-2 block text-sm font-medium text-[var(--primary-strong)] underline-offset-2 hover:underline"
                >
                  سجل الإكمال · {progress.completion.certificateNumber}
                </Link>
              ) : (
                <Link
                  href={`/courses/${courseId}/completion`}
                  className="mt-2 block text-sm font-medium text-[var(--primary-strong)] underline-offset-2 hover:underline"
                >
                  تفاصيل التقدّم والإكمال
                </Link>
              )}
            </div>
          </div>
          <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-[var(--surface-muted)]">
            <div
              className="h-full rounded-full bg-[var(--primary)] transition-all duration-500"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
        </Card>
      ) : null}

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
          <h2 className="nk-section-title">الإعلانات</h2>
          <CourseAnnouncementsList
            items={announcementPreview}
            emptyText="لا توجد تحديثات منشورة في الوقت الحالي."
          />
          {approved ? (
            <div className="mt-3">
              <Link href={`/courses/${courseId}/announcements`} className="nk-btn nk-btn-secondary text-sm">
                عرض كل الإعلانات
              </Link>
            </div>
          ) : null}
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
