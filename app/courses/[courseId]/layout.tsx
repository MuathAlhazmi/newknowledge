import { CourseSubNav } from "@/components/course-sub-nav";

export default async function CourseWorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  return (
    <>
      <CourseSubNav variant="participant" courseId={courseId} />
      {children}
    </>
  );
}
