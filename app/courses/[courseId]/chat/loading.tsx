import { ChatThreadSkeleton, PageHeaderSkeleton } from "@/components/skeletons";

export default function CourseChatLoading() {
  return (
    <div className="page-wrap gap-6">
      <PageHeaderSkeleton />
      <ChatThreadSkeleton />
    </div>
  );
}
