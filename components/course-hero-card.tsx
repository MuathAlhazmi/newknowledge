import type { ReactNode } from "react";
import { Card, StatusBadge } from "@/components/ui";
import { arCopy } from "@/lib/copy/ar";

function CourseHeroIcon() {
  return (
    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  );
}

export function CourseHeroCard({
  title,
  description,
  variant = "participant",
  approved = false,
  helperText,
  actions,
}: {
  title: string;
  description?: string | null;
  variant?: "participant" | "admin";
  approved?: boolean;
  helperText?: string;
  actions?: ReactNode;
}) {
  const isAdmin = variant === "admin";

  return (
    <Card elevated interactive={false} className="!overflow-hidden !p-0">
      <div className="flex flex-col gap-5 border-s-4 border-[var(--primary)] p-5 md:flex-row md:items-start md:gap-6 md:p-6">
        <div className="flex shrink-0 justify-center md:justify-start">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-[var(--primary-strong)] shadow-[var(--shadow-sm)]"
            aria-hidden
          >
            <CourseHeroIcon />
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.12em] text-[var(--primary-strong)]">
            {isAdmin ? "إدارة الدورة" : "مركز الدورة"}
          </p>
          <h1 className="page-title text-[var(--foreground)]">{title}</h1>
          {description ? (
            <p className="page-subtitle line-clamp-3 !max-w-none">{description}</p>
          ) : null}

          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/90 px-3 py-2.5 shadow-[var(--shadow-sm)] backdrop-blur-sm">
            <StatusBadge
              text={
                isAdmin
                  ? "صلاحيات الإدارة"
                  : approved
                    ? arCopy.templates.success(arCopy.glossary.enrollmentApproval)
                    : `قيد ${arCopy.glossary.enrollmentApproval}`
              }
              tone={isAdmin ? "info" : approved ? "success" : "warning"}
            />
          </div>

          {isAdmin && helperText ? (
            <p className="text-sm text-[var(--text-muted)]">{helperText}</p>
          ) : !isAdmin && approved && helperText ? (
            <p className="text-sm text-[var(--text-muted)]">{helperText}</p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
