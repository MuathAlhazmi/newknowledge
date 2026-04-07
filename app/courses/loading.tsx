import { CourseTileGridSkeleton, PageHeaderSkeleton } from "@/components/skeletons";

export default function CoursesLoading() {
  return (
    <div className="page-wrap gap-6">
      <PageHeaderSkeleton />
      <CourseTileGridSkeleton />
    </div>
  );
}
