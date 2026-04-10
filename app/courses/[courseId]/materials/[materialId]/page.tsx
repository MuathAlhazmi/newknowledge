import { notFound } from "next/navigation";
import { requireParticipant } from "@/lib/auth";
import { recordMaterialOpened } from "@/lib/course-progress";
import { db } from "@/lib/db";
import { requireApprovedEnrollment } from "@/lib/guards";
import { Card, PageHeader } from "@/components/ui";

export default async function MaterialViewerPage({
  params,
}: {
  params: Promise<{ courseId: string; materialId: string }>;
}) {
  const user = await requireParticipant();
  const { courseId, materialId } = await params;
  const approved = await requireApprovedEnrollment(user.id, courseId);
  if (!approved) notFound();

  const material = await db.material.findFirst({
    where: { id: materialId, courseId },
  });
  if (!material) notFound();

  await recordMaterialOpened(user.id, materialId, courseId);

  return (
    <div className="page-wrap gap-5">
      <PageHeader title={material.title} subtitle="عرض مباشر داخل المنصة بدون تحميل." />
      <Card className="p-2">
        <iframe
          src={`/api/courses/${courseId}/materials/${materialId}/pdf#toolbar=0`}
          title={material.title}
          className="h-[75vh] w-full rounded-xl border-0 bg-white"
        />
      </Card>
    </div>
  );
}
