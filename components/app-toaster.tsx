"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      dir="rtl"
      position="top-center"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "group border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--foreground)] text-sm shadow-[var(--shadow-md)]",
          title: "font-semibold",
          description: "text-[var(--text-muted)]",
          actionButton: "bg-[var(--primary)] text-white",
          cancelButton: "bg-[var(--surface-muted)]",
          closeButton:
            "border-[var(--border)] bg-[var(--surface-muted)] text-[var(--foreground)] hover:bg-[var(--border)]",
        },
      }}
    />
  );
}
