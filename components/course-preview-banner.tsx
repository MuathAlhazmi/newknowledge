import { exitPreviewAction } from "@/lib/course-preview";

/**
 * Top-of-page banner shown to course staff who are previewing a course as a
 * learner. Renders inside the participant course layout when the helper says
 * `mode === "preview"`.
 */
export function CoursePreviewBanner({ courseId }: { courseId: string }) {
  const submit = exitPreviewAction.bind(null, courseId);
  return (
    <div
      role="status"
      className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-2 border-b border-amber-300/70 bg-amber-50/95 px-3 py-2 text-amber-950 shadow-sm backdrop-blur-sm dark:border-amber-400/30 dark:bg-amber-900/60 dark:text-amber-50"
      dir="rtl"
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-900 dark:bg-amber-400/30 dark:text-amber-50"
          aria-hidden
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.036 12.322a1.012 1.012 0 010-.644C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .644C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </span>
        <p className="truncate text-sm font-medium">
          أنت تشاهد الدورة كما يراها المتدرب — وضع للقراءة فقط، لن تُحفظ أي تغييرات.
        </p>
      </div>
      <form action={submit} className="shrink-0">
        <button
          type="submit"
          className="nk-btn nk-btn-secondary !border-amber-400/70 !bg-amber-100 !text-amber-950 hover:!bg-amber-200 dark:!bg-amber-400/20 dark:!text-amber-50 text-xs sm:text-sm"
        >
          إنهاء العرض
        </button>
      </form>
    </div>
  );
}
