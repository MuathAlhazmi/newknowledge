import type { ReactNode } from "react";
import type { HTMLAttributes } from "react";

export function PageHeader({
  title,
  subtitle,
  eyebrow,
  actions,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="nk-fade-in flex w-full flex-col gap-3 md:flex-row md:items-end md:justify-between md:gap-6">
      <div className="min-w-0 flex-1">
        {eyebrow ? <p className="page-eyebrow nk-slide-in mb-1">{eyebrow}</p> : null}
        <h1 className="page-title nk-slide-in">{title}</h1>
        {subtitle ? <p className="page-subtitle nk-slide-in nk-stagger-1 mt-1.5">{subtitle}</p> : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 nk-slide-in nk-stagger-1">{actions}</div>
      ) : null}
    </div>
  );
}

export function Card({
  children,
  className = "",
  elevated = false,
  interactive = true,
  variant = "default",
  ...props
}: {
  children: ReactNode;
  className?: string;
  elevated?: boolean;
  interactive?: boolean;
  variant?: "default" | "muted" | "highlight";
} & HTMLAttributes<HTMLDivElement>) {
  const variantClass =
    variant === "muted" ? "nk-card-muted" : variant === "highlight" ? "nk-card-highlight" : "";
  return (
    <div
      className={`nk-card nk-fade-in p-4 ${variantClass} ${elevated ? "nk-card-elevated" : ""} ${interactive ? "nk-hover-lift nk-hover-glow" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function WarningCard({ children }: { children: ReactNode }) {
  return <div className="nk-card nk-card-warning nk-fade-in p-4">{children}</div>;
}

function EmptyIcon() {
  return (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.75" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-2.172a1 1 0 01-.707-.293L8.293 13.293A1 1 0 007.586 13H5"
      />
    </svg>
  );
}

export function EmptyState({
  text,
  title,
  children,
}: {
  text: string;
  title?: string;
  children?: ReactNode;
}) {
  return (
    <Card interactive={false} className="py-8 text-center">
      <div className="nk-empty-icon" aria-hidden>
        <EmptyIcon />
      </div>
      {title ? <p className="mb-1 text-base font-semibold text-[var(--foreground)]">{title}</p> : null}
      <p className="mx-auto max-w-sm text-sm text-[var(--text-muted)]">{text}</p>
      {children ? <div className="mt-4 flex justify-center gap-2">{children}</div> : null}
    </Card>
  );
}

export function StatusBadge({
  text,
  tone = "muted",
  interactive = false,
}: {
  text: string;
  tone?: "muted" | "success" | "info" | "warning";
  interactive?: boolean;
}) {
  const toneClass =
    tone === "success"
      ? "nk-badge-success"
      : tone === "info"
        ? "nk-badge-info"
        : tone === "warning"
          ? "nk-badge-warning"
          : "nk-badge-muted";
  return <span className={`nk-badge ${toneClass} ${interactive ? "nk-hover-lift" : ""}`}>{text}</span>;
}
