import { Card } from "@/components/ui";

type SkeletonProps = {
  className?: string;
};

export function SkeletonBlock({ className = "" }: SkeletonProps) {
  return <div className={`nk-skeleton ${className}`.trim()} aria-hidden />;
}

export function PageHeaderSkeleton() {
  return (
    <div className="nk-fade-in flex w-full flex-col gap-3">
      <SkeletonBlock className="h-3.5 w-28 rounded-full" />
      <SkeletonBlock className="h-10 w-72 max-w-full rounded-xl" />
      <SkeletonBlock className="h-4 w-[34rem] max-w-full rounded-full" />
    </div>
  );
}

export function CourseHeroSkeleton() {
  return (
    <Card elevated interactive={false} className="!p-0">
      <div className="flex flex-col gap-5 border-s-4 border-[var(--primary)] p-5 md:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <SkeletonBlock className="h-3.5 w-24 rounded-full" />
            <SkeletonBlock className="h-10 w-72 max-w-full rounded-xl" />
          </div>
          <SkeletonBlock className="h-14 w-14 rounded-2xl" />
        </div>
        <SkeletonBlock className="h-4 w-[42rem] max-w-full rounded-full" />
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/90 px-3 py-2.5">
          <SkeletonBlock className="h-5 w-36 rounded-full" />
        </div>
      </div>
    </Card>
  );
}

export function CourseTileGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} elevated interactive={false} className="h-full">
          <div className="flex min-h-[7.5rem] flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <SkeletonBlock className="h-11 w-11 rounded-xl" />
              <SkeletonBlock className="h-5 w-5 rounded-full" />
            </div>
            <div className="space-y-2">
              <SkeletonBlock className="h-5 w-40 rounded-lg" />
              <SkeletonBlock className="h-3.5 w-full rounded-full" />
            </div>
            <SkeletonBlock className="mt-auto h-3.5 w-12 rounded-full" />
          </div>
        </Card>
      ))}
    </div>
  );
}

export function ChatThreadSkeleton() {
  return (
    <div className="nk-card nk-fade-in p-4 md:p-5">
      <div className="space-y-3">
        <SkeletonBlock className="h-4 w-56 rounded-full" />
        <div className="space-y-2">
          <SkeletonBlock className="h-16 w-[70%] rounded-2xl" />
          <SkeletonBlock className="h-16 w-[55%] rounded-2xl ms-auto" />
          <SkeletonBlock className="h-16 w-[65%] rounded-2xl" />
        </div>
        <SkeletonBlock className="h-11 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function ExamAttemptSkeleton() {
  return (
    <div className="page-wrap gap-6">
      <PageHeaderSkeleton />
      <div className="nk-card nk-fade-in p-4 md:p-5">
        <div className="space-y-4">
          <SkeletonBlock className="h-5 w-48 rounded-full" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2 rounded-xl border border-[var(--border)] p-3">
              <SkeletonBlock className="h-4 w-4/5 rounded-full" />
              <SkeletonBlock className="h-9 w-full rounded-lg" />
              <SkeletonBlock className="h-9 w-full rounded-lg" />
            </div>
          ))}
          <SkeletonBlock className="h-10 w-40 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function AdminListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="nk-stagger-list grid gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Card key={i} elevated interactive={false} className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <SkeletonBlock className="h-5 w-36 rounded-lg" />
              <SkeletonBlock className="h-3.5 w-56 rounded-full" />
            </div>
            <SkeletonBlock className="h-10 w-28 rounded-xl" />
          </div>
        </Card>
      ))}
    </div>
  );
}
