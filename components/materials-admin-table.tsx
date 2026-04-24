"use client";

import type { ReactNode } from "react";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteMaterialAction,
  moveMaterialToFolderAction,
  updateMaterialTitleAction,
} from "@/app/admin/(instructor)/courses/[courseId]/materials/actions";
import { arCopy } from "@/lib/copy/ar";
import { Card } from "@/components/ui";
import { snackbarError, snackbarSuccess } from "@/lib/snackbar";

const mu = arCopy.materialUpload;
const ma = arCopy.materialsAdmin;

/** Matches Prisma `MaterialKind` (`schema.prisma`). Declared here so UI types do not depend on a generated `@prisma/client` enum export (avoids stale/missing client in the IDE). */
export type MaterialKind = "PDF" | "DOCX";

export type MaterialRow = { id: string; title: string; kind: MaterialKind; folderId: string | null };

function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <span
      className={`inline-block shrink-0 rounded-full border-2 border-[var(--border)] border-t-[var(--primary)] ${className} motion-safe:animate-spin`}
      aria-hidden
    />
  );
}

function kindBadge(kind: MaterialKind) {
  return kind === "PDF" ? ma.kindPdf : ma.kindDocx;
}

function KindPill({ kind }: { kind: MaterialKind }) {
  return (
    <span className="shrink-0 rounded-md border border-[var(--border)] bg-[var(--surface-muted)]/60 px-2 py-0.5 text-xs font-semibold tabular-nums text-[var(--text-muted)]">
      {kindBadge(kind)}
    </span>
  );
}

function OpenMaterialLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="nk-btn nk-btn-secondary inline-flex w-fit max-w-full items-center gap-2 text-sm"
    >
      <span className="inline-flex shrink-0 text-[var(--primary-strong)]" aria-hidden>
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
        </svg>
      </span>
      <span className="min-w-0 truncate">{children}</span>
    </a>
  );
}

function MaterialFolderPicker({
  courseId,
  material,
  folders,
}: {
  courseId: string;
  material: MaterialRow;
  folders: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [value, setValue] = useState(material.folderId ?? "");
  const [pending, startTransition] = useTransition();

  const unchanged = value === (material.folderId ?? "");

  function apply() {
    startTransition(async () => {
      const r = await moveMaterialToFolderAction(courseId, material.id, value.trim() || null);
      if (!r.ok) {
        snackbarError(r.error === "notFound" ? ma.errors.notFound : ma.errors.folderOp);
        return;
      }
      snackbarSuccess(ma.movedFolder);
      router.refresh();
    });
  }

  if (folders.length === 0) return null;

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)]/20 p-2 md:p-2.5">
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end sm:gap-3">
        <label className="grid min-w-0 gap-1.5 text-sm">
          <span className="font-medium text-[var(--foreground)]">{ma.moveFolderLabel}</span>
          <select
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={pending}
            className="w-full max-w-md disabled:opacity-60"
          >
            <option value="">{ma.moveFolderRoot}</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="nk-btn nk-btn-primary h-9 shrink-0 px-3 text-sm sm:w-auto"
          disabled={pending || unchanged}
          onClick={() => apply()}
        >
          {pending ? <Spinner /> : null}
          {ma.moveApply}
        </button>
      </div>
    </div>
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
        <div className="grid gap-3 p-4">
          <h2 id="edit-material-title" className="text-base font-bold text-[var(--foreground)]">
            {ma.editTitle}
          </h2>
          <label className="grid gap-2 text-sm">
            <span className="font-medium">{mu.titleLabel}</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={300} />
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

function MaterialsListShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="nk-section !my-0">
      <Card elevated interactive={false} className="overflow-hidden p-0">
        <header className="border-b border-[var(--border)] bg-[var(--surface-muted)]/15 px-3 py-2.5 md:px-4 md:py-3">
          <h2 className="nk-section-title !mb-0">{title}</h2>
          <p className="max-w-3xl text-sm leading-snug text-[var(--text-muted)]">{subtitle}</p>
        </header>
        <ul className="divide-y divide-[var(--border-muted-edge)]" role="list">
          {children}
        </ul>
      </Card>
    </section>
  );
}

export function MaterialsAdminTable({
  courseId,
  materials,
  folders,
  canEdit,
}: {
  courseId: string;
  materials: MaterialRow[];
  folders: { id: string; label: string }[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<MaterialRow | null>(null);
  const [deletePending, startDelete] = useTransition();

  function confirmDelete(m: MaterialRow) {
    if (!window.confirm(ma.confirmDelete)) return;
    startDelete(async () => {
      const r = await deleteMaterialAction(courseId, m.id);
      if (!r.ok) {
        snackbarError(r.error === "notFound" ? ma.errors.notFound : ma.errors.deleteMaterialFailed);
        return;
      }
      snackbarSuccess(ma.deleted);
      router.refresh();
    });
  }

  if (materials.length === 0) {
    return null;
  }

  function openHref(m: MaterialRow) {
    if (m.kind === "PDF") {
      return `/api/admin/courses/${courseId}/materials/${m.id}/pdf#toolbar=0`;
    }
    return `/api/admin/courses/${courseId}/materials/${m.id}/file`;
  }

  function openLabel(m: MaterialRow) {
    return m.kind === "PDF" ? ma.openFilePdf : ma.openFileDocx;
  }

  if (!canEdit) {
    return (
      <MaterialsListShell title={ma.listTitle} subtitle={ma.listSubtitle}>
        {materials.map((m) => (
          <li key={m.id} className="transition-colors motion-reduce:transition-none hover:bg-[var(--surface-muted)]/25">
            <div className="flex flex-col gap-2 px-3 py-2.5 md:flex-row md:items-center md:justify-between md:gap-4 md:px-4 md:py-3">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h3 className="text-base font-semibold leading-snug text-[var(--foreground)]">{m.title}</h3>
                  <KindPill kind={m.kind} />
                </div>
                <OpenMaterialLink href={openHref(m)}>{openLabel(m)}</OpenMaterialLink>
              </div>
            </div>
          </li>
        ))}
      </MaterialsListShell>
    );
  }

  return (
    <>
      <MaterialsListShell title={ma.listTitle} subtitle={`${ma.listSubtitle} ${ma.listSubtitleEditor}`}>
        {materials.map((m) => (
          <li key={m.id} className="transition-colors motion-reduce:transition-none hover:bg-[var(--surface-muted)]/25">
            <div className="grid gap-2.5 px-3 py-2.5 md:gap-3 md:px-4 md:py-3">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-5">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 className="text-base font-semibold leading-snug text-[var(--foreground)]">{m.title}</h3>
                    <KindPill kind={m.kind} />
                  </div>
                  <MaterialFolderPicker
                    key={`${m.id}-${m.folderId ?? ""}`}
                    courseId={courseId}
                    material={m}
                    folders={folders}
                  />
                  <OpenMaterialLink href={openHref(m)}>{openLabel(m)}</OpenMaterialLink>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2 border-t border-[var(--border-muted-edge)] pt-2 lg:border-t-0 lg:border-s lg:border-[var(--border-muted-edge)] lg:ps-4 lg:pt-0">
                  <button type="button" className="nk-btn nk-btn-secondary text-xs sm:text-sm" onClick={() => setEditing(m)}>
                    {ma.editTitle}
                  </button>
                  <button
                    type="button"
                    className="nk-btn nk-btn-secondary text-xs text-rose-700 sm:text-sm hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    onClick={() => confirmDelete(m)}
                    disabled={deletePending}
                  >
                    {ma.deleteMaterialButton}
                  </button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </MaterialsListShell>
      {editing ? (
        <EditTitleDialog courseId={courseId} material={editing} onClose={() => setEditing(null)} />
      ) : null}
    </>
  );
}
