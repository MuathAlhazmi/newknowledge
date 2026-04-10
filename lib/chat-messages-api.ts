import { EnrollmentStatus, UserRole } from "@prisma/client";
import { db } from "@/lib/db";
import { getCourseChatStaffIds } from "@/lib/chat-staff";

export type ChatMessageDTO = {
  id: string;
  courseId: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: string;
};

function toDTO(row: {
  id: string;
  courseId: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: Date;
}): ChatMessageDTO {
  return {
    id: row.id,
    courseId: row.courseId,
    senderId: row.senderId,
    receiverId: row.receiverId,
    text: row.text,
    createdAt: row.createdAt.toISOString(),
  };
}

async function cursorFromAfterId(afterId: string | null): Promise<{ createdAt: Date; id: string } | null> {
  if (!afterId?.trim()) return null;
  const row = await db.chatMessage.findUnique({
    where: { id: afterId.trim() },
    select: { id: true, createdAt: true },
  });
  return row ?? null;
}

/** Messages strictly after the cursor message (by createdAt, then id). */
function afterCursorWhere(cursor: { createdAt: Date; id: string }) {
  return {
    OR: [
      { createdAt: { gt: cursor.createdAt } },
      { AND: [{ createdAt: cursor.createdAt }, { id: { gt: cursor.id } }] },
    ],
  };
}

export async function fetchLearnerChatMessages(params: {
  courseId: string;
  userId: string;
  afterMessageId?: string | null;
}): Promise<ChatMessageDTO[]> {
  const approved = await db.enrollment.findUnique({
    where: { userId_courseId: { userId: params.userId, courseId: params.courseId } },
  });
  if (!approved || approved.status !== EnrollmentStatus.APPROVED) {
    return [];
  }

  const staffIds = await getCourseChatStaffIds(params.courseId);
  if (staffIds.length === 0) return [];

  const cursor = await cursorFromAfterId(params.afterMessageId ?? null);
  if (params.afterMessageId?.trim() && !cursor) {
    return [];
  }
  const base = {
    courseId: params.courseId,
    AND: [
      { OR: [{ senderId: params.userId }, { receiverId: params.userId }] },
      { OR: [{ senderId: { in: staffIds } }, { receiverId: { in: staffIds } }] },
    ],
    ...(cursor ? afterCursorWhere(cursor) : {}),
  };

  const rows = await db.chatMessage.findMany({
    where: base,
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: 200,
  });
  return rows.map(toDTO);
}

export async function fetchStaffChatMessages(params: {
  courseId: string;
  staffUserId: string;
  participantId: string;
  afterMessageId?: string | null;
}): Promise<ChatMessageDTO[]> {
  const membership = await db.courseInstructor.findUnique({
    where: { courseId_userId: { courseId: params.courseId, userId: params.staffUserId } },
  });
  const user = await db.user.findUnique({
    where: { id: params.staffUserId },
    select: { role: true },
  });
  const isPlatformAdmin = user?.role === UserRole.ADMIN;
  const isCourseStaff = !!membership;
  if (!isPlatformAdmin && !isCourseStaff) {
    return [];
  }

  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId: params.participantId, courseId: params.courseId } },
  });
  if (!enrollment || enrollment.status !== EnrollmentStatus.APPROVED) {
    return [];
  }

  const staffIds = await getCourseChatStaffIds(params.courseId);
  if (staffIds.length === 0) return [];

  const cursor = await cursorFromAfterId(params.afterMessageId ?? null);
  if (params.afterMessageId?.trim() && !cursor) {
    return [];
  }
  const base = {
    courseId: params.courseId,
    AND: [
      {
        OR: [{ senderId: params.participantId }, { receiverId: params.participantId }],
      },
      {
        OR: [{ senderId: { in: staffIds } }, { receiverId: { in: staffIds } }],
      },
    ],
    ...(cursor ? afterCursorWhere(cursor) : {}),
  };

  const rows = await db.chatMessage.findMany({
    where: base,
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: 200,
  });
  return rows.map(toDTO);
}
