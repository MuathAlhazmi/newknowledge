"use client";

import { useCallback, useEffect, useState } from "react";

function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <span
      className={`inline-block shrink-0 rounded-full border-2 border-[var(--border)] border-t-[var(--primary)] ${className} motion-safe:animate-spin`}
      aria-hidden
    />
  );
}

type MaterialPdfIframeProps = {
  src: string;
  title: string;
  className?: string;
};

function MaterialPdfIframeFrame({ src, title, className = "" }: MaterialPdfIframeProps) {
  const [loading, setLoading] = useState(true);

  const finishLoading = useCallback(() => {
    setLoading(false);
  }, []);

  /** PDFs in iframes often omit or delay `onLoad`; avoid a stuck overlay. */
  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 3500);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <div
      className={`relative isolate min-h-0 w-full overscroll-y-contain ${className}`.trim()}
      aria-busy={loading}
    >
      {loading ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-[var(--surface)]/95 backdrop-blur-[2px]">
          <div className="flex flex-col items-center gap-3 text-center" role="status" aria-live="polite">
            <Spinner className="h-8 w-8 border-[3px]" />
            <span className="text-sm font-medium text-[var(--foreground)]">جارٍ تحميل الملف…</span>
          </div>
        </div>
      ) : null}
      {/*
        Bounded height + min-h-0: on iPad Safari, flex ancestors and PDF iframes often steal scroll
        unless this subtree can shrink; overscroll-y-contain reduces scroll chaining to the page.
      */}
      <div className="h-[min(75vh,85dvh)] max-h-[85dvh] w-full overflow-hidden rounded-xl bg-white [-webkit-overflow-scrolling:touch]">
        <iframe
          src={src}
          title={title}
          onLoad={finishLoading}
          onError={finishLoading}
          className="block h-full min-h-[min(75vh,85dvh)] w-full border-0 bg-white"
        />
      </div>
    </div>
  );
}

/** Remount inner frame when `src` changes so loading state resets without an effect. */
export function MaterialPdfIframe(props: MaterialPdfIframeProps) {
  return <MaterialPdfIframeFrame key={props.src} {...props} />;
}
