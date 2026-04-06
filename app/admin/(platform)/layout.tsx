import { requireAdmin } from "@/lib/auth";
import { DashboardSidebar } from "@/components/dashboard-sidebar";

export const dynamic = "force-dynamic";

export default async function PlatformAdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <>
      <DashboardSidebar variant="admin" />
      <div className="nk-dashboard-main">
        <div className="nk-dashboard-canvas">{children}</div>
      </div>
    </>
  );
}
