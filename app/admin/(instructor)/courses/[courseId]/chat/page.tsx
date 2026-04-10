import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { EnrollmentStatus } from "@prisma/client";
import { canEditCourse, requireCourseAccess, requireCourseEditor } from "@/lib/course-staff";
import { getCourseChatStaffIds } from "@/lib/chat-staff";
import { db } from "@/lib/db";
import type { ChatActionState } from "@/components/chat-types";
import { AdminChatSection } from "@/components/admin-chat-section";
import {
  ChatScrollBody,
  ChatThreadCard,
  ChatThreadEmpty,
  ParticipantPillLink,
} from "@/components/course-chat-ui";
import { PageHeader } from "@/components/ui";

async function sendStaffMessageAction(
  _prev: ChatActionState,
  formData: FormData,
): Promise<ChatActionState> {
  "use server";
  const courseId = String(formData.get("courseId"));
  const { user: staff } = await requireCourseEditor(courseId);
  const participantId = String(formData.get("participantId"));
  const text = String(formData.get("text") ?? "").trim();
  if (!participantId) {
    return { ok: false, message: "يرجى اختيار متدرب قبل الإرسال.", submittedAt: Date.now() };
  }
  if (!text) {
    return { ok: false, message: "لا يمكن إرسال رسالة فارغة.", submittedAt: Date.now() };
  }

  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId: participantId, courseId } },
  });
  if (!enrollment || enrollment.status !== EnrollmentStatus.APPROVED) {
    return { ok: false, message: "المتدرب غير معتمد في هذه الدورة.", submittedAt: Date.now() };
  }

  await db.chatMessage.create({
    data: {
      courseId,
      senderId: staff.id,
      receiverId: participantId,
      text,
    },
  });
  revalidatePath(`/admin/courses/${courseId}/chat`);
  revalidatePath(`/courses/${courseId}/chat`);
  return { ok: true, message: "تم الإرسال بنجاح.", submittedAt: Date.now() };
}

export default async function InstructorChatPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ participantId?: string }>;
}) {
  const { courseId } = await params;
  const qs = await searchParams;
  const { user, membership } = await requireCourseAccess(courseId);
  const canEdit = canEditCourse(membership.role);

  const [course, participants, staffIds] = await Promise.all([
    db.course.findUnique({ where: { id: courseId }, select: { title: true } }),
    db.enrollment.findMany({
      where: { courseId, status: EnrollmentStatus.APPROVED },
      include: { user: true },
      orderBy: { user: { name: "asc" } },
    }),
    getCourseChatStaffIds(courseId),
  ]);

  if (!course) notFound();

  const selectedParticipant =
    participants.find((p) => p.userId === qs.participantId) ?? participants[0];
  const participantId = selectedParticipant?.userId;

  const messages =
    participantId && staffIds.length > 0
      ? await db.chatMessage.findMany({
          where: {
            courseId,
            AND: [
              {
                OR: [{ senderId: participantId }, { receiverId: participantId }],
              },
              {
                OR: [{ senderId: { in: staffIds } }, { receiverId: { in: staffIds } }],
              },
            ],
          },
          orderBy: { createdAt: "asc" },
        })
      : [];

  const stripParticipantLabel = selectedParticipant?.user.name ?? null;

  const initialMessages = messages.map((m) => ({
    id: m.id,
    courseId: m.courseId,
    senderId: m.senderId,
    receiverId: m.receiverId,
    text: m.text,
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <div className="page-wrap gap-6">
      <PageHeader
        eyebrow="التواصل الرسمي"
        title="المحادثات مع المتدربين"
        subtitle={`${course.title} · اختر متدربًا لعرض المحادثة · تحديث خفيف للرسائل الجديدة.`}
        actions={
          <Link href={`/admin/courses/${courseId}`} className="nk-btn nk-btn-secondary text-sm">
            صفحة الدورة
          </Link>
        }
      />

      <ChatThreadCard header="المتدربون المعتمدون. اختر محادثة.">
        <div className="flex flex-nowrap gap-2 overflow-x-auto p-3 [-webkit-overflow-scrolling:touch] md:flex-wrap md:overflow-visible">
          {participants.length === 0 ? (
            <p className="px-1 py-2 text-sm text-[var(--text-muted)]">لا يوجد متدربون معتمدون في هذه الدورة بعد.</p>
          ) : (
            participants.map((p) => (
              <ParticipantPillLink
                key={p.userId}
                href={`?participantId=${p.userId}`}
                name={p.user.name}
                selected={selectedParticipant?.userId === p.userId}
              />
            ))
          )}
        </div>
      </ChatThreadCard>

      {!selectedParticipant ? (
        <ChatThreadCard header="لا يوجد متدرب محدد" className="max-h-[min(52vh,28rem)]">
          <ChatScrollBody scrollAreaId="admin-chat-empty-participant" messageCount={0}>
            <ChatThreadEmpty
              title="لا متدرب للعرض"
              text="سيظهر هنا المحادثة عند وجود متدربين معتمدين. اختر اسمهم من القائمة أعلاه."
            />
          </ChatScrollBody>
        </ChatThreadCard>
      ) : staffIds.length === 0 ? (
        <ChatThreadCard header="المحادثات غير متاحة" className="max-h-[min(52vh,28rem)]">
          <ChatScrollBody scrollAreaId="admin-chat-empty-staff" messageCount={0}>
            <ChatThreadEmpty
              title="المحادثات غير متاحة"
              text="يجب وجود مستخدم بدور الإدارة أو التدريب في المنصة حتى تعمل المحادثات مع المتدربين."
            />
          </ChatScrollBody>
        </ChatThreadCard>
      ) : (
        <AdminChatSection
          courseId={courseId}
          staffUserId={user.id}
          participantId={participantId}
          participantName={stripParticipantLabel ?? "المتدرب"}
          initialMessages={initialMessages}
          sendStaffMessageAction={sendStaffMessageAction}
          canEdit={canEdit}
        />
      )}
    </div>
  );
}
