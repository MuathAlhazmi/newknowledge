"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteMaterialAction,
  replaceMaterialPdfAction,
  updateMaterialTitleAction,
} from "@/app/admin/(instructor)/courses/[courseId]/materials/actions";
import { arCopy } from "@/lib/copy/ar";
import { Card } from "@/components/ui";
import { snackbarError, snackbarSuccess } from "@/lib/snackbar";

const mu = arCopy.materialUpload;
const ma = arCopy.materialsAdmin;

export type MaterialRow = { id: string; title: string; pdfPath: string };

function uploadErrorMessage(code: string | undefined): string {
  switch (code) {
    case "NOT_PDF":
      return mu.errors.notPdf;
    case "FILE_TOO_LARGE":
      return mu.errors.tooLarge;
    case "INVALID_PDF":
      return mu.errors.invalidPdf;
    default:
      return mu.errors.generic;
  }
}

function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <span
      className={`inline-block shrink-0 rounded-full border-2 border-[var(--border)] border-t-[var(--primary)] ${className} motion-safe:animate-spin`}
      aria-hidden
    />
  );
}

function EditTitleDialog({
  courseId,
  material,
  onClose,
}: {
  courseId: string;
  material: MaterialRow;
  onClose: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(material.title);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setTitle(material.title);
  }, [material]);

  function save() {
    const t = title.trim();
    if (!t) return;
    startTransition(async () => {
      const r = await updateMaterialTitleAction(courseId, material.id, t);
      if (!r.ok) {
        snackbarError(
          r.error === "notFound" ? ma.errors.notFound : r.error === "validation" ? mu.errors.saveValidation : ma.errors.titleUpdate,
        );
        return;
      }
      snackbarSuccess(ma.titleSaved);
      onClose();
      router.refresh();
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-material-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <Card
        elevated
        interactive={false}
        className="relative z-10 w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grid gap-4 p-5">
          <h2 id="edit-material-title" className="text-base font-bold text-[var(--foreground)]">
            {ma.editTitle}
          </h2>
          <label className="grid gap-1 text-sm">
            <span>{mu.titleLabel}</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2"
              maxLength={300}
            />
          </label>
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" className="nk-btn nk-btn-secondary text-sm" onClick={onClose} disabled={pending}>
              {ma.cancel}
            </button>
            <button
              type="button"
              className="nk-btn nk-btn-primary inline-flex items-center gap-2 text-sm"
              onClick={save}
              disabled={pending || !title.trim()}
            >
              {pending ? <Spinner /> : null}
              {ma.saveTitle}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function ReplacePdfDialog({
  courseId,
  material,
  onClose,
}: {
  courseId: string;
  material: MaterialRow;
  onClose: () => void;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function apply() {
    if (!file) {
      snackbarError(mu.needFile);
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const body = (await res.json()) as { path?: string; code?: string };
      if (!res.ok || !body.path) {
        snackbarError(uploadErrorMessage(body.code));
        return;
      }
      const r = await replaceMaterialPdfAction(courseId, material.id, body.path);
      if (!r.ok) {
        snackbarError(
          r.error === "notFound" ? ma.errors.notFound : r.error === "validation" ? mu.errors.saveValidation : ma.errors.replace,
        );
        return;
      }
      snackbarSuccess(ma.replaced);
      onClose();
      router.refresh();
    } catch {
      snackbarError(mu.errors.generic);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="replace-material-pdf"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <Card
        elevated
        interactive={false}
        className="relative z-10 w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grid gap-4 p-5">
          <h2 id="replace-material-pdf" className="text-base font-bold text-[var(--foreground)]">
            {ma.replaceModalTitle}
          </h2>
          <p className="text-sm text-[var(--text-muted)]">{ma.replaceModalHint}</p>
          <p className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]/40 px-3 py-2 text-sm font-medium text-[var(--foreground)]">
            {material.title}
          </p>
          <input
            type="file"
            accept="application/pdf,.pdf"
            className="text-sm"
            disabled={busy}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" className="nk-btn nk-btn-secondary text-sm" onClick={onClose} disabled={busy}>
              {ma.cancel}
            </button>
            <button
              type="button"
              className="nk-btn nk-btn-primary inline-flex items-center gap-2 text-sm"
              onClick={() => void apply()}
              disabled={busy || !file}
            >
              {busy ? <Spinner /> : null}
              {busy ? ma.replacing : ma.applyReplace}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export function MaterialsAdminTable({
  courseId,
  materials,
  canEdit,
}: {
  courseId: string;
  materials: MaterialRow[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<MaterialRow | null>(null);
  const [replacing, setReplacing] = useState<MaterialRow | null>(null);
  const [deletePending, startDelete] = useTransition();

  function confirmDelete(m: MaterialRow) {
    if (!window.confirm(ma.confirmDelete)) return;
    startDelete(async () => {
      const r = await deleteMaterialAction(courseId, m.id);
      if (!r.ok) {
        snackbarError(
          r.error === "notFound" ? ma.errors.notFound : ma.errors.delete,
        );
        return;
      }
      snackbarSuccess(ma.deleted);
      router.refresh();
    });
  }

  if (materials.length === 0) {
    return null;
  }

  if (!canEdit) {
    return (
      <section className="nk-section !my-0">
        <header className="mb-4 max-w-3xl">
          <h2 className="nk-section-title !mb-1">{ma.listTitle}</h2>
          <p className="text-sm leading-relaxed text-[var(--text-muted)]">{ma.listSubtitle}</p>
        </header>
        <ul className="grid gap-3">
          {materials.map((m) => (
            <li key={m.id}>
              <Card
                elevated
                interactive={false}
                className="border-s-4 border-s-[var(--primary)]/80 p-4 shadow-[var(--shadow-sm)]"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-[var(--foreground)]">{m.title}</p>
                    <a
                      href={m.pdfPath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex w-fit items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm font-medium text-[var(--primary-strong)] transition-colors hover:border-[var(--primary)]/40 hover:bg-[var(--primary-soft)]/50"
                    >
                      <span
                        className="flex h-7 w-6 shrink-0 items-center justify-center rounded border border-[var(--border)] bg-[var(--background)] text-[0.65rem] font-bold text-[var(--primary-strong)]"
                        aria-hidden
                      >
                        PDF
                      </span>
                      {ma.openFile}
                    </a>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <>
      <section className="nk-section !my-0">
        <header className="mb-4 max-w-3xl">
          <h2 className="nk-section-title !mb-1">{ma.listTitle}</h2>
          <p className="text-sm leading-relaxed text-[var(--text-muted)]">
            {ma.listSubtitle}{" "}
            {ma.listSubtitleEditor}
          </p>
        </header>
        <ul className="grid gap-3">
          {materials.map((m) => (
            <li key={m.id}>
              <Card
                elevated
                interactive={false}
                className="border-s-4 border-s-[var(--primary)]/80 p-4 shadow-[var(--shadow-sm)]"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold text-[var(--foreground)]">{m.title}</p>
                    <a
                      href={m.pdfPath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex w-fit items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm font-medium text-[var(--primary-strong)] transition-colors hover:border-[var(--primary)]/40 hover:bg-[var(--primary-soft)]/50"
                    >
                      <span
                        className="flex h-7 w-6 shrink-0 items-center justify-center rounded border border-[var(--border)] bg-[var(--background)] text-[0.65rem] font-bold text-[var(--primary-strong)]"
                        aria-hidden
                      >
                        PDF
                      </span>
                      {ma.openFile}
                    </a>
                  </div>
                  <div className="flex flex-wrap gap-2 border-t border-[var(--border-muted-edge)] pt-3 lg:border-t-0 lg:pt-0">
                    <button
                      type="button"
                      className="nk-btn nk-btn-secondary text-xs sm:text-sm"
                      onClick={() => setEditing(m)}
                    >
                      {ma.editTitle}
                    </button>
                    <button
                      type="button"
                      className="nk-btn nk-btn-secondary text-xs sm:text-sm"
                      onClick={() => setReplacing(m)}
                    >
                      {ma.replacePdf}
                    </button>
                    <button
                      type="button"
                      className="nk-btn nk-btn-secondary text-xs text-rose-700 sm:text-sm hover:bg-rose-50 dark:hover:bg-rose-950/30"
                      onClick={() => confirmDelete(m)}
                      disabled={deletePending}
                    >
                      {ma.delete}
                    </button>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </section>
      {editing ? (
        <EditTitleDialog courseId={courseId} material={editing} onClose={() => setEditing(null)} />
      ) : null}
      {replacing ? (
        <ReplacePdfDialog courseId={courseId} material={replacing} onClose={() => setReplacing(null)} />
      ) : null}
    </>
  );
}
