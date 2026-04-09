import { PageHeaderSkeleton, SkeletonBlock } from "@/components/skeletons";
import { Card } from "@/components/ui";

export default function AdminMaterialsLoading() {
  return (
    <div className="page-wrap gap-5">
      <PageHeaderSkeleton />
      <Card elevated interactive={false} className="grid gap-4 p-4">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-9 flex-1 min-w-[5rem] max-w-[8rem] rounded-full" />
          ))}
        </div>
        <SkeletonBlock className="h-10 w-full max-w-xl rounded-lg" />
        <SkeletonBlock className="h-32 w-full rounded-xl" />
        <div className="flex gap-2">
          <SkeletonBlock className="h-10 w-32 rounded-lg" />
          <SkeletonBlock className="h-10 w-40 rounded-lg" />
        </div>
      </Card>
      <div className="grid gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} elevated interactive={false} className="p-4">
            <SkeletonBlock className="h-5 w-48 rounded-lg" />
            <SkeletonBlock className="mt-2 h-3 w-full max-w-md rounded-full" />
          </Card>
        ))}
      </div>
    </div>
  );
}
