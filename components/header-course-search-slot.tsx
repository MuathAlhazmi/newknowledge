"use client";

import { usePathname } from "next/navigation";
import { CourseWorkspaceSearch } from "@/components/course-workspace-search";

/** Participant enrolled search: only on `/courses/[courseId]/…` (not `/courses` list). */
export function HeaderCourseSearchSlot({ enabled }: { enabled: boolean }) {
  const pathname = usePathname();
  if (!enabled) return null;
  if (!pathname || !/^\/courses\/[^/]+/.test(pathname)) return null;

  return (
    <div className="border-t border-[var(--border-muted-edge)] px-4 pb-3 pt-2.5 md:px-5 md:pb-3.5 md:pt-3">
      <CourseWorkspaceSearch variant="navbar" />
    </div>
  );
}
