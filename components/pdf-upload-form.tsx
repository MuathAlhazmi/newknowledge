"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveCourseMaterialAction } from "@/app/admin/(instructor)/courses/[courseId]/materials/actions";
import { arCopy } from "@/lib/copy/ar";
import { snackbarError, snackbarSuccess } from "@/lib/snackbar";

const u = arCopy.materialUpload;

function uploadErrorMessage(code: string | undefined): string {
  switch (code) {
    case "NOT_PDF":
      return u.errors.notPdf;
    case "FILE_TOO_LARGE":
      return u.errors.tooLarge;
    case "INVALID_PDF":
      return u.errors.invalidPdf;
    default:
      return u.errors.generic;
  }
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n.toLocaleString("ar-SA")} بايت`;
  if (n < 1024 * 1024)
    return `${(n / 1024).toLocaleString("ar-SA", { maximumFractionDigits: 1 })} ك.ب`;
  return `${(n / (1024 * 1024)).toLocaleString("ar-SA", { maximumFractionDigits: 1 })} م.ب`;
}

function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <span
      className={`inline-block shrink-0 rounded-full border-2 border-[var(--border)] border-t-[var(--primary)] ${className} motion-safe:animate-spin`}
      aria-hidden
    />
  );
}

type StepStatus = "pending" | "current" | "done";

function StepDotFixed({ status, label, stepNum }: { status: StepStatus; label: string; stepNum: number }) {
  return (
    <div className="relative z-10 flex min-w-0 shrink-0 flex-col items-center gap-1.5 text-center">
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold shadow-[0_0_0_3px_var(--background)] transition-all duration-200 ${
          status === "done"
            ? "bg-emerald-600 text-white shadow-sm"
            : status === "current"
              ? "bg-[var(--primary)] text-white ring-2 ring-[var(--primary)]/30"
              : "bg-[var(--surface-muted)] text-[var(--text-muted)]"
        }`}
      >
        {status === "done" ? "✓" : stepNum}
      </span>
      <span
        className={`max-w-[5.5rem] text-[0.65rem] font-medium leading-tight sm:max-w-none sm:text-xs ${
          status === "current" ? "text-[var(--foreground)]" : "text-[var(--text-muted)]"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function StepConnector({ active }: { active: boolean }) {
  return (
    <div
      className={`relative top-[1.125rem] z-0 mx-0.5 h-0.5 min-w-[0.5rem] flex-1 rounded-full ${
        active ? "bg-emerald-500/90" : "bg-[var(--border)]"
      }`}
      aria-hidden
    />
  );
}

export function PdfUploadForm({ courseId, canEdit = true }: { courseId: string; canEdit?: boolean }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [pdfPath, setPdfPath] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [message, setMessage] = useState("");
  const [messageOk, setMessageOk] = useState(false);
  const [savePending, startSaveTransition] = useTransition();

  const hasStoragePath = Boolean(pdfPath);
  const previewReady = hasStoragePath && Boolean(title.trim());

  const step1Status: StepStatus = hasStoragePath ? "done" : "current";
  const step2Status: StepStatus = !hasStoragePath ? "pending" : previewReady ? "done" : "current";
  const step3Status: StepStatus = previewReady ? "current" : "pending";

  const step1DoneForUpload = Boolean(title.trim() && file);

  const resetFlow = useCallback(() => {
    setTitle("");
    setPdfPath("");
    setFile(null);
    setMessage("");
    setMessageOk(false);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const pickPdf = useCallback((f: File | null) => {
    if (!f) {
      setFile(null);
      setPdfPath("");
      setMessage("");
      setMessageOk(false);
      return;
    }
    const isPdf = f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      snackbarError(u.errors.notPdf);
      setMessage(u.errors.notPdf);
      setMessageOk(false);
      return;
    }
    setFile(f);
    setPdfPath("");
    setMessage("");
    setMessageOk(false);
  }, []);

  async function uploadThenSubmit() {
    if (!file || !title.trim()) {
      if (!title.trim()) snackbarError(u.needTitle);
      else snackbarError(u.needFile);
      return;
    }
    setUploading(true);
    setMessage("");
    setMessageOk(false);
    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: uploadData });
      const body = (await res.json()) as { path?: string; code?: string };
      if (!res.ok) {
        const err = uploadErrorMessage(body.code);
        setMessage(err);
        snackbarError(err);
        return;
      }
      if (!body.path) {
        setMessage(u.errors.generic);
        snackbarError(u.errors.generic);
        return;
      }
      setPdfPath(body.path);
      setMessageOk(true);
      setMessage(u.afterUpload);
      snackbarSuccess(u.afterUpload);
    } catch {
      setMessage(u.errors.generic);
      snackbarError(u.errors.generic);
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0] ?? null;
    pickPdf(f);
  }

  function handleSave() {
    if (!title.trim() || !pdfPath) {
      snackbarError(u.errors.saveValidation);
      return;
    }
    startSaveTransition(async () => {
      const result = await saveCourseMaterialAction(courseId, title, pdfPath);
      if (!result.ok) {
        const err =
          result.error === "saveValidation" ? u.errors.saveValidation : u.errors.saveFailed;
        snackbarError(err);
        setMessage(err);
        setMessageOk(false);
        return;
      }
      snackbarSuccess(u.saveSuccess);
      resetFlow();
      router.refresh();
    });
  }

  if (!canEdit) {
    return (
      <div className="nk-card nk-card-elevated p-4 text-sm text-[var(--text-muted)]">
        لديك صلاحية عرض فقط لهذه الدورة؛ لا يمكن رفع مواد جديدة.
      </div>
    );
  }

  const busy = uploading || savePending;
  const canUpload = step1DoneForUpload && !uploading;
  const canSave = Boolean(title.trim() && pdfPath) && !savePending && !uploading;

  return (
    <div className="nk-card nk-card-elevated grid gap-5 p-4 md:p-5">
      <div className="relative flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-[var(--foreground)]">{u.sectionTitle}</p>
        {(step1DoneForUpload || pdfPath) && !busy ? (
          <button
            type="button"
            onClick={resetFlow}
            className="text-xs font-medium text-[var(--primary)] underline-offset-2 hover:underline"
          >
            {u.resetAddAnother}
          </button>
        ) : null}
      </div>

      {/* Stepper: connectors sit below circle vertical center on sm+; circles use z-10 + ring over line */}
      <div className="flex w-full items-start justify-between gap-0 sm:items-center">
        <StepDotFixed status={step1Status} label={u.step1} stepNum={1} />
        <StepConnector active={hasStoragePath} />
        <StepDotFixed status={step2Status} label={u.step2} stepNum={2} />
        <StepConnector active={previewReady} />
        <StepDotFixed status={step3Status} label={u.step3} stepNum={3} />
      </div>

      <label className="grid gap-1.5 text-sm">
        <span className="font-medium text-[var(--foreground)]">{u.titleLabel}</span>
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (message && !messageOk) setMessage("");
          }}
          placeholder={u.titlePlaceholder}
          disabled={busy}
          className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 transition-opacity disabled:opacity-60"
        />
      </label>

      <div className="grid gap-2">
        <span className="text-sm font-medium text-[var(--foreground)]">{u.pdfLabel}</span>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          disabled={busy}
          onChange={(e) => pickPdf(e.target.files?.[0] ?? null)}
        />
        <div
          role="button"
          tabIndex={busy ? -1 : 0}
          aria-disabled={busy}
          aria-label={u.dropHint}
          onDragEnter={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false);
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => !busy && inputRef.current?.click()}
          onKeyDown={(e) => {
            if (busy) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          className={`group relative flex min-h-[9rem] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-all duration-200 motion-reduce:transition-none ${
            busy ? "pointer-events-none opacity-50" : "cursor-pointer"
          } ${
            dragOver
              ? "border-[var(--primary)] bg-[var(--primary)]/10 scale-[1.01]"
              : "border-[var(--border)] bg-[var(--surface-muted)]/40 outline-none hover:border-[var(--primary)]/50 hover:bg-[var(--surface-muted)]/70 focus-visible:ring-2 focus-visible:ring-[var(--primary)]/40"
          }`}
        >
          {uploading ? (
            <>
              <Spinner className="h-8 w-8 border-[3px]" />
              <span className="text-sm font-medium text-[var(--foreground)]">{u.uploadPending}</span>
            </>
          ) : file ? (
            <>
              <span className="rounded-full bg-[var(--primary)]/15 px-3 py-1 text-xs font-semibold text-[var(--primary-strong)]">
                {pdfPath ? u.uploadedBadge : u.fileReady}
              </span>
              <span className="max-w-full truncate text-sm font-medium text-[var(--foreground)]" dir="ltr">
                {file.name}
              </span>
              <span className="text-xs text-[var(--text-muted)]">{formatBytes(file.size)}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  pickPdf(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
                className="text-xs text-rose-600 underline-offset-2 hover:underline"
              >
                {u.removeFile}
              </button>
            </>
          ) : (
            <>
              <span
                className="flex h-12 w-10 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--background)] text-xs font-bold text-[var(--primary-strong)] shadow-sm transition-transform duration-200 group-hover:scale-105 motion-reduce:transition-none"
                aria-hidden
              >
                PDF
              </span>
              <span className="text-sm text-[var(--foreground)]">{dragOver ? u.dropActiveHint : u.dropHint}</span>
              <span className="pointer-events-none rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)]">
                {u.browseFiles}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void uploadThenSubmit()}
          disabled={!canUpload}
          className="nk-btn nk-btn-secondary inline-flex items-center gap-2 disabled:opacity-50"
        >
          {uploading ? <Spinner /> : null}
          {uploading ? u.uploadPending : u.uploadButton}
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="nk-btn nk-btn-primary inline-flex items-center gap-2 disabled:opacity-50"
        >
          {savePending ? <Spinner /> : null}
          {savePending ? u.savePending : u.saveMaterial}
        </button>
      </div>

      {message ? (
        <p
          className={`text-sm transition-colors duration-200 ${messageOk ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}
          role="status"
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
