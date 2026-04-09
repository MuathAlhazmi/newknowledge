import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";
import { requireCourseOwner } from "@/lib/course-staff";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = String(searchParams.get("q") ?? "").trim();
  const courseId = String(searchParams.get("courseId") ?? "").trim();
  if (!courseId) {
    return NextResponse.json({ users: [] satisfies { id: string; name: string; email: string }[] });
  }
  await requireCourseOwner(courseId);

  if (q.length < 2) {
    return NextResponse.json({ users: [] satisfies { id: string; name: string; email: string }[] });
  }

  const existingIds = (
    await db.courseInstructor.findMany({
      where: { courseId },
      select: { userId: true },
    })
  ).map((r) => r.userId);

  const users = await db.user.findMany({
    where: {
      role: UserRole.INSTRUCTOR,
      ...(existingIds.length > 0 ? { id: { notIn: existingIds } } : {}),
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
    take: 20,
  });

  return NextResponse.json({ users });
}
