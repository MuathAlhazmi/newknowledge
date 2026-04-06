"use client";

import { UserRole } from "@prisma/client";
import { HeaderNavLink } from "@/components/header-nav-link";

export function HeaderGuestNav() {
  return (
    <ul className="flex min-w-0 flex-wrap items-center justify-end gap-2 sm:gap-2.5">
      <li>
        <HeaderNavLink href="/login" variant="primary" className="!px-4 !py-2 !text-sm">
          تسجيل الدخول
        </HeaderNavLink>
      </li>
      <li>
        <HeaderNavLink href="/signup" variant="secondary" className="!px-4 !py-2 !text-sm">
          إنشاء حساب
        </HeaderNavLink>
      </li>
    </ul>
  );
}

export function HeaderRoleNav({
  role,
  platformApproved,
}: {
  role: UserRole;
  platformApproved: boolean;
}) {
  const pendingParticipant = role === UserRole.PARTICIPANT && !platformApproved;

  if (role === UserRole.ADMIN) {
    return (
      <ul className="flex min-w-0 flex-wrap items-center justify-end gap-2 sm:gap-3 md:gap-4">
        <li>
          <HeaderNavLink href="/">الرئيسية</HeaderNavLink>
        </li>
        <li>
          <HeaderNavLink href="/admin" prefixMatch>
            إدارة المنصة
          </HeaderNavLink>
        </li>
      </ul>
    );
  }

  if (role === UserRole.INSTRUCTOR) {
    return (
      <ul className="flex min-w-0 flex-wrap items-center justify-end gap-2 sm:gap-3 md:gap-4">
        <li>
          <HeaderNavLink href="/">الرئيسية</HeaderNavLink>
        </li>
        <li>
          <HeaderNavLink href="/admin/courses" prefixMatch>
            لوحة الدورات
          </HeaderNavLink>
        </li>
      </ul>
    );
  }

  if (pendingParticipant) {
    return (
      <ul className="flex min-w-0 flex-wrap items-center justify-end gap-2 sm:gap-3 md:gap-4">
        <li>
          <HeaderNavLink href="/">الرئيسية</HeaderNavLink>
        </li>
        <li>
          <HeaderNavLink href="/pending-approval">حالة اعتماد الحساب</HeaderNavLink>
        </li>
      </ul>
    );
  }

  return (
    <ul className="flex min-w-0 flex-wrap items-center justify-end gap-2 sm:gap-3 md:gap-4">
      <li>
        <HeaderNavLink href="/">الرئيسية</HeaderNavLink>
      </li>
      <li>
        <HeaderNavLink href="/courses" prefixMatch>
          دوراتي
        </HeaderNavLink>
      </li>
    </ul>
  );
}
