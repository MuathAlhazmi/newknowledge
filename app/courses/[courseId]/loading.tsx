import { CourseHeroSkeleton, CourseTileGridSkeleton, SkeletonBlock } from "@/components/skeletons";

export default function CourseDetailsLoading() {
  return (
    <div className="page-wrap gap-6">
      <CourseHeroSkeleton />
      <div className="flex flex-col gap-10">
        <section className="nk-section !my-0">
          <SkeletonBlock className="h-6 w-24 rounded-lg" />
          <CourseTileGridSkeleton count={3} />
        </section>
        <section className="nk-section !my-0">
          <SkeletonBlock className="h-6 w-40 rounded-lg" />
          <CourseTileGridSkeleton count={3} />
        </section>
      </div>
    </div>
  );
}
