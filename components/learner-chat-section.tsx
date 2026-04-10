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

export function LearnerChatSection({
  courseId,
  userId,
  initialMessages,
  sendMessageAction,
}: {
  courseId: string;
  userId: string;
  initialMessages: ChatMessageDTO[];
  sendMessageAction: (prev: ChatActionState, formData: FormData) => Promise<ChatActionState>;
}) {
  const threadRef = useRef<ChatThreadLiveHandle>(null);

  return (
    <>
      <ChatThreadCard
        header={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>المحادثة مع فريق المنصة لهذه الدورة</span>
            <span className="text-xs text-[var(--text-muted)]">تحديث تلقائي كل 8 ثوانٍ عند عرض الصفحة</span>
          </div>
        }
        className="max-h-[min(52vh,28rem)]"
      >
        <ChatThreadLive
          key="learner-thread"
          ref={threadRef}
          courseId={courseId}
          variant="learner"
          currentUserId={userId}
          initialMessages={initialMessages}
          scrollAreaId="learner-chat-scroll"
          emptyTitle="لا توجد رسائل بعد"
          emptyText="يرجى بدء المراسلة مع الإدارة. ستظهر الردود هنا فور وصولها."
          theirLabel="الدعم"
        />
      </ChatThreadCard>

      <ChatComposerCard>
        <ChatComposerClient
          action={sendMessageAction}
          onSendSuccess={() => void threadRef.current?.refresh()}
          className={chatComposerFormClass}
          textareaId="chat-text"
          textareaName="text"
          label="رسالة جديدة"
          placeholder="اكتب رسالتك..."
          submitLabel="إرسال"
          hiddenFields={<input type="hidden" name="courseId" value={courseId} />}
        />
      </ChatComposerCard>
    </>
  );
}
