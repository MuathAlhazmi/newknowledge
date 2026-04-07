import { AdminListSkeleton, PageHeaderSkeleton, SkeletonBlock } from "@/components/skeletons";

export default function PlatformAdminLoading() {
  return (
    <div className="page-wrap gap-6">
      <PageHeaderSkeleton />
      <section className="nk-section !my-0">
        <SkeletonBlock className="h-6 w-48 rounded-lg" />
        <AdminListSkeleton rows={3} />
      </section>
      <section className="nk-section !my-0">
        <SkeletonBlock className="h-6 w-44 rounded-lg" />
        <AdminListSkeleton rows={3} />
      </section>
    </div>
  );
}
