import { NextResponse } from "next/server";
import { EnrollmentStatus } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

function icsEscape(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function formatIcsUtc(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { courseId } = await params;
  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId: user.id, courseId } },
  });
  if (!enrollment || enrollment.status !== EnrollmentStatus.APPROVED) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { title: true },
  });
  if (!course) {
    return new NextResponse("Not found", { status: 404 });
  }

  const sessions = await db.zoomSession.findMany({
    where: { courseId },
    orderBy: { startsAt: "asc" },
  });

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    "PRODID:-//AlElmAlJadeed//CourseCalendar//AR",
    `X-WR-CALNAME:${icsEscape(course.title)}`,
  ];

  for (const s of sessions) {
    const start = s.startsAt;
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const uid = `${s.id}@course-${courseId}.new-knowledge`;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${formatIcsUtc(new Date())}`,
      `DTSTART:${formatIcsUtc(start)}`,
      `DTEND:${formatIcsUtc(end)}`,
      `SUMMARY:${icsEscape(s.title)}`,
      `DESCRIPTION:${icsEscape(`${course.title} — ${s.title}`)}`,
      s.meetingUrl ? `URL:${icsEscape(s.meetingUrl)}` : "",
      s.meetingUrl ? `LOCATION:${icsEscape(s.meetingUrl)}` : "",
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");

  const body = lines.filter(Boolean).join("\r\n");

  return new NextResponse(body, {
    status: 200,
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="course-${courseId}.ics"`,
    },
  });
}
