import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { getCurrentPreviewCourseId } from "@/lib/course-preview";

export default async function CoursesLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  if (user.role === UserRole.PARTICIPANT) {
    if (!user.platformApproved) {
      redirect("/pending-approval");
    }
  } else if (user.role === UserRole.INSTRUCTOR || user.role === UserRole.ADMIN) {
    // Staff are only allowed inside /courses while previewing as a learner.
    // Without a preview cookie, send them back to the instructor/admin home.
    const previewCourseId = await getCurrentPreviewCourseId();
    if (!previewCourseId) {
      redirect(user.role === UserRole.ADMIN ? "/admin" : "/admin/courses");
    }
  } else {
    redirect("/login");
  }

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
