import { requireInstructor } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function InstructorAdminLayout({ children }: { children: React.ReactNode }) {
  await requireInstructor();

  return (
    <div className="nk-dashboard-main">
      <div className="nk-dashboard-canvas">{children}</div>
    </div>
  );
}
