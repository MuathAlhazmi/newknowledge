"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export function LiveRefresh({
  everyMs = 2000,
  showStatus = false,
  className = "",
}: {
  everyMs?: number;
  showStatus?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [isPaused, setIsPaused] = useState(false);
  const [lastRefreshAt, setLastRefreshAt] = useState<number>(0);
  const [nowMs, setNowMs] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 1000);
    queueMicrotask(() => setNowMs(Date.now()));
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    queueMicrotask(() => setLastRefreshAt(Date.now()));
    const tick = () => {
      if (document.visibilityState !== "visible") {
        setIsPaused(true);
        return;
      }
      setIsPaused(false);
      router.refresh();
      setLastRefreshAt(Date.now());
    };

    const visibilityListener = () => {
      if (document.visibilityState === "visible") {
        setIsPaused(false);
        router.refresh();
        setLastRefreshAt(Date.now());
      } else {
        setIsPaused(true);
      }
    };

    const id = setInterval(tick, everyMs);
    document.addEventListener("visibilitychange", visibilityListener);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", visibilityListener);
    };
  }, [everyMs, router]);

  const statusLabel = useMemo(() => {
    if (isPaused) return "التحديث التلقائي متوقف (النافذة بالخلفية)";
    if (lastRefreshAt === 0) return "آخر تحديث: الآن";
    const secondsAgo = Math.max(0, Math.floor((nowMs - lastRefreshAt) / 1000));
    if (secondsAgo <= 2) return "آخر تحديث: الآن";
    return `آخر تحديث: منذ ${secondsAgo} ث`;
  }, [isPaused, lastRefreshAt, nowMs]);

  if (!showStatus) return null;

  return <span className={`text-xs text-[var(--text-muted)] ${className}`}>{statusLabel}</span>;
}
