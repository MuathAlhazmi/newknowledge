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
  const [lastRefreshAt, setLastRefreshAt] = useState<number>(Date.now());

  useEffect(() => {
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
    const secondsAgo = Math.max(0, Math.floor((Date.now() - lastRefreshAt) / 1000));
    if (secondsAgo <= 2) return "آخر تحديث: الآن";
    return `آخر تحديث: منذ ${secondsAgo} ث`;
  }, [isPaused, lastRefreshAt]);

  if (!showStatus) return null;

  return <span className={`text-xs text-[var(--text-muted)] ${className}`}>{statusLabel}</span>;
}
