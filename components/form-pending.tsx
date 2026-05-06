"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

type PendingSubmitButtonProps = {
  idleText: string;
  pendingText: string;
  className?: string;
  disabled?: boolean;
  name?: string;
  value?: string;
};

export function PendingSubmitButton({
  idleText,
  pendingText,
  className,
  disabled = false,
  name,
  value,
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" name={name} value={value} disabled={disabled || pending} className={className}>
      {pending ? pendingText : idleText}
    </button>
  );
}

export function PendingFormOverlay({
  text = "جارٍ المعالجة...",
  variant = "modal",
}: {
  text?: string;
  variant?: "modal" | "progress";
}) {
  const { pending } = useFormStatus();
  if (!pending) return null;

  if (variant === "progress") {
    return (
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20">
        <div className="h-1 w-full overflow-hidden rounded-t-xl bg-[var(--surface-muted)]">
          <div className="h-full w-full animate-pulse bg-[var(--primary)]" />
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl bg-black/40 backdrop-blur-[2px]">
      <div className="nk-card flex items-center gap-2 !p-3 text-sm font-medium text-[var(--foreground)]">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" />
        <span>{text}</span>
      </div>
    </div>
  );
}

export function PendingFieldset({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <fieldset disabled={pending} className={className}>
      {children}
    </fieldset>
  );
}

