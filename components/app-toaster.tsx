"use client";

import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      dir="rtl"
      position="top-center"
      richColors
      closeButton
      className="font-sans"
      toastOptions={{
        classNames: {
          toast:
            "group font-sans border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--foreground)] text-sm shadow-[var(--shadow-md)]",
          title: "font-sans font-semibold",
          description: "font-sans text-[var(--text-muted)]",
          actionButton: "font-sans bg-[var(--primary)] text-white",
          cancelButton: "font-sans bg-[var(--surface-muted)]",
          closeButton:
            "font-sans border-[var(--border)] bg-[var(--surface-muted)] text-[var(--foreground)] hover:bg-[var(--border)]",
        },
      }}
    />
  );
}
