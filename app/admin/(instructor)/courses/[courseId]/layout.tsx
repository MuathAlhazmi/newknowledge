import { CourseSubNav } from "@/components/course-sub-nav";
import { requireCourseAccess } from "@/lib/course-staff";

export default async function InstructorCourseWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  await requireCourseAccess(courseId);
  return (
    <>
      <CourseSubNav variant="instructor" courseId={courseId} />
      {children}
    </>
  );
}
