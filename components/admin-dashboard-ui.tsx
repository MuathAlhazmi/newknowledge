import Link from "next/link";
import type { ReactNode } from "react";
import { Card, StatusBadge } from "@/components/ui";
import {
  arCopy,
  arCountApprovedTrainees,
  arCountExams,
  arCountMaterials,
  arCountPendingEnrollments,
} from "@/lib/copy/ar";

function AdminHeroIcon() {
  return (
    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
      />
    </svg>
  );
}

export function AdminDashboardHero({
  subtitle,
  stats,
}: {
  subtitle: string;
  stats: { courses: number; pendingPlatform: number; pendingEnrollments: number };
}) {
  const attention = stats.pendingPlatform + stats.pendingEnrollments;

  return (
    <Card elevated variant="highlight" interactive={false} className="!overflow-hidden !p-0">
      <div className="flex flex-col gap-5 border-s-4 border-[var(--primary)] p-5 md:flex-row md:items-start md:gap-6 md:p-6">
        <div className="flex shrink-0 justify-center md:justify-start">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-[var(--primary-strong)] shadow-[var(--shadow-sm)]"
            aria-hidden
          >
            <AdminHeroIcon />
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div>
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-[var(--primary-strong)]">
              نظرة سريعة
            </p>
            <h2 className="mt-1 text-xl font-bold text-[var(--foreground)] md:text-2xl">ملخص النشاط</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--text-muted)] md:text-base">{subtitle}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <StatusBadge text={`${stats.courses} دورة`} tone="info" />
            {attention > 0 ? (
              <StatusBadge text={`${attention} طلب يحتاج مراجعة`} tone="warning" />
            ) : (
              <StatusBadge text={arCopy.status.noPendingRequests} tone="success" />
            )}
          </div>

          <dl className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/90 px-3 py-3 shadow-[var(--shadow-sm)]">
              <dt className="text-xs font-medium text-[var(--text-muted)]">الدورات</dt>
              <dd className="mt-0.5 text-2xl font-bold tabular-nums text-[var(--foreground)]">{stats.courses}</dd>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/90 px-3 py-3 shadow-[var(--shadow-sm)]">
              <dt className="text-xs font-medium text-[var(--text-muted)]">حسابات بانتظار {arCopy.glossary.accountApproval}</dt>
              <dd className="mt-0.5 text-2xl font-bold tabular-nums text-[var(--foreground)]">
                {stats.pendingPlatform}
              </dd>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/90 px-3 py-3 shadow-[var(--shadow-sm)]">
              <dt className="text-xs font-medium text-[var(--text-muted)]">طلبات تسجيل بانتظار الاعتماد</dt>
              <dd className="mt-0.5 text-2xl font-bold tabular-nums text-[var(--foreground)]">
                {stats.pendingEnrollments}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </Card>
  );
}

function Chevron() {
  return (
    <svg
      className="h-5 w-5 shrink-0 text-[var(--text-muted)] transition-transform duration-200 group-hover:-translate-x-1 rtl:scale-x-[-1] rtl:group-hover:translate-x-1"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function IconApprovals() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

function shortcutIcon(kind: "approvals" | "users"): ReactNode {
  return kind === "approvals" ? <IconApprovals /> : <IconUsers />;
}

export function AdminShortcutTile({
  href,
  title,
  description,
  icon,
  badgeCount,
}: {
  href: string;
  title: string;
  description: string;
  icon: "approvals" | "users";
  badgeCount?: number;
}) {
  return (
    <Link
      href={href}
      className="group nk-header-link block h-full rounded-[var(--radius-card)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
    >
      <Card elevated className="relative h-full transition-[transform,box-shadow] duration-200 group-hover:border-[var(--primary)]">
        {badgeCount != null && badgeCount > 0 ? (
          <span className="absolute end-3 top-3 flex h-6 min-w-6 items-center justify-center rounded-full bg-[var(--warning-amber-soft)] px-1.5 text-xs font-bold text-[var(--warning-amber)]">
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        ) : null}
        <div className="flex min-h-[7.5rem] flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <span className="flex rounded-xl bg-[var(--primary-soft)] p-2.5 text-[var(--primary-strong)]">
              {shortcutIcon(icon)}
            </span>
            <Chevron />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[var(--foreground)]">{title}</p>
            <p className="mt-1 line-clamp-2 text-sm leading-snug text-[var(--text-muted)]">{description}</p>
          </div>
          <span className="text-xs font-bold text-[var(--primary-strong)]">{arCopy.buttons.go}</span>
        </div>
      </Card>
    </Link>
  );
}

export function AdminCourseDashboardCard({
  courseId,
  title,
  description,
  counts,
  pendingEnrollments,
}: {
  courseId: string;
  title: string;
  description: string;
  counts: { materials: number; exams: number; approvedEnrollments: number };
  pendingEnrollments: number;
}) {
  return (
    <Card elevated className="flex h-full flex-col">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <h2 className="text-lg font-semibold leading-snug text-[var(--foreground)]">{title}</h2>
        <p className="line-clamp-2 text-sm text-[var(--text-muted)]">{description}</p>
        <div className="mt-1 flex flex-wrap gap-2">
          <StatusBadge text={arCountMaterials(counts.materials)} tone="muted" />
          <StatusBadge text={arCountExams(counts.exams)} tone="muted" />
          <StatusBadge text={arCountApprovedTrainees(counts.approvedEnrollments)} tone="info" />
          {pendingEnrollments > 0 ? (
            <StatusBadge text={arCountPendingEnrollments(pendingEnrollments)} tone="warning" />
          ) : null}
        </div>
      </div>
      <Link
        href={`/admin/courses/${courseId}`}
        className="nk-btn nk-btn-primary mt-4 w-full sm:w-fit"
      >
        إدارة الدورة
      </Link>
    </Card>
  );
}
