"use client";

import {
  Fragment,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ForwardedRef,
} from "react";
import type { ChatMessageDTO } from "@/lib/chat-messages-api";
import {
  ChatBubble,
  ChatDayDivider,
  ChatScrollBody,
  ChatThreadEmpty,
  formatChatDay,
  formatChatTime,
  sameCalendarDay,
} from "@/components/course-chat-ui";

export type ChatThreadLiveHandle = {
  refresh: () => Promise<void>;
};

type Variant = "learner" | "admin";

export const ChatThreadLive = forwardRef(function ChatThreadLive(
  {
    courseId,
    variant,
    participantId,
    currentUserId,
    initialMessages,
    pollIntervalMs = 8000,
    scrollAreaId,
    emptyTitle = "لا توجد رسائل بعد",
    emptyText = "ابدأ المحادثة من الأسفل.",
    participantRoleLabel,
    mineLabel = "أنت",
    theirLabel = "الدعم",
  }: {
    courseId: string;
    variant: Variant;
    participantId?: string;
    currentUserId: string;
    initialMessages: ChatMessageDTO[];
    pollIntervalMs?: number;
    scrollAreaId: string;
    emptyTitle?: string;
    emptyText?: string;
    participantRoleLabel?: string;
    mineLabel?: string;
    theirLabel?: string;
  },
  ref: ForwardedRef<ChatThreadLiveHandle>,
) {
  const [messages, setMessages] = useState<ChatMessageDTO[]>(initialMessages);
  const lastIdRef = useRef<string | null>(initialMessages.at(-1)?.id ?? null);

  const pollUrl = useMemo(() => {
    if (variant === "learner") {
      return (after: string | null) => {
        const qs = after ? `?after=${encodeURIComponent(after)}` : "";
        return `/api/courses/${courseId}/chat/messages${qs}`;
      };
    }
    return (after: string | null) => {
      const pid = participantId ?? "";
      const qs = new URLSearchParams({ participantId: pid });
      if (after) qs.set("after", after);
      return `/api/admin/courses/${courseId}/chat/messages?${qs.toString()}`;
    };
  }, [courseId, variant, participantId]);

  const fetchFull = useCallback(async () => {
    if (variant === "admin" && !participantId) return;
    const res = await fetch(pollUrl(null), { credentials: "same-origin" });
    if (!res.ok) return;
    const data = (await res.json()) as { messages?: ChatMessageDTO[] };
    const next = data.messages ?? [];
    setMessages(next);
    lastIdRef.current = next.at(-1)?.id ?? null;
  }, [participantId, pollUrl, variant]);

  const fetchIncremental = useCallback(async () => {
    if (variant === "admin" && !participantId) return;
    const after = lastIdRef.current;
    if (!after) return;
    const res = await fetch(pollUrl(after), { credentials: "same-origin" });
    if (!res.ok) return;
    const data = (await res.json()) as { messages?: ChatMessageDTO[] };
    const next = data.messages ?? [];
    if (next.length === 0) return;
    setMessages((prev) => {
      const seen = new Set(prev.map((m) => m.id));
      const merged = [...prev];
      for (const m of next) {
        if (!seen.has(m.id)) {
          seen.add(m.id);
          merged.push(m);
        }
      }
      return merged;
    });
    lastIdRef.current = next.at(-1)?.id ?? lastIdRef.current;
  }, [participantId, pollUrl, variant]);

  useImperativeHandle(
    ref,
    () => ({
      refresh: fetchFull,
    }),
    [fetchFull],
  );

  useEffect(() => {
    if (variant === "admin" && !participantId) return;
    const tick = () => {
      if (document.visibilityState !== "visible") return;
      void fetchIncremental();
    };
    const id = setInterval(tick, pollIntervalMs);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [fetchIncremental, participantId, pollIntervalMs, variant]);

  return (
    <ChatScrollBody scrollAreaId={scrollAreaId} messageCount={messages.length}>
      {messages.length === 0 ? (
        <ChatThreadEmpty title={emptyTitle} text={emptyText} />
      ) : (
        messages.map((m, i) => {
          const mine = m.senderId === currentUserId;
          const prev = messages[i - 1];
          const d = new Date(m.createdAt);
          const showDay = !prev || !sameCalendarDay(new Date(prev.createdAt), d);
          let roleLabel: string;
          if (mine) {
            roleLabel = mineLabel;
          } else if (variant === "admin" && participantId && m.senderId === participantId) {
            roleLabel = participantRoleLabel ?? theirLabel;
          } else {
            roleLabel = theirLabel;
          }
          return (
            <Fragment key={m.id}>
              {showDay ? <ChatDayDivider label={formatChatDay(d)} /> : null}
              <ChatBubble
                align={mine ? "end" : "start"}
                variant={mine ? "sent" : "received"}
                body={m.text}
                timeLabel={formatChatTime(d)}
                roleLabel={roleLabel}
              />
            </Fragment>
          );
        })
      )}
    </ChatScrollBody>
  );
});

ChatThreadLive.displayName = "ChatThreadLive";
