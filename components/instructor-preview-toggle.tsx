import { enterPreviewAction } from "@/lib/course-preview";

/**
 * «عرض كمتدرب» — opens the participant view of this course in preview mode.
 * Renders as a small inline form so it can be dropped into hero card actions
 * without pulling in client-side state.
 */
export function InstructorPreviewToggle({
  courseId,
  className = "",
}: {
  courseId: string;
  className?: string;
}) {
  const submit = enterPreviewAction.bind(null, courseId);
  return (
    <form action={submit} className={`inline-flex ${className}`.trim()}>
      <button
        type="submit"
        className="nk-btn nk-btn-secondary inline-flex items-center gap-1.5 text-sm"
        title="افتح صفحات الدورة كما يراها المتدرب"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.6}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.036 12.322a1.012 1.012 0 010-.644C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .644C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        <span>عرض كمتدرب</span>
      </button>
    </form>
  );
}
