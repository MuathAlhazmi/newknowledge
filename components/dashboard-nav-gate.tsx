"use client";

import { usePathname } from "next/navigation";

export function isDashboardAppPath(pathname: string): boolean {
  return (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/courses" ||
    pathname.startsWith("/courses/")
  );
}

export function DashboardNavGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (isDashboardAppPath(pathname)) return null;
  return <>{children}</>;
}
