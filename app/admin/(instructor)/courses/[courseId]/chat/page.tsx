import Link from "next/link";
import { Fragment } from "react";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { EnrollmentStatus } from "@prisma/client";
import { canEditCourse, requireCourseAccess, requireCourseEditor } from "@/lib/course-staff";
import { getCourseChatStaffIds } from "@/lib/chat-staff";
import { db } from "@/lib/db";
import { ChatComposerClient } from "@/components/chat-composer-client";
import type { ChatActionState } from "@/components/chat-types";
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
  ParticipantPillLink,
  sameCalendarDay,
} from "@/components/course-chat-ui";
import { LiveRefresh } from "@/components/live-refresh";
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
  const { membership } = await requireCourseAccess(courseId);
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
  const participantRoleLabel = stripParticipantLabel ?? "المتدرب";

  return (
    <div className="page-wrap gap-6">
      <PageHeader
        eyebrow="التواصل الرسمي"
        title="المحادثات مع المتدربين"
        subtitle={`${course.title} · اختر متدربًا لعرض المحادثة · يُحدَّث تلقائيًا كل ثانيتين.`}
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

      <ChatThreadCard
        header={
          <div className="flex items-center justify-between gap-3">
            <span>
              {!selectedParticipant
                ? "لا يوجد متدرب محدد"
                : staffIds.length === 0
                  ? "لا يوجد حساب إداري أو مدرب في المنصة. لا يمكن عرض المحادثات."
                  : stripParticipantLabel
                    ? `سجل المحادثة مع ${stripParticipantLabel}`
                    : "سجل المحادثة مع المتدرب المحدد"}
            </span>
            <LiveRefresh everyMs={2000} showStatus />
          </div>
        }
        className="max-h-[min(52vh,28rem)]"
      >
        <ChatScrollBody scrollAreaId="admin-chat-scroll" messageCount={messages.length}>
          {!selectedParticipant ? (
            <ChatThreadEmpty
              title="لا متدرب للعرض"
              text="سيظهر هنا المحادثة عند وجود متدربين معتمدين. اختر اسمهم من القائمة أعلاه."
            />
          ) : staffIds.length === 0 ? (
            <ChatThreadEmpty
              title="المحادثات غير متاحة"
              text="يجب وجود مستخدم بدور الإدارة أو التدريب في المنصة حتى تعمل المحادثات مع المتدربين."
            />
          ) : messages.length === 0 ? (
            <ChatThreadEmpty
              title="لا توجد رسائل بعد"
              text="لم تُسجَّل رسائل مع هذا المتدرب بعد. يمكنك بدء المحادثة من الأسفل."
            />
          ) : (
            messages.map((m, i) => {
              const fromParticipant = m.senderId === participantId;
              const prev = messages[i - 1];
              const d = new Date(m.createdAt);
              const showDay =
                !prev || !sameCalendarDay(new Date(prev.createdAt), d);
              return (
                <Fragment key={m.id}>
                  {showDay ? <ChatDayDivider label={formatChatDay(d)} /> : null}
                  <ChatBubble
                    align={fromParticipant ? "start" : "end"}
                    variant={fromParticipant ? "received" : "sent"}
                    body={m.text}
                    timeLabel={formatChatTime(d)}
                    roleLabel={fromParticipant ? participantRoleLabel : "أنت"}
                  />
                </Fragment>
              );
            })
          )}
        </ChatScrollBody>
      </ChatThreadCard>

      {participantId && staffIds.length > 0 && canEdit ? (
        <ChatComposerCard>
          <ChatComposerClient
            action={sendStaffMessageAction}
            className={chatComposerFormClass}
            textareaId="admin-chat-text"
            textareaName="text"
            label="رسالة جديدة"
            placeholder={`رد إلى ${selectedParticipant?.user.name ?? "المتدرب"}...`}
            submitLabel="إرسال"
            hiddenFields={
              <>
                <input type="hidden" name="courseId" value={courseId} />
                <input type="hidden" name="participantId" value={participantId} />
              </>
            }
          />
        </ChatComposerCard>
      ) : participantId && staffIds.length > 0 && !canEdit ? (
        <p className="text-sm text-[var(--text-muted)]">صلاحية عرض فقط — لا يمكن إرسال رسائل جديدة إلى المتدربين.</p>
      ) : null}
    </div>
  );
}
