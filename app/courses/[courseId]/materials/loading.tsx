import { PageHeaderSkeleton, SkeletonBlock } from "@/components/skeletons";
import { Card } from "@/components/ui";

export default function MaterialsListLoading() {
  return (
    <div className="page-wrap gap-5">
      <PageHeaderSkeleton />
      <div className="nk-stagger-list grid gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} elevated interactive={false} className="p-4">
            <SkeletonBlock className="h-5 w-56 max-w-full rounded-lg" />
          </Card>
        ))}
      </div>
    </div>
  );
}
