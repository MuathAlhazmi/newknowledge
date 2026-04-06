import { redirect } from "next/navigation";
import type { User } from "@prisma/client";
import { UserRole } from "@prisma/client";
import { db } from "@/lib/db";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Resolves post-sign-in URL: single enrollment → course hub, else list or role defaults. */
export async function resolvePostLoginPath(user: User): Promise<string> {
  if (user.role === UserRole.ADMIN) return "/admin";
  if (user.role === UserRole.INSTRUCTOR) return "/admin/courses";
  if (!user.platformApproved) return "/pending-approval";

  const enrollments = await db.enrollment.findMany({
    where: { userId: user.id },
    select: { courseId: true },
  });
  if (enrollments.length === 1) {
    return `/courses/${enrollments[0].courseId}`;
  }
  return "/courses";
}

export async function getCurrentUser() {
  const hasKey =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY) ||
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !hasKey) {
    return null;
  }

  let supabase;
  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;

  return db.user.findFirst({
    where: { email: { equals: user.email, mode: "insensitive" } },
  });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role === UserRole.INSTRUCTOR) {
    redirect("/admin/courses");
  }
  if (user.role === UserRole.PARTICIPANT) {
    if (!user.platformApproved) {
      redirect("/pending-approval");
    }
    redirect("/courses");
  }
  if (user.role !== UserRole.ADMIN) {
    redirect("/courses");
  }
  return user;
}

export async function requireInstructor() {
  const user = await requireUser();
  if (user.role === UserRole.ADMIN) {
    redirect("/admin");
  }
  if (user.role === UserRole.PARTICIPANT) {
    if (!user.platformApproved) {
      redirect("/pending-approval");
    }
    redirect("/courses");
  }
  if (user.role !== UserRole.INSTRUCTOR) {
    redirect("/courses");
  }
  return user;
}

export async function requireParticipant() {
  const user = await requireUser();
  if (user.role === UserRole.ADMIN) {
    redirect("/admin");
  }
  if (user.role === UserRole.INSTRUCTOR) {
    redirect("/admin/courses");
  }
  if (user.role !== UserRole.PARTICIPANT) {
    redirect("/login");
  }
  if (!user.platformApproved) {
    redirect("/pending-approval");
  }
  return user;
}
