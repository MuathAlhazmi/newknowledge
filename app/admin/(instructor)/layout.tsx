import { requireInstructor } from "@/lib/auth";
import { DashboardSidebar } from "@/components/dashboard-sidebar";

export const dynamic = "force-dynamic";

export default async function InstructorAdminLayout({ children }: { children: React.ReactNode }) {
  await requireInstructor();

  return (
    <>
      <DashboardSidebar variant="instructor" />
      <div className="nk-dashboard-main">
        <div className="nk-dashboard-canvas">{children}</div>
      </div>
    </>
  );
}
