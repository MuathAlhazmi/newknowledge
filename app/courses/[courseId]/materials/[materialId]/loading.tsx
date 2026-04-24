import { PageHeaderSkeleton, SkeletonBlock } from "@/components/skeletons";
import { Card } from "@/components/ui";

export default function MaterialViewerLoading() {
  return (
    <div className="page-wrap gap-5">
      <PageHeaderSkeleton />
      <Card className="p-2">
        <SkeletonBlock className="min-h-[75vh] w-full rounded-xl" />
      </Card>
    </div>
  );
}
