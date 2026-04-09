import { UserRole } from "@prisma/client";
import { db } from "@/lib/db";

/**
 * Platform admins first, then course team (by join creation order), for routing learner
 * messages to an inbox and for thread visibility.
 */
export async function getCourseChatStaffIds(courseId: string): Promise<string[]> {
  const [admins, courseRows] = await Promise.all([
    db.user.findMany({
      where: { role: UserRole.ADMIN },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    }),
    db.courseInstructor.findMany({
      where: { courseId },
      select: { userId: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const ids: string[] = [];
  const seen = new Set<string>();
  for (const a of admins) {
    if (!seen.has(a.id)) {
      seen.add(a.id);
      ids.push(a.id);
    }
  }
  for (const row of courseRows) {
    if (!seen.has(row.userId)) {
      seen.add(row.userId);
      ids.push(row.userId);
    }
  }
  return ids;
}
