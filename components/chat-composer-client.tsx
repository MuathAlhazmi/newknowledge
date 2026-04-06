"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { CHAT_ACTION_IDLE, type ChatActionState } from "@/components/chat-types";
import type { ReactNode } from "react";
import { arCopy } from "@/lib/copy/ar";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="nk-btn nk-btn-primary h-11 w-full shrink-0 px-6 disabled:cursor-not-allowed disabled:opacity-60 md:min-w-[9rem] md:w-auto"
      aria-disabled={pending}
      disabled={pending}
    >
      {pending ? arCopy.templates.pending("الإرسال") : label}
    </button>
  );
}

export function ChatComposerClient({
  action,
  className,
  textareaId,
  textareaName,
  label,
  placeholder,
  submitLabel,
  hiddenFields,
}: {
  action: (prev: ChatActionState, formData: FormData) => Promise<ChatActionState>;
  className: string;
  textareaId: string;
  textareaName: string;
  label: string;
  placeholder: string;
  submitLabel: string;
  hiddenFields?: ReactNode;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(action, CHAT_ACTION_IDLE);

  useEffect(() => {
    if (state.ok && state.submittedAt > 0) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="grid gap-2">
      <div className={className}>
        {hiddenFields}
        <div className="grid min-w-0 flex-1 gap-2">
          <label htmlFor={textareaId} className="text-sm font-semibold text-[var(--foreground)]">
            {label}
          </label>
          <textarea
            id={textareaId}
            name={textareaName}
            rows={3}
            required
            placeholder={placeholder}
            className="min-h-[5.5rem] resize-y"
            disabled={pending}
            aria-disabled={pending}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                formRef.current?.requestSubmit();
              }
            }}
          />
        </div>
        <SubmitButton label={submitLabel} />
      </div>
      <p
        aria-live="polite"
        className={`text-xs ${state.ok ? "text-[var(--text-muted)]" : "text-red-600"}`}
      >
        {pending ? arCopy.templates.pending("إرسال الرسالة") : state.message || " "}
      </p>
    </form>
  );
}
