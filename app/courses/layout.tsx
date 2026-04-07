import { requireParticipant } from "@/lib/auth";

export default async function CoursesLayout({ children }: { children: React.ReactNode }) {
  await requireParticipant();

  return (
    <div className="nk-dashboard nk-fade-in">
      <div className="nk-dashboard-row">
        <div className="nk-dashboard-main">
          <div className="nk-dashboard-canvas">{children}</div>
        </div>
      </div>
    </div>
  );
}
