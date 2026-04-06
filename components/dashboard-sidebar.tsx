"use client";

import { HeaderNavLink } from "@/components/header-nav-link";

export function DashboardSidebar({
  variant,
}: {
  variant: "admin" | "instructor" | "participant";
}) {
  if (variant === "admin") {
    return (
      <aside className="nk-dashboard-sidebar" aria-label="التنقل">
        <nav className="nk-dashboard-sidebar-panel">
          <p className="mb-2 px-2 text-xs font-bold text-[var(--text-muted)]">القائمة</p>
          <ul className="flex flex-col gap-1">
            <li>
              <HeaderNavLink href="/" layout="sidebar">
                الرئيسية
              </HeaderNavLink>
            </li>
            <li>
              <HeaderNavLink href="/admin" layout="sidebar" prefixMatch>
                إدارة المنصة
              </HeaderNavLink>
            </li>
          </ul>
        </nav>
      </aside>
    );
  }

  if (variant === "instructor") {
    return (
      <aside className="nk-dashboard-sidebar" aria-label="التنقل">
        <nav className="nk-dashboard-sidebar-panel">
          <p className="mb-2 px-2 text-xs font-bold text-[var(--text-muted)]">القائمة</p>
          <ul className="flex flex-col gap-1">
            <li>
              <HeaderNavLink href="/" layout="sidebar">
                الرئيسية
              </HeaderNavLink>
            </li>
            <li>
              <HeaderNavLink href="/admin/courses" layout="sidebar" prefixMatch>
                لوحة الدورات
              </HeaderNavLink>
            </li>
          </ul>
        </nav>
      </aside>
    );
  }

  return (
    <aside className="nk-dashboard-sidebar" aria-label="التنقل">
      <nav className="nk-dashboard-sidebar-panel">
        <p className="mb-2 px-2 text-xs font-bold text-[var(--text-muted)]">القائمة</p>
        <ul className="flex flex-col gap-1">
          <li>
            <HeaderNavLink href="/" layout="sidebar">
              الرئيسية
            </HeaderNavLink>
          </li>
          <li>
            <HeaderNavLink href="/courses" layout="sidebar" prefixMatch>
              دوراتي
            </HeaderNavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
