import Link from "next/link";
import { EnrollmentStatus, UserRole } from "@prisma/client";
import { CreatePlatformUserForm, MinimalEnrollForm } from "@/components/admin-hub-forms";
import { AdminUserDirectory } from "@/components/admin-user-directory";
import { db } from "@/lib/db";
import { arCopy } from "@/lib/copy/ar";
import { Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import {
  approveGlobalEnrollmentAction,
  approvePlatformUserAction,
} from "@/app/admin/manage-actions";
import { requireAdmin } from "@/lib/auth";

export default async function AdminHubPage() {
  const admin = await requireAdmin();

  const [pendingPlatform, pendingEnrollments, courses, approvedLearners, allUsers] = await Promise.all([
    db.user.findMany({
      where: { role: UserRole.PARTICIPANT, platformApproved: false },
      orderBy: { createdAt: "asc" },
    }),
    db.enrollment.findMany({
      where: { status: EnrollmentStatus.PENDING },
      include: { user: true, course: true },
      orderBy: { createdAt: "asc" },
    }),
    db.course.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
    db.user.findMany({
      where: {
        role: UserRole.PARTICIPANT,
        platformApproved: true,
      },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        platformApproved: true,
        createdAt: true,
      },
    }),
  ]);

  const directoryUsers = allUsers.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    platformApproved: u.platformApproved,
    createdAt: u.createdAt.toISOString(),
  }));

  return (
    <div className="page-wrap gap-6">
      <PageHeader
        eyebrow={arCopy.adminUserHub.eyebrow}
        title={arCopy.adminUserHub.title}
        subtitle={arCopy.adminUserHub.subtitle}
        actions={
          <Link href="/" className="nk-btn nk-btn-secondary text-sm">
            الرئيسية
          </Link>
        }
      />

      <section className="nk-section !my-0">
        <h2 className="nk-section-title">{arCopy.adminUserHub.pendingAccountsTitle}</h2>
        <p className="mb-4 max-w-2xl text-sm text-[var(--text-muted)]">
          {arCopy.adminUserHub.pendingAccountsHint}
        </p>
        {pendingPlatform.length === 0 ? (
          <EmptyState title={arCopy.templates.emptyPlural("طلبات اعتماد حساب")} text={arCopy.status.noPendingRequests} />
        ) : (
          <ul className="nk-stagger-list grid gap-3">
            {pendingPlatform.map((u) => (
              <li key={u.id}>
                <Card elevated className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{u.name}</p>
                    <p className="text-sm text-[var(--text-muted)]" dir="ltr">
                      {u.email}
                    </p>
                    <p className="text-sm text-[var(--text-muted)]" dir="ltr">
                      {u.phone}
                    </p>
                  </div>
                  <form action={approvePlatformUserAction}>
                    <input type="hidden" name="userId" value={u.id} />
                    <button type="submit" className="nk-btn nk-btn-primary">
                      {arCopy.glossary.accountApproval}
                    </button>
                  </form>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="nk-section !my-0">
        <h2 className="nk-section-title">{arCopy.adminUserHub.createUserTitle}</h2>
        <CreatePlatformUserForm />
      </section>

      <section className="nk-section !my-0">
        <h2 className="nk-section-title">{arCopy.adminUserHub.userDirectoryTitle}</h2>
        <p className="mb-4 max-w-2xl text-sm text-[var(--text-muted)]">
          {arCopy.adminUserHub.userDirectoryHint}
        </p>
        <AdminUserDirectory users={directoryUsers} currentUserId={admin.id} />
      </section>

      <section className="nk-section !my-0">
        <h2 className="nk-section-title">{arCopy.adminUserHub.pendingEnrollmentsTitle}</h2>
        <p className="mb-4 max-w-2xl text-sm text-[var(--text-muted)]">
          {arCopy.adminUserHub.pendingEnrollmentsHint}
        </p>
        {pendingEnrollments.length === 0 ? (
          <EmptyState
            title={arCopy.templates.emptyPlural("طلبات تسجيل معلقة")}
            text="لا توجد تسجيلات بانتظار الاعتماد على مستوى المنصة."
          />
        ) : (
          <ul className="nk-stagger-list grid gap-3">
            {pendingEnrollments.map((e) => (
              <li key={e.id}>
                <Card elevated className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-semibold">{e.course.title}</p>
                    <p className="text-sm text-[var(--text-muted)]">{e.user.name}</p>
                    <p className="text-sm text-[var(--text-muted)]" dir="ltr">
                      {e.user.email}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                    <StatusBadge text={arCopy.status.pendingReview} tone="warning" />
                    <form action={approveGlobalEnrollmentAction}>
                      <input type="hidden" name="enrollmentId" value={e.id} />
                      <input type="hidden" name="courseId" value={e.courseId} />
                      <button type="submit" className="nk-btn nk-btn-primary text-sm">
                        {arCopy.glossary.enrollmentApproval}
                      </button>
                    </form>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="nk-section !my-0">
        <h2 className="nk-section-title">{arCopy.adminUserHub.minimalEnrollTitle}</h2>
        <MinimalEnrollForm courses={courses} learners={approvedLearners} />
      </section>
    </div>
  );
}
