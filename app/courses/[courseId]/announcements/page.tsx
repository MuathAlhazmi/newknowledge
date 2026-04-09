import Link from "next/link";
import { notFound } from "next/navigation";
import { requireParticipant } from "@/lib/auth";
import { getCourseAnnouncements } from "@/lib/course-announcements";
import { db } from "@/lib/db";
import { requireApprovedEnrollment } from "@/lib/guards";
import { CourseAnnouncementsList } from "@/components/course-announcements-list";
import { PageHeader } from "@/components/ui";

export default async function CourseAnnouncementsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const user = await requireParticipant();
  const { courseId } = await params;
  const approved = await requireApprovedEnrollment(user.id, courseId);
  if (!approved) notFound();

  const [course, items] = await Promise.all([
    db.course.findUnique({ where: { id: courseId }, select: { title: true } }),
    getCourseAnnouncements(courseId, { limit: 100 }),
  ]);
  if (!course) notFound();

  return (
    <div className="page-wrap gap-5">
      <PageHeader
        title="الإعلانات والتنبيهات"
        subtitle={`${course.title} · آخر التحديثات مرتبة من الأحدث للأقدم.`}
        actions={
          <Link href={`/courses/${courseId}`} className="nk-btn nk-btn-secondary text-sm">
            مركز الدورة
          </Link>
        }
      />
      <CourseAnnouncementsList items={items} emptyText="لا توجد إعلانات أو تحديثات في الوقت الحالي." />
    </div>
  );
}
