"use client";

import { MaterialKind } from "@prisma/client";
import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { saveCourseMaterialAction } from "@/app/admin/(instructor)/courses/[courseId]/materials/actions";
import { arCopy } from "@/lib/copy/ar";
import { Card } from "@/components/ui";
import { snackbarError, snackbarSuccess } from "@/lib/snackbar";

const u = arCopy.materialUpload;

function detectUploadKind(file: File): MaterialKind | null {
  const name = file.name.toLowerCase();
  if (name.endsWith(".docx")) return MaterialKind.DOCX;
  if (name.endsWith(".pdf")) return MaterialKind.PDF;
  const mime = (file.type || "").toLowerCase();
  if (mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return MaterialKind.DOCX;
  }
  if (mime === "application/pdf") return MaterialKind.PDF;
  return null;
}

function uploadErrorMessage(code: string | undefined): string {
  switch (code) {
    case "UNSUPPORTED_TYPE":
      return u.errors.unsupportedType;
    case "KIND_MISMATCH":
      return u.errors.kindMismatch;
    case "NOT_PDF":
      return u.errors.notPdf;
    case "NOT_DOCX":
      return u.errors.notDocx;
    case "FILE_TOO_LARGE":
      return u.errors.tooLarge;
    case "INVALID_PDF":
      return u.errors.invalidPdf;
    case "INVALID_DOCX":
      return u.errors.invalidDocx;
    default:
      return u.errors.generic;
  }
}

/** Deterministic formatting (avoid `toLocaleString` SSR vs browser mismatches). */
function formatBytes(n: number): string {
  const trimFrac = (s: string) => s.replace(/\.0+$/, "").replace(/\.$/, "");
  if (n < 1024) return `${n} بايت`;
  if (n < 1024 * 1024) return `${trimFrac((n / 1024).toFixed(1))} ك.ب`;
  return `${trimFrac((n / (1024 * 1024)).toFixed(1))} م.ب`;
}

function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <span
      className={`inline-block shrink-0 rounded-full border-2 border-[var(--border)] border-t-[var(--primary)] ${className} motion-safe:animate-spin`}
      aria-hidden
    />
  );
}

export function PdfUploadForm({
  courseId,
  canEdit = true,
  folders = [],
}: {
  courseId: string;
  canEdit?: boolean;
  folders?: { id: string; label: string }[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [folderId, setFolderId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [message, setMessage] = useState("");

  const resetFlow = useCallback(() => {
    setTitle("");
    setFile(null);
    setMessage("");
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const fileAccept =
    "application/pdf,.pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  const pickFile = useCallback((f: File | null) => {
    if (!f) {
      setFile(null);
      setMessage("");
      return;
    }
    if (!detectUploadKind(f)) {
      snackbarError(u.errors.unsupportedType);
      setMessage(u.errors.unsupportedType);
      return;
    }
    setFile(f);
    setMessage("");
  }, []);

  async function addMaterial() {
    if (!title.trim()) {
      snackbarError(u.needTitle);
      return;
    }
    if (!file) {
      snackbarError(u.needFile);
      return;
    }
    setSubmitting(true);
    setMessage("");
    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: uploadData });
      const body = (await res.json()) as { path?: string; code?: string; kind?: string };
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

      const materialKind =
        body.kind === "docx"
          ? MaterialKind.DOCX
          : body.kind === "pdf"
            ? MaterialKind.PDF
            : detectUploadKind(file)!;

      const result = await saveCourseMaterialAction(
        courseId,
        title.trim(),
        body.path,
        materialKind,
        folderId.trim() || null,
      );
      if (!result.ok) {
        const err =
          result.error === "saveValidation" ? u.errors.saveValidation : u.errors.saveFailed;
        snackbarError(err);
        setMessage(err);
        return;
      }
      snackbarSuccess(u.saveSuccess);
      resetFlow();
      router.refresh();
    } catch {
      setMessage(u.errors.generic);
      snackbarError(u.errors.generic);
    } finally {
      setSubmitting(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0] ?? null;
    pickFile(f);
  }

  if (!canEdit) {
    return (
      <Card variant="muted" interactive={false} className="text-sm text-[var(--text-muted)]">
        لديك صلاحية عرض فقط لهذه الدورة؛ لا يمكن رفع مواد جديدة.
      </Card>
    );
  }

  const canSubmit = Boolean(title.trim() && file) && !submitting;
  const selectedKind = file ? detectUploadKind(file) : null;
  const kindBadge =
    selectedKind === MaterialKind.DOCX ? "DOCX" : selectedKind === MaterialKind.PDF ? "PDF" : u.dropFormatsBadge;
  const hasDraft = Boolean(title.trim() || file);

  return (
    <Card elevated interactive={false} className="grid gap-3.5 p-3 md:p-4">
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <h2 className="nk-section-title !mb-0">{u.sectionTitle}</h2>
          <p className="text-sm leading-snug text-[var(--text-muted)]">{u.sectionHint}</p>
        </div>
        {hasDraft && !submitting ? (
          <button type="button" onClick={resetFlow} className="nk-btn nk-btn-secondary shrink-0 text-xs sm:text-sm">
            {u.resetAddAnother}
          </button>
        ) : null}
      </div>

      {folders.length > 0 ? (
        <label className="grid max-w-xl gap-1.5 text-sm">
          <span className="font-medium">{u.folderLabel}</span>
          <select
            value={folderId}
            onChange={(e) => setFolderId(e.target.value)}
            disabled={submitting}
            className="max-w-xl disabled:opacity-60"
          >
            <option value="">{u.folderRoot}</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <label className="grid max-w-xl gap-1.5 text-sm">
        <span className="font-medium">{u.titleLabel}</span>
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (message) setMessage("");
          }}
          placeholder={u.titlePlaceholder}
          disabled={submitting}
          maxLength={300}
          className="max-w-xl disabled:opacity-60"
        />
      </label>

      <div className="grid gap-1.5 text-sm">
        <span className="font-medium">{u.fileLabel}</span>
        <input
          ref={inputRef}
          type="file"
          accept={fileAccept}
          className="sr-only"
          disabled={submitting}
          onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
        />
        <div
          role="button"
          tabIndex={submitting ? -1 : 0}
          aria-disabled={submitting}
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
          onClick={() => !submitting && inputRef.current?.click()}
          onKeyDown={(e) => {
            if (submitting) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          className={`group relative flex min-h-[8rem] w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-3 py-5 text-center transition-[border-color,background-color,box-shadow,transform] duration-200 motion-reduce:transition-none ${
            submitting ? "pointer-events-none opacity-50" : "cursor-pointer"
          } ${
            dragOver
              ? "border-[var(--primary)] bg-[var(--primary-soft)]/35 shadow-[var(--focus-ring)]"
              : "border-[var(--border)] bg-[var(--surface)] outline-none hover:border-[var(--primary)]/45 hover:bg-[var(--surface-muted)]/50 focus-visible:border-[var(--primary)] focus-visible:ring-2 focus-visible:ring-[var(--primary)]/35"
          }`}
        >
          {submitting ? (
            <>
              <Spinner className="h-8 w-8 border-[3px]" />
              <span className="text-sm font-medium text-[var(--foreground)]">{u.addMaterialPending}</span>
            </>
          ) : file ? (
            <>
              <span className="rounded-full border border-[var(--border)] bg-[var(--primary-soft)]/60 px-3 py-1 text-xs font-semibold text-[var(--primary-strong)]">
                {u.fileSelectedBadge}
              </span>
              <span className="max-w-full truncate text-sm font-medium text-[var(--foreground)]" dir="ltr">
                {file.name}
              </span>
              <span className="text-xs text-[var(--text-muted)]">{formatBytes(file.size)}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  pickFile(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
                className="nk-btn nk-btn-secondary text-xs"
              >
                {u.removeFile}
              </button>
            </>
          ) : (
            <>
              <span
                className="inline-flex min-h-11 min-w-11 max-w-[min(100%,12rem)] items-center justify-center whitespace-nowrap rounded-xl border border-[var(--border)] bg-[var(--background)] px-2.5 text-[0.7rem] font-bold leading-tight text-[var(--primary-strong)] shadow-sm transition-transform duration-200 group-hover:scale-[1.02] motion-reduce:transition-none sm:text-xs"
                aria-hidden
              >
                {kindBadge}
              </span>
              <span className="max-w-md text-sm text-[var(--foreground)]">
                {dragOver ? u.dropActiveHint : u.dropHint}
              </span>
              <span className="pointer-events-none rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]/50 px-3 py-2 text-xs font-medium text-[var(--foreground)]">
                {u.browseFiles}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--border-muted-edge)] pt-3">
        <button
          type="button"
          onClick={() => void addMaterial()}
          disabled={!canSubmit}
          className="nk-btn nk-btn-primary inline-flex min-w-[10rem] items-center justify-center gap-2 disabled:opacity-50"
        >
          {submitting ? <Spinner /> : null}
          {submitting ? u.addMaterialPending : u.addMaterialButton}
        </button>
      </div>

      {message ? (
        <div
          role="alert"
          className="rounded-lg border border-rose-200/80 bg-rose-50/80 px-3 py-2 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200"
        >
          {message}
        </div>
      ) : null}
    </Card>
  );
}
