import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { requireParticipant } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireApprovedEnrollment } from "@/lib/guards";
import { Card, PageHeader } from "@/components/ui";

async function submitFeedbackAction(formData: FormData) {
  "use server";
  const user = await requireParticipant();
  const courseId = String(formData.get("courseId"));
  const text = String(formData.get("text") ?? "").trim();
  if (!text) return;

  const approved = await requireApprovedEnrollment(user.id, courseId);
  if (!approved) return;

  await db.feedback.create({
    data: { userId: user.id, courseId, text },
  });
  revalidatePath(`/courses/${courseId}/feedback`);
}

export default async function FeedbackPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const user = await requireParticipant();
  const { courseId } = await params;
  const approved = await requireApprovedEnrollment(user.id, courseId);
  if (!approved) notFound();

  const feedbacks = await db.feedback.findMany({
    where: { userId: user.id, courseId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="page-wrap gap-5">
      <PageHeader title="ملاحظاتك" subtitle="شاركنا رأيك لمساعدتنا على تحسين التجربة التدريبية." />
      <Card elevated>
        <form action={submitFeedbackAction} className="grid gap-2">
          <input type="hidden" name="courseId" value={courseId} />
          <textarea name="text" rows={4} required placeholder="اكتب ملاحظتك هنا..." />
          <button type="submit" className="nk-btn nk-btn-primary w-fit">
            إرسال الملاحظة
          </button>
        </form>
      </Card>

      <div className="grid gap-2">
        {feedbacks.map((fb) => (
          <Card key={fb.id} className="text-sm">
            <p>{fb.text}</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {new Date(fb.createdAt).toLocaleString("ar-SA")}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
