import Link from "next/link";
import { Fragment } from "react";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { requireParticipant } from "@/lib/auth";
import { getCourseChatStaffIds } from "@/lib/chat-staff";
import { db } from "@/lib/db";
import { requireApprovedEnrollment } from "@/lib/guards";
import { ChatComposerClient } from "@/components/chat-composer-client";
import type { ChatActionState } from "@/components/chat-types";
import { LiveRefresh } from "@/components/live-refresh";
import {
  ChatBubble,
  ChatComposerCard,
  ChatDayDivider,
  ChatScrollBody,
  ChatThreadCard,
  ChatThreadEmpty,
  chatComposerFormClass,
  formatChatDay,
  formatChatTime,
  sameCalendarDay,
} from "@/components/course-chat-ui";
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

  return (
    <div className="page-wrap gap-6">
      <PageHeader
        eyebrow="التواصل الرسمي"
        title="المحادثات مع فريق المنصة"
        subtitle={`${course.title} · يُحدَّث تلقائيًا كل ثانيتين.`}
        actions={
          <Link href={`/courses/${courseId}`} className="nk-btn nk-btn-secondary text-sm">
            مركز الدورة
          </Link>
        }
      />

      <ChatThreadCard
        header={
          <div className="flex items-center justify-between gap-3">
            <span>المحادثة مع فريق المنصة لهذه الدورة</span>
            <LiveRefresh everyMs={2000} showStatus />
          </div>
        }
        className="max-h-[min(52vh,28rem)]"
      >
        <ChatScrollBody scrollAreaId="learner-chat-scroll" messageCount={messages.length}>
          {messages.length === 0 ? (
            <ChatThreadEmpty
              title="لا توجد رسائل بعد"
              text="يرجى بدء المراسلة مع الإدارة. ستظهر الردود هنا فور وصولها."
            />
          ) : (
            messages.map((m, i) => {
              const mine = m.senderId === user.id;
              const prev = messages[i - 1];
              const d = new Date(m.createdAt);
              const showDay =
                !prev || !sameCalendarDay(new Date(prev.createdAt), d);
              return (
                <Fragment key={m.id}>
                  {showDay ? <ChatDayDivider label={formatChatDay(d)} /> : null}
                  <ChatBubble
                    align={mine ? "end" : "start"}
                    variant={mine ? "sent" : "received"}
                    body={m.text}
                    timeLabel={formatChatTime(d)}
                    roleLabel={mine ? "أنت" : "الدعم"}
                  />
                </Fragment>
              );
            })
          )}
        </ChatScrollBody>
      </ChatThreadCard>

      <ChatComposerCard>
        <ChatComposerClient
          action={sendMessageAction}
          className={chatComposerFormClass}
          textareaId="chat-text"
          textareaName="text"
          label="رسالة جديدة"
          placeholder="اكتب رسالتك هنا..."
          submitLabel="إرسال"
          hiddenFields={<input type="hidden" name="courseId" value={courseId} />}
        />
      </ChatComposerCard>
    </div>
  );
}
