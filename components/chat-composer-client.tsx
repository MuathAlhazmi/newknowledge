"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { CHAT_ACTION_IDLE, type ChatActionState } from "@/components/chat-types";
import type { ReactNode } from "react";
import { arCopy } from "@/lib/copy/ar";
import { snackbarError, snackbarSuccess } from "@/lib/snackbar";
import { useOnSerialChange } from "@/lib/use-on-serial-change";

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
  onSendSuccess,
  className,
  textareaId,
  textareaName,
  label,
  placeholder,
  submitLabel,
  hiddenFields,
}: {
  action: (prev: ChatActionState, formData: FormData) => Promise<ChatActionState>;
  onSendSuccess?: () => void;
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

  useOnSerialChange(JSON.stringify(state), () => {
    if (state.submittedAt === 0) return;
    if (state.ok) snackbarSuccess(state.message);
    else snackbarError(state.message);
  });

  useEffect(() => {
    if (state.ok && state.submittedAt > 0) {
      formRef.current?.reset();
      onSendSuccess?.();
    }
  }, [state, onSendSuccess]);

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
      <p className="sr-only" aria-live="polite">
        {pending ? arCopy.templates.pending("إرسال الرسالة") : state.message || ""}
      </p>
    </form>
  );
}
