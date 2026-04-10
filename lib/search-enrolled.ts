import { AnnouncementKind, EnrollmentStatus, UserRole } from "@prisma/client";
import { db } from "@/lib/db";

export type SearchHit =
  | { type: "course"; id: string; title: string; snippet: string; href: string }
  | { type: "material"; id: string; title: string; snippet: string; href: string; courseTitle: string }
  | {
      type: "announcement";
      id: string;
      title: string;
      snippet: string;
      href: string;
      courseTitle: string;
    };

export async function searchEnrolledForUser(userId: string, raw: string): Promise<SearchHit[]> {
  const q = raw.trim();
  if (q.length < 2) return [];

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || user.role !== UserRole.PARTICIPANT) return [];

  const enrollments = await db.enrollment.findMany({
    where: { userId, status: EnrollmentStatus.APPROVED },
    select: { courseId: true },
  });
  const courseIds = enrollments.map((e) => e.courseId);
  if (courseIds.length === 0) return [];

  const [courses, materials, announcements] = await Promise.all([
    db.course.findMany({
      where: {
        id: { in: courseIds },
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, title: true, description: true },
      take: 12,
    }),
    db.material.findMany({
      where: {
        courseId: { in: courseIds },
        title: { contains: q, mode: "insensitive" },
      },
      select: { id: true, title: true, courseId: true, course: { select: { title: true } } },
      take: 15,
    }),
    db.announcement.findMany({
      where: {
        courseId: { in: courseIds },
        kind: AnnouncementKind.MANUAL,
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { body: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        title: true,
        body: true,
        courseId: true,
        course: { select: { title: true } },
      },
      take: 15,
    }),
  ]);

  const out: SearchHit[] = [];

  for (const c of courses) {
    out.push({
      type: "course",
      id: c.id,
      title: c.title,
      snippet: c.description.slice(0, 160),
      href: `/courses/${c.id}`,
    });
  }

  for (const m of materials) {
    out.push({
      type: "material",
      id: m.id,
      title: m.title,
      snippet: m.title,
      href: `/courses/${m.courseId}/materials/${m.id}`,
      courseTitle: m.course.title,
    });
  }

  for (const a of announcements) {
    const snippet = (a.body ?? a.title).slice(0, 160);
    out.push({
      type: "announcement",
      id: a.id,
      title: a.title,
      snippet,
      href: `/courses/${a.courseId}/announcements`,
      courseTitle: a.course.title,
    });
  }

  return out;
}
