"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function isActive(pathname: string, href: string, prefixMatch: boolean): boolean {
  if (href === "/") return pathname === "/";
  if (prefixMatch) return pathname === href || pathname.startsWith(`${href}/`);
  return pathname === href;
}

export function HeaderNavLink({
  href,
  children,
  variant = "text",
  prefixMatch = false,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "text" | "primary" | "secondary";
  prefixMatch?: boolean;
  className?: string;
}) {
  const pathname = usePathname();
  const active = isActive(pathname, href, prefixMatch);
  const extra = className.trim();

  if (variant === "primary") {
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={`nk-btn nk-btn-primary ${extra}`.trim()}
      >
        {children}
      </Link>
    );
  }

  if (variant === "secondary") {
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={`nk-btn nk-btn-secondary ${extra}`.trim()}
      >
        {children}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`nk-header-link nk-header-nav-pill rounded-full px-3.5 py-2 text-sm font-medium ${
        active
          ? "bg-[var(--primary-soft)] font-semibold text-[var(--primary-strong)] ring-1 ring-[var(--border)]"
          : "text-[var(--text-muted)] hover:bg-[var(--surface-muted)]/90"
      } ${extra}`.trim()}
    >
      {children}
    </Link>
  );
}
