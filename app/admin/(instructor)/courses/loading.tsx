import { CourseTileGridSkeleton, PageHeaderSkeleton, SkeletonBlock } from "@/components/skeletons";

export default function InstructorCoursesLoading() {
  return (
    <div className="page-wrap gap-6">
      <PageHeaderSkeleton />
      <section className="nk-section !my-0">
        <SkeletonBlock className="h-6 w-24 rounded-lg" />
        <CourseTileGridSkeleton count={6} />
      </section>
    </div>
  );
}
