import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PlatformAdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <div className="nk-dashboard-main">
      <div className="nk-dashboard-canvas">{children}</div>
    </div>
  );
}
