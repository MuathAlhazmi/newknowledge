"use client";

import { useState } from "react";
import { CourseInstructorRole } from "@prisma/client";
import {
  addCourseInstructorAction,
  removeCourseInstructorAction,
  updateCourseInstructorRoleAction,
} from "@/app/admin/(instructor)/courses/[courseId]/course-team-actions";
import { Card } from "@/components/ui";

type Member = { userId: string; name: string; email: string; role: CourseInstructorRole };

const roleLabel: Record<CourseInstructorRole, string> = {
  [CourseInstructorRole.OWNER]: "مسؤول الدورة",
  [CourseInstructorRole.EDITOR]: "محرر",
  [CourseInstructorRole.VIEWER]: "عرض فقط",
};

export function CourseTeamPanel({ courseId, members }: { courseId: string; members: Member[] }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<{ id: string; name: string; email: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [addRole, setAddRole] = useState<Extract<CourseInstructorRole, "EDITOR" | "VIEWER">>(
    CourseInstructorRole.EDITOR,
  );

  async function search() {
    const t = q.trim();
    if (t.length < 2) {
      setHits([]);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(
        `/api/admin/instructors/search?courseId=${encodeURIComponent(courseId)}&q=${encodeURIComponent(t)}`,
      );
      const data = (await res.json()) as { users: { id: string; name: string; email: string }[] };
      setHits(data.users ?? []);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card elevated className="grid gap-4 p-4">
      <div>
        <h2 className="text-base font-semibold text-[var(--foreground)]">فريق التدريس</h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          أضف مدربين مشاركين وحدد صلاحية العرض أو التحرير. إدارة الفريق (إضافة وإزالة الأعضاء) متاحة لمسؤول الدورة فقط.
        </p>
      </div>
      <ul className="grid gap-2">
        {members.map((m) => (
          <li
            key={m.userId}
            className="flex flex-col gap-3 rounded-lg border border-[var(--border)] p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="font-medium text-[var(--foreground)]">{m.name}</p>
              <p className="text-xs text-[var(--text-muted)]" dir="ltr">
                {m.email}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {m.role === CourseInstructorRole.OWNER ? (
                <span className="text-sm font-medium text-[var(--primary-strong)]">{roleLabel[m.role]}</span>
              ) : (
                <>
                  <form
                    action={updateCourseInstructorRoleAction}
                    className="flex flex-wrap items-center gap-2"
                  >
                    <input type="hidden" name="courseId" value={courseId} />
                    <input type="hidden" name="userId" value={m.userId} />
                    <select
                      name="role"
                      defaultValue={m.role}
                      className="rounded-md border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-sm"
                    >
                      <option value={CourseInstructorRole.EDITOR}>{roleLabel[CourseInstructorRole.EDITOR]}</option>
                      <option value={CourseInstructorRole.VIEWER}>{roleLabel[CourseInstructorRole.VIEWER]}</option>
                    </select>
                    <button type="submit" className="nk-btn nk-btn-secondary text-xs">
                      تحديث
                    </button>
                  </form>
                  <form action={removeCourseInstructorAction}>
                    <input type="hidden" name="courseId" value={courseId} />
                    <input type="hidden" name="userId" value={m.userId} />
                    <button type="submit" className="nk-btn nk-btn-secondary text-xs">
                      إزالة
                    </button>
                  </form>
                </>
              )}
            </div>
          </li>
        ))}
      </ul>

      <div className="border-t border-[var(--border)] pt-4">
        <p className="mb-2 text-sm font-medium text-[var(--foreground)]">إضافة مدرب مشارك</p>
        <label className="grid gap-1 text-sm">
          <span className="text-[var(--text-muted)]">بحث (اسم أو بريد، حرفان على الأقل)</span>
          <div className="flex flex-wrap gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="مثال: أحمد أو @domain"
              className="min-w-0 flex-1 rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
            />
            <button type="button" className="nk-btn nk-btn-secondary text-sm" onClick={() => void search()} disabled={busy}>
              {busy ? "…" : "بحث"}
            </button>
          </div>
        </label>
        <label className="mt-3 grid gap-1 text-sm">
          <span className="text-[var(--text-muted)]">صلاحية العضو الجديد</span>
          <select
            value={addRole}
            onChange={(e) =>
              setAddRole(e.target.value as Extract<CourseInstructorRole, "EDITOR" | "VIEWER">)
            }
            className="max-w-xl rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm"
          >
            <option value={CourseInstructorRole.EDITOR}>محرر — تعديل المحتوى والتسجيلات والاختبارات</option>
            <option value={CourseInstructorRole.VIEWER}>عرض فقط — الاطلاع دون تعديل</option>
          </select>
        </label>
        {hits.length > 0 ? (
          <ul className="mt-3 grid gap-2">
            {hits.map((u) => (
              <li
                key={u.id}
                className="flex flex-col gap-2 rounded-md bg-[var(--surface-muted)]/50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="text-sm">
                  {u.name}{" "}
                  <span className="text-[var(--text-muted)]" dir="ltr">
                    ({u.email})
                  </span>
                </span>
                <form action={addCourseInstructorAction}>
                  <input type="hidden" name="courseId" value={courseId} />
                  <input type="hidden" name="userId" value={u.id} />
                  <input type="hidden" name="role" value={addRole} />
                  <button type="submit" className="nk-btn nk-btn-primary text-xs">
                    إضافة
                  </button>
                </form>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </Card>
  );
}
