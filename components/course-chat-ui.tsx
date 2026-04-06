import Link from "next/link";
import type { ReactNode } from "react";
import { Card } from "@/components/ui";
import { ChatScrollStickiness } from "@/components/chat-scroll-stickiness";

export const chatComposerFormClass =
  "flex w-full flex-col gap-3 md:flex-row md:items-end md:gap-4";

export function sameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatChatTime(d: Date): string {
  return d.toLocaleString("ar-SA", {
    hour: "2-digit",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  });
}

export function formatChatDay(d: Date): string {
  return d.toLocaleDateString("ar-SA", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function chatNameInitials(name: string): string {
  const t = name.trim();
  if (!t) return "?";
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0].charAt(0);
    const b = parts[parts.length - 1].charAt(0);
    return (a + b).toUpperCase();
  }
  return t.slice(0, 2);
}

export function ChatThreadCard({
  header,
  children,
  className = "",
}: {
  header: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card elevated interactive={false} className={`flex flex-col overflow-hidden p-0 ${className}`}>
      <div className="border-b border-[var(--border)] bg-[var(--surface-muted)]/40 px-4 py-2.5 text-xs text-[var(--text-muted)]">
        {header}
      </div>
      {children}
    </Card>
  );
}

export function ChatScrollBody({
  children,
  scrollAreaId,
  messageCount,
}: {
  children: ReactNode;
  scrollAreaId?: string;
  messageCount?: number;
}) {
  return (
    <div
      id={scrollAreaId}
      className="flex min-h-[12rem] flex-1 flex-col gap-3 overflow-y-auto bg-[var(--surface-muted)]/25 p-4"
      role="log"
      aria-live="polite"
      aria-relevant="additions text"
    >
      {children}
      {scrollAreaId && typeof messageCount === "number" ? (
        <ChatScrollStickiness scrollAreaId={scrollAreaId} messageCount={messageCount} />
      ) : null}
    </div>
  );
}

export function ChatDayDivider({ label }: { label: string }) {
  return (
    <div className="flex shrink-0 justify-center py-1">
      <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-medium text-[var(--text-muted)]">
        {label}
      </span>
    </div>
  );
}

export function ChatBubble({
  align,
  variant,
  body,
  timeLabel,
  roleLabel,
}: {
  align: "start" | "end";
  variant: "sent" | "received";
  body: string;
  timeLabel: string;
  roleLabel: string;
}) {
  const items = align === "end" ? "items-end" : "items-start";
  const bubble =
    variant === "sent"
      ? "rounded-2xl rounded-br-md bg-[var(--primary)] text-white shadow-[var(--shadow-md)]"
      : "rounded-2xl rounded-bl-md border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] shadow-[var(--shadow-sm)]";

  return (
    <div className={`flex w-full flex-col gap-0.5 ${items}`}>
      <p className="max-w-[min(85%,20rem)] truncate px-0.5 text-[11px] font-semibold tracking-wide text-[var(--text-muted)]">
        {roleLabel}
      </p>
      <div className={`max-w-[min(85%,20rem)] px-3.5 py-2.5 text-sm leading-relaxed ${bubble}`}>
        <p className="whitespace-pre-wrap break-words">{body}</p>
        <p
          className={`mt-1.5 text-[10px] tabular-nums ${variant === "sent" ? "text-white/75" : "text-[var(--text-muted)]"}`}
          dir="ltr"
        >
          {timeLabel}
        </p>
      </div>
    </div>
  );
}

function ChatEmptyIcon() {
  return (
    <svg className="mx-auto h-10 w-10 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );
}

export function ChatThreadEmpty({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center">
      <ChatEmptyIcon />
      <div className="max-w-sm space-y-1">
        <p className="text-base font-semibold text-[var(--foreground)]">{title}</p>
        <p className="text-sm leading-relaxed text-[var(--text-muted)]">{text}</p>
      </div>
    </div>
  );
}

export function ChatComposerCard({ children }: { children: ReactNode }) {
  return <Card elevated className="p-4 md:p-5">{children}</Card>;
}

export function ParticipantPillLink({
  href,
  name,
  selected,
}: {
  href: string;
  name: string;
  selected: boolean;
}) {
  const initials = chatNameInitials(name);
  return (
    <Link
      href={href}
      scroll={false}
      className={`inline-flex shrink-0 touch-manipulation items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 ${
        selected
          ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary-strong)] ring-2 ring-[var(--primary)] ring-offset-2 ring-offset-[var(--surface)]"
          : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-muted)]"
      }`}
    >
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)] text-xs font-bold text-[var(--primary-strong)]"
        aria-hidden
      >
        {initials}
      </span>
      <span className="max-w-[12rem] truncate">{name}</span>
    </Link>
  );
}
