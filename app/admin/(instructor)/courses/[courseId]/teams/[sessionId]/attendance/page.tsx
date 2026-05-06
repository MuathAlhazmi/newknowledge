import { EnrollmentStatus } from "@prisma/client";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { canEditCourse, requireCourseAccess, requireCourseEditor } from "@/lib/course-staff";
import { db } from "@/lib/db";
import { PendingFieldset, PendingFormOverlay, PendingSubmitButton } from "@/components/form-pending";
import { SelectAllAttendanceControls } from "./select-all-controls";
import { Card, EmptyState, PageHeader, StatusBadge, WarningCard } from "@/components/ui";

async function setTeamsAttendanceAction(formData: FormData) {
  "use server";
  const courseId = String(formData.get("courseId") ?? "").trim();
  const sessionId = String(formData.get("sessionId") ?? "").trim();
  if (!courseId || !sessionId) return;

  const { user: staff } = await requireCourseEditor(courseId);

  const session = await db.teamsSession.findFirst({
    where: { id: sessionId, courseId },
    select: { id: true },
  });
  if (!session) return;

  const approved = await db.enrollment.findMany({
    where: { courseId, status: EnrollmentStatus.APPROVED },
    select: { userId: true },
  });
  const approvedUserIds = new Set(approved.map((e) => e.userId));

  const updates: Array<{ userId: string; present: boolean }> = [];
  for (const [key, raw] of formData.entries()) {
    if (!key.startsWith("present_")) continue;
    const userId = key.slice("present_".length);
    if (!approvedUserIds.has(userId)) continue;
    const present = String(raw) === "1";
    updates.push({ userId, present });
  }

  for (const u of updates) {
    await db.teamsSessionAttendance.upsert({
      where: { sessionId_userId: { sessionId, userId: u.userId } },
      update: { present: u.present, markedById: staff.id, markedAt: new Date() },
      create: { sessionId, userId: u.userId, present: u.present, markedById: staff.id },
    });
  }

  revalidatePath(`/admin/courses/${courseId}/teams/${sessionId}/attendance`);
  revalidatePath(`/admin/courses/${courseId}/teams`);
  revalidatePath(`/admin/courses/${courseId}`);
}

export default async function TeamsAttendancePage({
  params,
}: {
  params: Promise<{ courseId: string; sessionId: string }>;
}) {
  const { courseId, sessionId } = await params;

  const { membership } = await requireCourseAccess(courseId);
  const canEdit = canEditCourse(membership.role);

  const session = await db.teamsSession.findFirst({
    where: { id: sessionId, courseId },
    select: { id: true, title: true, startsAt: true },
  });
  if (!session) notFound();

  const enrollments = await db.enrollment.findMany({
    where: { courseId, status: EnrollmentStatus.APPROVED },
    include: { user: true },
    orderBy: { user: { name: "asc" } },
  });

  const attendance = await db.teamsSessionAttendance.findMany({
    where: { sessionId },
    select: { userId: true, present: true, markedAt: true, markedBy: { select: { name: true } } },
  });

  const attendanceByUserId = new Map(attendance.map((a) => [a.userId, a]));

  const allSessionCount = await db.teamsSession.count({ where: { courseId } });
  const allAttendance = await db.teamsSessionAttendance.findMany({
    where: { session: { courseId } },
    select: { userId: true, present: true },
  });
  const attendanceSummary = new Map<string, { present: number; marked: number }>();
  for (const row of allAttendance) {
    const current = attendanceSummary.get(row.userId) ?? { present: 0, marked: 0 };
    current.marked += 1;
    if (row.present) current.present += 1;
    attendanceSummary.set(row.userId, current);
  }

  return (
    <div className="page-wrap gap-6">
      <PageHeader
        title="حضور جلسة Teams"
        subtitle={`${session.title} — ${new Date(session.startsAt).toLocaleString("ar-SA")}`}
        actions={null}
      />

      {!canEdit ? (
        <WarningCard>صلاحية عرض فقط — لا يمكنك تعديل الحضور.</WarningCard>
      ) : null}

      {enrollments.length === 0 ? (
        <EmptyState text="لا يوجد متدربون معتمدون لهذه الدورة." />
      ) : (
        <Card elevated interactive={false} className="p-5 md:p-6">
          {canEdit ? (
            <form action={setTeamsAttendanceAction} className="relative grid gap-4">
              <PendingFormOverlay text="جارٍ حفظ الحضور..." variant="progress" />
              <PendingFieldset className="grid gap-4">
                <input type="hidden" name="courseId" value={courseId} />
                <input type="hidden" name="sessionId" value={sessionId} />
                <div className="grid gap-3">
                  {enrollments.map((e) => {
                    const a = attendanceByUserId.get(e.userId);
                    const defaultPresent = a?.present ?? false;
                    return (
                      <Card key={e.userId} className="p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="font-semibold">{e.user.name}</p>
                            <p className="text-sm text-[var(--text-muted)]" dir="ltr">
                              {e.user.email}
                            </p>
                            {a ? (
                              <p className="text-xs text-[var(--text-muted)]">
                                آخر تعديل: {a.markedAt.toLocaleString("ar-SA")} • بواسطة {a.markedBy.name}
                              </p>
                            ) : (
                              <p className="text-xs text-[var(--text-muted)]">لم يتم تحديد الحضور بعد.</p>
                            )}
                          </div>
                          <label className="grid gap-1 text-sm">
                            <span className="text-[var(--text-muted)]">الحالة</span>
                            <select
                              name={`present_${e.userId}`}
                              defaultValue={defaultPresent ? "1" : "0"}
                              className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2"
                            >
                              <option value="1">حاضر</option>
                              <option value="0">غائب</option>
                            </select>
                          </label>
                        </div>
                      </Card>
                    );
                  })}
                </div>
                <div className="flex flex-wrap gap-2">
                  <PendingSubmitButton
                    idleText="حفظ الحضور"
                    pendingText="جارٍ حفظ الحضور..."
                    className="nk-btn nk-btn-primary w-fit"
                  />
                  <SelectAllAttendanceControls />
                </div>
              </PendingFieldset>
            </form>
          ) : (
            <div className="grid gap-3">
              {enrollments.map((e) => {
                const a = attendanceByUserId.get(e.userId);
                const present = a?.present ?? false;
                return (
                  <Card key={e.userId} className="p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="font-semibold">{e.user.name}</p>
                        <p className="text-sm text-[var(--text-muted)]" dir="ltr">
                          {e.user.email}
                        </p>
                        {a ? (
                          <p className="text-xs text-[var(--text-muted)]">
                            آخر تعديل: {a.markedAt.toLocaleString("ar-SA")} • بواسطة {a.markedBy.name}
                          </p>
                        ) : (
                          <p className="text-xs text-[var(--text-muted)]">لم يتم تحديد الحضور بعد.</p>
                        )}
                      </div>
                      <StatusBadge text={a ? (present ? "حاضر" : "غائب") : "غير محدد"} tone={present ? "success" : "muted"} />
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {enrollments.length > 0 ? (
        <Card elevated interactive={false} className="p-5 md:p-6">
          <h2 className="mb-3 text-base font-semibold">السجل العام للحضور</h2>
          <p className="mb-4 text-xs text-[var(--text-muted)]">
            ملخص حضور كل متدرب عبر جميع جلسات Teams في هذه الدورة.
          </p>
          <div className="grid gap-3">
            {enrollments.map((e) => {
              const stats = attendanceSummary.get(e.userId) ?? { present: 0, marked: 0 };
              const ratioText = allSessionCount > 0 ? `${stats.present}/${allSessionCount}` : "-";
              const pct = allSessionCount > 0 ? Math.round((stats.present / allSessionCount) * 100) : 0;
              return (
                <Card key={`summary-${e.userId}`} className="p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold">{e.user.name}</p>
                      <p className="text-sm text-[var(--text-muted)]" dir="ltr">
                        {e.user.email}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge text={`الحضور: ${ratioText}`} tone="info" />
                      <StatusBadge text={`${pct}%`} tone={pct >= 75 ? "success" : "warning"} />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </Card>
      ) : null}
    </div>
  );
}

