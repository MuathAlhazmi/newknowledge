"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { arCopy } from "@/lib/copy/ar";
import {
  deletePlatformUserCrudAction,
  updatePlatformUserCrudAction,
} from "@/app/admin/user-crud-actions";
import type { UpdateUserCrudState } from "@/app/admin/user-crud-actions";
import { Card, StatusBadge } from "@/components/ui";
import { snackbarError, snackbarSuccess, snackbarWarning } from "@/lib/snackbar";
import { useOnSerialChange } from "@/lib/use-on-serial-change";

export type AdminDirectoryUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "ADMIN" | "INSTRUCTOR" | "PARTICIPANT";
  platformApproved: boolean;
  createdAt: string;
};

type RoleFilter = "ALL" | "ADMIN" | "INSTRUCTOR" | "PARTICIPANT";

function roleLabel(role: AdminDirectoryUser["role"]): string {
  return arCopy.roleLabels[role];
}

function platformBadge(u: AdminDirectoryUser) {
  if (u.role === "PARTICIPANT") {
    return u.platformApproved ? (
      <StatusBadge text={arCopy.adminUserHub.participantPlatformApproved} tone="success" />
    ) : (
      <StatusBadge text={arCopy.adminUserHub.participantPendingPlatform} tone="warning" />
    );
  }
  return <StatusBadge text={arCopy.adminUserHub.staffPlatformNote} tone="muted" />;
}

function EditUserDialog({
  user,
  onClose,
}: {
  user: AdminDirectoryUser;
  onClose: () => void;
}) {
  const router = useRouter();
  const [role, setRole] = useState<AdminDirectoryUser["role"]>(user.role);
  const [state, formAction, pending] = useActionState(
    updatePlatformUserCrudAction,
    null as UpdateUserCrudState,
  );

  useOnSerialChange(JSON.stringify(state ?? null), () => {
    if (!state) return;
    if (state.kind === "success") snackbarSuccess(state.message);
    if (state.kind === "error") snackbarError(state.message);
  });

  useEffect(() => {
    if (state?.kind === "success") {
      onClose();
      router.refresh();
    }
  }, [state, onClose, router]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-user-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
    >
      <Card
        elevated
        interactive={false}
        className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-2">
          <h3 id="edit-user-title" className="text-base font-semibold">
            {arCopy.adminUserHub.editUser}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-[var(--text-muted)] hover:text-[var(--foreground)]"
          >
            {arCopy.adminUserHub.cancelEdit}
          </button>
        </div>
        <form action={formAction} className="grid gap-3">
          <input type="hidden" name="userId" value={user.id} />
          <label className="grid gap-2 text-sm">
            <span className="font-medium">الاسم</span>
            <input name="name" type="text" required className="w-full" defaultValue={user.name} />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="font-medium">البريد</span>
            <input
              name="email"
              type="email"
              required
              dir="ltr"
              className="w-full"
              defaultValue={user.email}
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="font-medium">الجوال</span>
            <input
              name="phone"
              type="tel"
              required
              dir="ltr"
              className="w-full"
              defaultValue={user.phone}
            />
          </label>
          <label className="grid gap-2 text-sm">
            <span className="font-medium">الدور</span>
            <select
              name="role"
              required
              className="w-full"
              value={role}
              onChange={(e) => setRole(e.target.value as AdminDirectoryUser["role"])}
            >
              <option value="PARTICIPANT">{arCopy.roleLabels.PARTICIPANT}</option>
              <option value="INSTRUCTOR">{arCopy.roleLabels.INSTRUCTOR}</option>
              <option value="ADMIN">{arCopy.roleLabels.ADMIN}</option>
            </select>
          </label>
          {role === "PARTICIPANT" ? (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="platformApproved"
                defaultChecked={user.platformApproved}
                className="nk-check"
              />
              <span>{arCopy.adminUserHub.platformApprovedLabel}</span>
            </label>
          ) : null}
          <label className="grid gap-2 text-sm">
            <span className="font-medium">{arCopy.adminUserHub.newPasswordOptional}</span>
            <input name="newPassword" type="password" autoComplete="new-password" className="w-full" />
          </label>
          <div className="flex flex-wrap gap-2 pt-2">
            <button type="submit" disabled={pending} className="nk-btn nk-btn-primary disabled:opacity-50">
              {pending ? arCopy.templates.pending("الحفظ") : arCopy.adminUserHub.saveUserChanges}
            </button>
            <button type="button" onClick={onClose} className="nk-btn nk-btn-secondary">
              {arCopy.adminUserHub.cancelEdit}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export function AdminUserDirectory({
  users,
  currentUserId,
}: {
  users: AdminDirectoryUser[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<RoleFilter>("ALL");
  const [editing, setEditing] = useState<AdminDirectoryUser | null>(null);
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    if (filter === "ALL") return users;
    return users.filter((u) => u.role === filter);
  }, [users, filter]);

  function handleDelete(u: AdminDirectoryUser) {
    if (u.id === currentUserId) return;
    if (!window.confirm(arCopy.adminUserHub.confirmDeleteUser)) return;
    startTransition(async () => {
      const r = await deletePlatformUserCrudAction(u.id);
      if (!r.ok) {
        snackbarError(r.message);
        return;
      }
      snackbarSuccess(arCopy.snackbar.userDeleted);
      if (r.warning) {
        snackbarWarning(r.warning);
      }
      router.refresh();
    });
  }

  return (
    <div className="grid gap-4">
      {editing ? <EditUserDialog key={editing.id} user={editing} onClose={() => setEditing(null)} /> : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <label className="grid gap-2 text-sm sm:max-w-xs">
          <span className="font-medium">{arCopy.adminUserHub.filterRoleLabel}</span>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as RoleFilter)}
            className="w-full"
          >
            <option value="ALL">{arCopy.adminUserHub.filterAll}</option>
            <option value="ADMIN">{arCopy.roleLabels.ADMIN}</option>
            <option value="INSTRUCTOR">{arCopy.roleLabels.INSTRUCTOR}</option>
            <option value="PARTICIPANT">{arCopy.roleLabels.PARTICIPANT}</option>
          </select>
        </label>
        <p className="text-sm text-[var(--text-muted)]">
          {filtered.length} / {users.length}
        </p>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">{arCopy.templates.emptyPlural("مستخدمين ضمن التصفية")}</p>
      ) : (
        <ul className="nk-stagger-list grid gap-3">
          {filtered.map((u) => {
            const isSelf = u.id === currentUserId;
            return (
              <li key={u.id}>
                <Card elevated interactive={false} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold text-[var(--foreground)]">{u.name}</p>
                    <p className="text-sm text-[var(--text-muted)]" dir="ltr">
                      {u.email}
                    </p>
                    <p className="text-sm text-[var(--text-muted)]" dir="ltr">
                      {u.phone}
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      {new Date(u.createdAt).toLocaleString("ar-SA", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2 sm:items-end">
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <StatusBadge text={roleLabel(u.role)} tone="info" />
                      {platformBadge(u)}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={isSelf}
                        onClick={() => setEditing(u)}
                        className="nk-btn nk-btn-secondary text-sm disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {arCopy.adminUserHub.editUser}
                      </button>
                      <button
                        type="button"
                        disabled={isSelf}
                        onClick={() => handleDelete(u)}
                        className="nk-btn border border-rose-200 bg-rose-50 text-sm text-rose-900 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {arCopy.adminUserHub.deleteUser}
                      </button>
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
