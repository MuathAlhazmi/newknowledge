"use client";

import { useEffect, useState } from "react";

export function ZoomBrowserReminders({
  sessions,
}: {
  sessions: { id: string; title: string; startsAt: string }[];
}) {
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">("unsupported");

  useEffect(() => {
    queueMicrotask(() => {
      if (typeof window !== "undefined" && "Notification" in window) {
        setPerm(Notification.permission);
      } else {
        setPerm("unsupported");
      }
    });
  }, []);

  useEffect(() => {
    if (perm !== "granted" || sessions.length === 0) return;
    const timers: number[] = [];
    const now = Date.now();
    for (const s of sessions) {
      const t = new Date(s.startsAt).getTime();
      const fire = t - 10 * 60 * 1000;
      const delay = fire - now;
      if (delay > 0 && delay < 1000 * 60 * 60 * 24 * 14) {
        const id = window.setTimeout(() => {
          try {
            new Notification(s.title, { body: "تبدأ الجلسة خلال حوالي 10 دقائق." });
          } catch {
            // ignore
          }
        }, delay);
        timers.push(id);
      }
    }
    return () => timers.forEach((tid) => clearTimeout(tid));
  }, [perm, sessions]);

  async function enable() {
    if (!("Notification" in window)) return;
    const p = await Notification.requestPermission();
    setPerm(p);
  }

  if (perm === "unsupported") {
    return <p className="text-xs text-[var(--text-muted)]">المتصفّح لا يدعم التنبيهات أو الوضع الحالي يمنعها.</p>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {perm !== "granted" ? (
        <button type="button" className="nk-btn nk-btn-secondary text-sm" onClick={() => void enable()}>
          طلب إذن التنبيهات للجلسات القادمة
        </button>
      ) : (
        <span className="text-xs text-emerald-800 dark:text-emerald-300">سيتم تنبيهك قبل الجلسات بـ 10 دقائق (في هذه الزيارة).</span>
      )}
    </div>
  );
}
