import { AnnouncementKind, ExamType, MaterialKind } from "@prisma/client";
import { db } from "@/lib/db";

export type CourseAnnouncementItem = {
  id: string;
  source: "manual" | "material" | "exam" | "teams";
  kind: AnnouncementKind;
  title: string;
  body: string | null;
  href: string;
  publishedAt: Date;
};

function labelExamType(type: ExamType): string {
  return type === ExamType.PRE ? "اختبار قبلي" : "اختبار بعدي";
}

function materialAddedBody(kind: MaterialKind): string {
  if (kind === MaterialKind.DOCX) {
    return "تمت إضافة مستند Word (DOCX) جديد إلى مواد الدورة.";
  }
  return "تمت إضافة ملف PDF جديد إلى مواد الدورة.";
}

export async function getCourseAnnouncements(
  courseId: string,
  options?: { limit?: number; includeDrafts?: boolean },
): Promise<CourseAnnouncementItem[]> {
  const limit = options?.limit ?? 50;
  const includeDrafts = options?.includeDrafts ?? false;
  const now = new Date();

  const [manual, materials, exams, teamsSessions] = await Promise.all([
    db.announcement.findMany({
      where: {
        courseId,
        ...(includeDrafts ? {} : { publishedAt: { not: null, lte: now } }),
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: Math.max(limit, 25),
    }),
    db.material.findMany({
      where: { courseId },
      select: { id: true, title: true, createdAt: true, kind: true },
      orderBy: { createdAt: "desc" },
      take: Math.max(limit, 25),
    }),
    db.exam.findMany({
      where: { courseId, isActive: true },
      select: { id: true, title: true, type: true, createdAt: true, durationMinutes: true },
      orderBy: { createdAt: "desc" },
      take: Math.max(limit, 25),
    }),
    db.teamsSession.findMany({
      where: { courseId },
      select: { id: true, title: true, startsAt: true, createdAt: true },
      orderBy: { startsAt: "desc" },
      take: Math.max(limit, 25),
    }),
  ]);

  const merged: CourseAnnouncementItem[] = [
    ...manual.map((row) => ({
      id: `manual:${row.id}`,
      source: "manual" as const,
      kind: row.kind,
      title: row.title,
      body: row.body,
      href: `/courses/${courseId}/announcements`,
      publishedAt: row.publishedAt ?? row.createdAt,
    })),
    ...materials.map((row) => ({
      id: `material:${row.id}`,
      source: "material" as const,
      kind: AnnouncementKind.CONTENT,
      title: `محتوى جديد: ${row.title}`,
      body: materialAddedBody(row.kind),
      href: `/courses/${courseId}/materials/${row.id}`,
      publishedAt: row.createdAt,
    })),
    ...exams.map((row) => ({
      id: `exam:${row.id}`,
      source: "exam" as const,
      kind: AnnouncementKind.QUIZ,
      title: `اختبار متاح: ${row.title}`,
      body: `${labelExamType(row.type)} • المدة ${row.durationMinutes} دقيقة`,
      href: `/courses/${courseId}/exams`,
      publishedAt: row.createdAt,
    })),
    ...teamsSessions.map((row) => ({
      id: `teams:${row.id}`,
      source: "teams" as const,
      kind: AnnouncementKind.TEAMS,
      title: `جلسة Teams: ${row.title}`,
      body: `موعد الجلسة: ${row.startsAt.toLocaleString("ar-SA")}`,
      href: `/courses/${courseId}/teams`,
      publishedAt: row.createdAt,
    })),
  ];

  return merged
    .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
    .slice(0, limit);
}
