"use client";

import { usePathname } from "next/navigation";
import { isDashboardAppPath } from "@/components/dashboard-nav-gate";

export function HeaderUserCluster({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const dashboard = isDashboardAppPath(pathname);
  return (
    <div
      className={`inline-flex min-w-0 max-w-full flex-wrap items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/60 px-2 py-1.5 ${
        dashboard ? "" : "max-sm:ms-0 sm:ms-2 md:ms-3"
      }`}
    >
      {children}
    </div>
  );
}
