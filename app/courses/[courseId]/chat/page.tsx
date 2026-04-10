import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { requireParticipant } from "@/lib/auth";
import { getCourseChatStaffIds } from "@/lib/chat-staff";
import { db } from "@/lib/db";
import { requireApprovedEnrollment } from "@/lib/guards";
import type { ChatActionState } from "@/components/chat-types";
import { LearnerChatSection } from "@/components/learner-chat-section";
import { PageHeader } from "@/components/ui";

async function sendMessageAction(
  _prev: ChatActionState,
  formData: FormData,
): Promise<ChatActionState> {
  "use server";
  const sender = await requireParticipant();
  const courseId = String(formData.get("courseId"));
  const text = String(formData.get("text") ?? "").trim();
  if (!text) {
    return { ok: false, message: "يرجى كتابة رسالة قبل الإرسال.", submittedAt: Date.now() };
  }

  const approved = await requireApprovedEnrollment(sender.id, courseId);
  if (!approved) {
    return { ok: false, message: "لا يمكن المراسلة قبل اعتماد التسجيل.", submittedAt: Date.now() };
  }

  const staffIds = await getCourseChatStaffIds(courseId);
  const inboxStaffId = staffIds[0];
  if (!inboxStaffId) {
    return { ok: false, message: "لا يوجد حساب إداري أو مدرب متاح حاليًا.", submittedAt: Date.now() };
  }

  await db.chatMessage.create({
    data: {
      courseId,
      senderId: sender.id,
      receiverId: inboxStaffId,
      text,
    },
  });
  revalidatePath(`/courses/${courseId}/chat`);
  revalidatePath(`/admin/courses/${courseId}/chat`);
  return { ok: true, message: "تم الإرسال بنجاح.", submittedAt: Date.now() };
}

export default async function ChatPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const user = await requireParticipant();
  const { courseId } = await params;
  const approved = await requireApprovedEnrollment(user.id, courseId);
  if (!approved) notFound();

  const staffIds = await getCourseChatStaffIds(courseId);
  if (staffIds.length === 0) notFound();

  const [course, messages] = await Promise.all([
    db.course.findUnique({ where: { id: courseId }, select: { title: true } }),
    db.chatMessage.findMany({
      where: {
        courseId,
        AND: [
          { OR: [{ senderId: user.id }, { receiverId: user.id }] },
          { OR: [{ senderId: { in: staffIds } }, { receiverId: { in: staffIds } }] },
        ],
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  if (!course) notFound();

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
        title="المحادثات مع فريق المنصة"
        subtitle={`${course.title} · تحديث خفيف للرسائل الجديدة دون إعادة تحميل الصفحة بالكامل.`}
        actions={
          <Link href={`/courses/${courseId}`} className="nk-btn nk-btn-secondary text-sm">
            مركز الدورة
          </Link>
        }
      />

      <LearnerChatSection
        courseId={courseId}
        userId={user.id}
        initialMessages={initialMessages}
        sendMessageAction={sendMessageAction}
      />
    </div>
  );
}
