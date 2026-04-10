"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Hit = {
  type: "course" | "material" | "announcement";
  id: string;
  title: string;
  snippet: string;
  href: string;
  courseTitle?: string;
};

type CourseWorkspaceSearchProps = {
  /** Stacked label + field; compact styles for the primary site header. */
  variant?: "default" | "navbar";
};

/** Enrolled-catalog search (participant course routes). */
export function CourseWorkspaceSearch({ variant = "default" }: CourseWorkspaceSearchProps) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const debouncedFetch = useCallback((value: string) => {
    if (timer.current) clearTimeout(timer.current);
    if (value.trim().length < 2) {
      setHits([]);
      return;
    }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`, { credentials: "same-origin" });
        if (!res.ok) {
          setHits([]);
          return;
        }
        const data = (await res.json()) as { hits?: Hit[] };
        setHits(data.hits ?? []);
      } catch {
        setHits([]);
      } finally {
        setLoading(false);
      }
    }, 280);
  }, []);

  useEffect(() => {
    debouncedFetch(q);
  }, [q, debouncedFetch]);

  useEffect(() => {
    function handlePointerDown(e: MouseEvent | TouchEvent) {
      const el = rootRef.current;
      if (!el || !open) return;
      if (e.target instanceof Node && !el.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [open]);

  const label = useMemo(() => {
    if (loading) return "جارٍ البحث…";
    if (q.trim().length > 0 && q.trim().length < 2) return "اكتب حرفين على الأقل";
    return null;
  }, [loading, q]);

  const isNavbar = variant === "navbar";

  return (
    <div ref={rootRef} className="relative w-full min-w-0">
      <div
        className={
          isNavbar
            ? "flex w-full min-w-0 flex-col gap-1"
            : "flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3"
        }
      >
        <label
          htmlFor="course-workspace-search-q"
          className={
            isNavbar
              ? "shrink-0 text-xs font-semibold tracking-wide text-[var(--text-muted)]"
              : "shrink-0 text-sm font-medium text-[var(--foreground)]"
          }
        >
          بحث سريع
        </label>
        <div className="relative min-w-0 flex-1">
          <input
            id="course-workspace-search-q"
            type="search"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="دوراتك، المواد، الإعلانات…"
            className={
              isNavbar
                ? "min-h-[2.25rem] w-full rounded-lg border border-[var(--border)] bg-[var(--background)]/90 px-2.5 py-1.5 text-sm text-[var(--foreground)] shadow-sm placeholder:text-[var(--text-muted)] md:min-h-[2.125rem]"
                : "min-h-[2.75rem] w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-base text-[var(--foreground)] shadow-sm placeholder:text-[var(--text-muted)] sm:min-h-0 sm:py-2 sm:text-sm"
            }
            autoComplete="off"
            enterKeyHint="search"
          />
          {open && (q.trim().length >= 2 || hits.length > 0) ? (
            <div
              className="absolute right-0 left-0 z-[60] mt-1 max-h-[min(50vh,20rem)] overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface)] py-2 shadow-lg sm:max-h-[min(70vh,24rem)]"
              role="listbox"
            >
              {label ? <p className="px-3 py-2 text-xs text-[var(--text-muted)]">{label}</p> : null}
              {!loading && hits.length === 0 && q.trim().length >= 2 ? (
                <p className="px-3 py-2 text-sm text-[var(--text-muted)]">لا نتائج مطابقة.</p>
              ) : null}
              {hits.map((h) => (
                <Link
                  key={`${h.type}-${h.id}`}
                  href={h.href}
                  role="option"
                  className="block px-3 py-2.5 text-sm hover:bg-[var(--surface-muted)] active:bg-[var(--surface-muted)] sm:py-2"
                  onClick={() => {
                    setOpen(false);
                    setQ("");
                  }}
                >
                  <span className="font-medium">{h.title}</span>
                  <span className="mr-2 text-[0.65rem] uppercase text-[var(--text-muted)]">
                    {h.type === "course" ? "دورة" : h.type === "material" ? "مادة" : "إعلان"}
                  </span>
                  {h.courseTitle ? (
                    <span className="mt-0.5 block text-xs text-[var(--text-muted)]">{h.courseTitle}</span>
                  ) : null}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
