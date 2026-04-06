"use client";

import { useEffect, useRef } from "react";

export function ChatScrollStickiness({
  scrollAreaId,
  messageCount,
}: {
  scrollAreaId: string;
  messageCount: number;
}) {
  const initializedRef = useRef(false);

  useEffect(() => {
    const el = document.getElementById(scrollAreaId);
    if (!el) return;

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distanceFromBottom < 80;

    if (!initializedRef.current || nearBottom) {
      el.scrollTo({ top: el.scrollHeight, behavior: initializedRef.current ? "smooth" : "auto" });
    }

    initializedRef.current = true;
  }, [messageCount, scrollAreaId]);

  return null;
}
