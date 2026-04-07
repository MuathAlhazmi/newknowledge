import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/components/ui";
import { arCopy } from "@/lib/copy/ar";

export type CourseHubTileIcon =
  | "materials"
  | "exams"
  | "grades"
  | "zoom"
  | "chat"
  | "feedback"
  | "enrollments";

function TileIcon({ name }: { name: CourseHubTileIcon }) {
  const common = "h-6 w-6";
  switch (name) {
    case "materials":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      );
    case "exams":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      );
    case "grades":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      );
    case "zoom":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      );
    case "chat":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      );
    case "feedback":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
          />
        </svg>
      );
    case "enrollments":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      );
    default:
      return null;
  }
}

function Chevron() {
  return (
    <svg
      className="h-5 w-5 shrink-0 text-[var(--text-muted)] transition-transform duration-200 rtl:scale-x-[-1] ltr:group-hover:-translate-x-1 rtl:group-hover:translate-x-1"
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

function TileBody({
  title,
  description,
  badges,
  icon,
  enabled,
}: {
  title: string;
  description?: string;
  badges?: ReactNode;
  icon: CourseHubTileIcon;
  enabled: boolean;
}) {
  return (
    <div className="flex min-h-[7.5rem] w-full flex-col gap-3 text-start">
      <div className="flex w-full items-start justify-between gap-2">
        <span
          className={`flex rounded-xl p-2.5 ${
            enabled ? "bg-[var(--primary-soft)] text-[var(--primary-strong)]" : "bg-[var(--surface-muted)] text-[var(--text-muted)]"
          }`}
        >
          <TileIcon name={icon} />
        </span>
        {enabled ? <Chevron /> : null}
      </div>
      <div className="min-w-0 w-full flex-1 text-start">
        <p className="font-semibold text-[var(--foreground)]">{title}</p>
        {description ? (
          <p className="mt-1 line-clamp-2 text-sm leading-snug text-[var(--text-muted)]">{description}</p>
        ) : null}
        {badges ? <div className="mt-2 flex flex-wrap justify-start gap-2">{badges}</div> : null}
      </div>
      {enabled ? (
        <span className="text-xs font-bold text-[var(--primary-strong)]">{arCopy.buttons.start}</span>
      ) : (
        <span className="text-xs text-[var(--text-muted)]">يُتاح بعد {arCopy.glossary.enrollmentApproval}</span>
      )}
    </div>
  );
}

export function CourseHubTile({
  href,
  title,
  description,
  badges,
  icon,
  enabled,
}: {
  href: string;
  title: string;
  description?: string;
  badges?: ReactNode;
  icon: CourseHubTileIcon;
  enabled: boolean;
}) {
  if (!enabled) {
    return (
      <div className="h-full opacity-[0.65]" aria-disabled="true">
        <Card interactive={false} variant="muted" className="h-full">
          <TileBody title={title} description={description} badges={badges} icon={icon} enabled={false} />
        </Card>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="group nk-header-link block h-full rounded-[var(--radius-card)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]"
    >
      <Card elevated className="h-full transition-[transform,box-shadow] duration-200 group-hover:border-[var(--primary)]">
        <TileBody title={title} description={description} badges={badges} icon={icon} enabled />
      </Card>
    </Link>
  );
}
