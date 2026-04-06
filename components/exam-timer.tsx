"use client";

import { useEffect, useState } from "react";

export function ExamTimer({
  durationMinutes,
  startedAtISO,
}: {
  durationMinutes: number;
  startedAtISO: string;
}) {
  const [remainingSeconds, setRemainingSeconds] = useState(() => {
    const end = new Date(startedAtISO).getTime() + durationMinutes * 60_000;
    return Math.max(0, Math.floor((end - Date.now()) / 1000));
  });

  useEffect(() => {
    const id = setInterval(() => {
      const end = new Date(startedAtISO).getTime() + durationMinutes * 60_000;
      setRemainingSeconds(Math.max(0, Math.floor((end - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(id);
  }, [durationMinutes, startedAtISO]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const isUrgent = remainingSeconds <= 300;

  return (
    <div className={`nk-badge text-sm ${isUrgent ? "nk-badge-muted animate-pulse" : "nk-badge-info"} transition-all`}>
      الوقت المتبقي للاختبار: {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
    </div>
  );
}
