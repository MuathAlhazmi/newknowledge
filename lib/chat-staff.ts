import { UserRole } from "@prisma/client";
import { db } from "@/lib/db";

/** Platform staff who may receive learner course chat (admins first, then instructors). */
export async function getCourseChatStaffIds(): Promise<string[]> {
  const users = await db.user.findMany({
    where: { role: { in: [UserRole.ADMIN, UserRole.INSTRUCTOR] } },
    select: { id: true, role: true },
    orderBy: { createdAt: "asc" },
  });
  users.sort((a, b) => {
    if (a.role === b.role) return 0;
    if (a.role === UserRole.ADMIN) return -1;
    if (b.role === UserRole.ADMIN) return 1;
    return 0;
  });
  return users.map((u) => u.id);
}
