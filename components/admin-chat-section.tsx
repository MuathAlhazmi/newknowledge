"use client";

import { useRef } from "react";
import type { ChatMessageDTO } from "@/lib/chat-messages-api";
import { ChatComposerClient } from "@/components/chat-composer-client";
import type { ChatActionState } from "@/components/chat-types";
import {
  ChatComposerCard,
  ChatThreadCard,
  chatComposerFormClass,
} from "@/components/course-chat-ui";
import { ChatThreadLive, type ChatThreadLiveHandle } from "@/components/chat-thread-live";

export function AdminChatSection({
  courseId,
  staffUserId,
  participantId,
  participantName,
  initialMessages,
  sendStaffMessageAction,
  canEdit,
}: {
  courseId: string;
  staffUserId: string;
  participantId: string;
  participantName: string;
  initialMessages: ChatMessageDTO[];
  sendStaffMessageAction: (prev: ChatActionState, formData: FormData) => Promise<ChatActionState>;
  canEdit: boolean;
}) {
  const threadRef = useRef<ChatThreadLiveHandle>(null);

  return (
    <>
      <ChatThreadCard
        header={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>
              سجل المحادثة مع {participantName}
            </span>
            <span className="text-xs text-[var(--text-muted)]">تحديث تلقائي كل 8 ثوانٍ عند عرض الصفحة</span>
          </div>
        }
        className="max-h-[min(52vh,28rem)]"
      >
        <ChatThreadLive
          key={participantId}
          ref={threadRef}
          courseId={courseId}
          variant="admin"
          participantId={participantId}
          currentUserId={staffUserId}
          initialMessages={initialMessages}
          scrollAreaId="admin-chat-scroll"
          emptyTitle="لا توجد رسائل بعد"
          emptyText="لم تُسجَّل رسائل مع هذا المتدرب بعد. يمكنك بدء المحادثة من الأسفل."
          participantRoleLabel={participantName}
          theirLabel="المتدرب"
          mineLabel="أنت"
        />
      </ChatThreadCard>

      {canEdit ? (
        <ChatComposerCard>
          <ChatComposerClient
            action={sendStaffMessageAction}
            onSendSuccess={() => void threadRef.current?.refresh()}
            className={chatComposerFormClass}
            textareaId="admin-chat-text"
            textareaName="text"
            label="رسالة جديدة"
            placeholder={`رد إلى ${participantName}...`}
            submitLabel="إرسال"
            hiddenFields={
              <>
                <input type="hidden" name="courseId" value={courseId} />
                <input type="hidden" name="participantId" value={participantId} />
              </>
            }
          />
        </ChatComposerCard>
      ) : (
        <p className="text-sm text-[var(--text-muted)]">صلاحية عرض فقط — لا يمكن إرسال رسائل جديدة إلى المتدربين.</p>
      )}
    </>
  );
}
