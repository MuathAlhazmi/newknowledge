import { enterPreviewAction } from "@/lib/course-preview";
import { PendingSubmitButton } from "@/components/form-pending";

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
      <PendingSubmitButton
        idleText="عرض كمتدرب"
        pendingText="جارٍ فتح العرض..."
        className="nk-btn nk-btn-secondary inline-flex items-center gap-1.5 text-sm"
      />
    </form>
  );
}
