import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { requireCourseAccess } from "@/lib/course-staff";
import { requireApprovedEnrollment } from "@/lib/guards";

const PREVIEW_COOKIE = "nk_preview_course";
const PREVIEW_MAX_AGE_SECONDS = 60 * 60 * 4; // 4 hours

export type LearnerViewMode = "learner" | "preview";

export type CourseLearnerView = {
  user: Awaited<ReturnType<typeof requireUser>>;
  mode: LearnerViewMode;
};

/**
 * Allow real participants and (when the preview cookie is set for this course)
 * course staff / platform admins onto the learner-facing course pages.
 *
 * Staff in preview mode are guaranteed to also pass `requireCourseAccess`, so
 * the synthetic OWNER membership for ADMIN naturally applies.
 */
export async function requireCourseLearnerView(courseId: string): Promise<CourseLearnerView> {
  const user = await requireUser();

  if (user.role === UserRole.PARTICIPANT) {
    if (!user.platformApproved) redirect("/pending-approval");
    const ok = await requireApprovedEnrollment(user.id, courseId);
    if (!ok) notFound();
    return { user, mode: "learner" };
  }

  const cookieStore = await cookies();
  const previewing = cookieStore.get(PREVIEW_COOKIE)?.value === courseId;
  if (!previewing) {
    redirect(`/admin/courses/${courseId}`);
  }

  // Verify the staff member actually has access to this course (admin gets synthetic OWNER).
  await requireCourseAccess(courseId);
  return { user, mode: "preview" };
}

export async function getCurrentPreviewCourseId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(PREVIEW_COOKIE)?.value ?? null;
}

/**
 * Returns true when the caller is a course staff member currently previewing
 * the given course. Use from participant-side server actions to refuse writes.
 */
export async function isPreviewingCourse(courseId: string): Promise<boolean> {
  const user = await requireUser();
  if (user.role === UserRole.PARTICIPANT) return false;
  const cookieStore = await cookies();
  return cookieStore.get(PREVIEW_COOKIE)?.value === courseId;
}

export async function enterPreviewAction(courseId: string): Promise<void> {
  "use server";
  const user = await requireUser();
  if (user.role === UserRole.PARTICIPANT) {
    redirect("/courses");
  }
  // Make sure the staff member actually has access (admin gets synthetic OWNER).
  await requireCourseAccess(courseId);

  const cookieStore = await cookies();
  cookieStore.set({
    name: PREVIEW_COOKIE,
    value: courseId,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: PREVIEW_MAX_AGE_SECONDS,
  });
  revalidatePath(`/courses/${courseId}`, "layout");
  revalidatePath(`/admin/courses/${courseId}`, "layout");
  redirect(`/courses/${courseId}`);
}

export async function exitPreviewAction(courseId: string): Promise<void> {
  "use server";
  const cookieStore = await cookies();
  cookieStore.delete(PREVIEW_COOKIE);
  revalidatePath(`/courses/${courseId}`, "layout");
  revalidatePath(`/admin/courses/${courseId}`, "layout");
  redirect(`/admin/courses/${courseId}`);
}
