"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createMaterialFolderAction,
  deleteMaterialFolderAction,
  renameMaterialFolderAction,
} from "@/app/admin/(instructor)/courses/[courseId]/materials/actions";
import { arCopy } from "@/lib/copy/ar";
import { buildMaterialFolderTree, type MaterialFolderTreeNode } from "@/lib/material-folder-tree";
import { Card } from "@/components/ui";
import { snackbarError, snackbarSuccess } from "@/lib/snackbar";

const mf = arCopy.materialsAdmin;

export type FolderRow = {
  id: string;
  name: string;
  parentId: string | null;
  label: string;
  sortOrder: number;
};

function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <span
      className={`inline-block shrink-0 rounded-full border-2 border-[var(--border)] border-t-[var(--primary)] ${className} motion-safe:animate-spin`}
      aria-hidden
    />
  );
}

function FolderGlyph({ depth }: { depth: number }) {
  const nested = depth > 0;
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-lg border ${
        nested
          ? "h-8 w-8 border-[var(--border)] bg-[var(--surface-muted)]/70 text-[var(--text-muted)]"
          : "h-9 w-9 border-[var(--primary)]/30 bg-[var(--primary-soft)]/50 text-[var(--primary-strong)]"
      }`}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        className={nested ? "h-4 w-4" : "h-[1.15rem] w-[1.15rem]"}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h4.09a1.5 1.5 0 0 1 1.11.49l1.06 1.17A1.5 1.5 0 0 0 11.91 9H19.5A1.5 1.5 0 0 1 21 10.5v7A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5v-10Z" />
      </svg>
    </span>
  );
}

function FolderBranch({
  node,
  depth,
  editingId,
  editName,
  setEditName,
  pending,
  setEditingId,
  onSaveRename,
  onRemove,
}: {
  node: MaterialFolderTreeNode<FolderRow>;
  depth: number;
  editingId: string | null;
  editName: string;
  setEditName: (v: string) => void;
  pending: boolean;
  setEditingId: (id: string | null) => void;
  onSaveRename: (folderId: string) => void;
  onRemove: (folderId: string) => void;
}) {
  const hasChildren = node.children.length > 0;
  const isRoot = depth === 0;
  const showPathHint = !isRoot && node.label !== node.name;

  return (
    <li className="min-w-0">
      <div
        className={`flex min-w-0 flex-col gap-2 rounded-xl border px-3 py-2.5 transition-[border-color,box-shadow,background-color] duration-200 sm:flex-row sm:items-center sm:justify-between sm:gap-2 sm:px-3 sm:py-3 ${
          isRoot
            ? "border-[var(--border)] bg-[var(--surface)] shadow-sm hover:border-[var(--primary)]/20"
            : "border-[var(--border)]/75 bg-[var(--background)]/95 hover:border-[var(--primary)]/15 hover:bg-[var(--surface)]/60"
        }`}
      >
        {editingId === node.id ? (
          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <FolderGlyph depth={depth} />
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="min-w-0 flex-1 text-sm sm:max-w-md"
                maxLength={200}
                autoFocus
              />
            </div>
            <div className="flex flex-wrap gap-2 sm:shrink-0">
              <button
                type="button"
                className="nk-btn nk-btn-primary text-xs sm:text-sm"
                disabled={pending || !editName.trim()}
                onClick={() => onSaveRename(node.id)}
              >
                {mf.saveFolderName}
              </button>
              <button
                type="button"
                className="nk-btn nk-btn-secondary text-xs sm:text-sm"
                disabled={pending}
                onClick={() => setEditingId(null)}
              >
                {mf.cancelFolderEdit}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex min-w-0 flex-1 items-start gap-2 sm:items-center">
              <FolderGlyph depth={depth} />
              <div className="grid min-w-0 flex-1 gap-0.5">
                <span
                  className={`break-words font-medium leading-snug text-[var(--foreground)] ${
                    isRoot ? "text-sm sm:text-base" : "text-sm"
                  }`}
                >
                  {node.name}
                </span>
                {showPathHint ? (
                  <span className="text-xs leading-relaxed text-[var(--text-muted)]" title={node.label}>
                    {node.label}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:shrink-0 sm:pt-0.5">
              <button
                type="button"
                className="nk-btn nk-btn-secondary text-xs sm:text-sm"
                onClick={() => {
                  setEditingId(node.id);
                  setEditName(node.name);
                }}
              >
                {mf.renameFolder}
              </button>
              <button
                type="button"
                className="nk-btn nk-btn-secondary text-xs text-rose-700 sm:text-sm dark:text-rose-400"
                disabled={pending}
                onClick={() => onRemove(node.id)}
              >
                {mf.deleteFolder}
              </button>
            </div>
          </>
        )}
      </div>

      {hasChildren ? (
        <ul
          className="mt-1.5 grid gap-1 border-s-2 border-[var(--primary)]/22 ps-2.5 ms-2.5 sm:mt-2 sm:gap-1.5 sm:ps-3 sm:ms-3"
          role="list"
        >
          {node.children.map((ch) => (
            <FolderBranch
              key={ch.id}
              node={ch}
              depth={depth + 1}
              editingId={editingId}
              editName={editName}
              setEditName={setEditName}
              pending={pending}
              setEditingId={setEditingId}
              onSaveRename={onSaveRename}
              onRemove={onRemove}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export function MaterialFoldersAdmin({
  courseId,
  folders,
  canEdit,
}: {
  courseId: string;
  folders: FolderRow[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState("");
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const folderTree = useMemo(() => buildMaterialFolderTree(folders), [folders]);

  function createFolder() {
    const n = name.trim();
    if (!n) {
      snackbarError(mf.folderNameRequired);
      return;
    }
    startTransition(async () => {
      const r = await createMaterialFolderAction(courseId, n, parentId.trim() || null);
      if (!r.ok) {
        snackbarError(mf.errors.folderOp);
        return;
      }
      snackbarSuccess(mf.folderCreated);
      setName("");
      setParentId("");
      router.refresh();
    });
  }

  function saveRename(folderId: string) {
    const n = editName.trim();
    if (!n) return;
    startTransition(async () => {
      const r = await renameMaterialFolderAction(courseId, folderId, n);
      if (!r.ok) {
        snackbarError(mf.errors.folderOp);
        return;
      }
      snackbarSuccess(mf.folderRenamed);
      setEditingId(null);
      router.refresh();
    });
  }

  function removeFolder(folderId: string) {
    if (!window.confirm(mf.confirmDeleteFolder)) return;
    startTransition(async () => {
      const r = await deleteMaterialFolderAction(courseId, folderId);
      if (!r.ok) {
        if ("error" in r && r.error === "notEmpty") {
          snackbarError(mf.folderNotEmpty);
        } else {
          snackbarError(mf.errors.folderOp);
        }
        return;
      }
      snackbarSuccess(mf.folderDeleted);
      router.refresh();
    });
  }

  if (!canEdit) return null;

  const parentOptions = folders.filter((f) => f.id !== editingId);

  return (
    <Card elevated interactive={false} className="grid gap-4 p-3 md:p-4">
      <header className="grid gap-1">
        <h2 className="nk-section-title !mb-0">{mf.foldersSectionTitle}</h2>
        <p className="text-sm leading-relaxed text-[var(--text-muted)]">{mf.foldersSectionHint}</p>
      </header>

      <section
        aria-labelledby="create-folder-heading"
        className="grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)]/25 p-3 md:p-4"
      >
        <div className="grid gap-1">
          <h3 id="create-folder-heading" className="text-sm font-semibold text-[var(--foreground)]">
            {mf.createFolderPanelTitle}
          </h3>
          <p className="text-xs leading-relaxed text-[var(--text-muted)] md:text-sm">{mf.createFolderPanelHint}</p>
        </div>

        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!pending) createFolder();
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            <label className="grid max-w-xl gap-2 text-sm sm:max-w-none">
              <span className="font-medium">{mf.newFolderName}</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={pending}
                placeholder={mf.newFolderNamePlaceholder}
                maxLength={200}
                autoComplete="off"
                className="disabled:opacity-60"
              />
            </label>
            <label className="grid max-w-xl gap-2 text-sm sm:max-w-none">
              <span className="font-medium">{mf.newFolderParent}</span>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                disabled={pending}
                className="w-full max-w-xl disabled:opacity-60 sm:max-w-none"
              >
                <option value="">{mf.moveFolderRoot}</option>
                {parentOptions.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--border-muted-edge)] pt-3">
            <button
              type="submit"
              disabled={pending || !name.trim()}
              className="nk-btn nk-btn-primary inline-flex min-w-[9.5rem] items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {pending ? <Spinner /> : null}
              {pending ? mf.creatingFolder : mf.newFolderSubmit}
            </button>
          </div>
        </form>
      </section>

      {folders.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--surface)]/60 px-3 py-4 text-center text-sm text-[var(--text-muted)]">
          {mf.foldersEmptyState}
        </p>
      ) : (
        <div className="grid gap-2">
          <p className="text-sm font-medium text-[var(--text-muted)]">{mf.foldersCurrentLabel}</p>
          <div className="rounded-xl border border-[var(--border)] bg-gradient-to-b from-[var(--surface-muted)]/35 to-[var(--surface)]/40 p-2 shadow-inner sm:p-2.5">
            <ul className="grid gap-1.5" role="list">
              {folderTree.map((node) => (
                <FolderBranch
                  key={node.id}
                  node={node}
                  depth={0}
                  editingId={editingId}
                  editName={editName}
                  setEditName={setEditName}
                  pending={pending}
                  setEditingId={setEditingId}
                  onSaveRename={saveRename}
                  onRemove={removeFolder}
                />
              ))}
            </ul>
          </div>
        </div>
      )}
    </Card>
  );
}
