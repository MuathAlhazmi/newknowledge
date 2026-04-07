"use client";

export function isDashboardAppPath(pathname: string): boolean {
  return (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/courses" ||
    pathname.startsWith("/courses/")
  );
}

/** Previously hid role links on dashboard routes; we always show them now for quicker navigation. */
export function DashboardNavGate({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
