import { CoursePreviewBanner } from "@/components/course-preview-banner";
import { CourseSubNav } from "@/components/course-sub-nav";
import { getCurrentPreviewCourseId } from "@/lib/course-preview";

export default async function CourseWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const previewingCourseId = await getCurrentPreviewCourseId();
  const previewing = previewingCourseId === courseId;

  return (
    <>
      {previewing ? <CoursePreviewBanner courseId={courseId} /> : null}
      <CourseSubNav variant="participant" courseId={courseId} />
      {children}
    </>
  );
}
