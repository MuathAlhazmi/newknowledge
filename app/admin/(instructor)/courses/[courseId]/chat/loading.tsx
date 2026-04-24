import { ChatThreadSkeleton, PageHeaderSkeleton, SkeletonBlock } from "@/components/skeletons";

export default function AdminCourseChatLoading() {
  return (
    <div className="page-wrap gap-5">
      <PageHeaderSkeleton />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-9 min-w-[5.5rem] rounded-full" />
        ))}
      </div>
      <ChatThreadSkeleton />
    </div>
  );
}
