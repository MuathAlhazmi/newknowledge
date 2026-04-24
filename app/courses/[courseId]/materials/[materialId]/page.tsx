import { MaterialKind } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireParticipant } from "@/lib/auth";
import { recordMaterialOpened } from "@/lib/course-progress";
import { db } from "@/lib/db";
import { requireApprovedEnrollment } from "@/lib/guards";
import { MaterialPdfIframe } from "@/components/material-pdf-iframe";
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

  if (material.kind === MaterialKind.DOCX) {
    const downloadHref = `/api/courses/${courseId}/materials/${materialId}/file`;
    return (
      <div className="page-wrap gap-5">
        <PageHeader title={material.title} subtitle="هذا الملف متاح للتنزيل بصيغة Word (DOCX)." />
        <Card className="p-6">
          <p className="mb-4 text-sm text-[var(--text-muted)]">
            اضغط الزر أدناه لتنزيل المستند. لا يتوفر معاينة مباشرة لهذا النوع داخل المتصفح.
          </p>
          <a
            href={downloadHref}
            className="nk-btn nk-btn-primary inline-flex items-center gap-2"
            download
          >
            تنزيل DOCX
          </a>
          <div className="mt-6">
            <Link href={`/courses/${courseId}/materials`} className="text-sm font-medium text-[var(--primary-strong)] underline-offset-2 hover:underline">
              العودة إلى قائمة المواد
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-wrap gap-5">
      <PageHeader title={material.title} subtitle="عرض مباشر داخل المنصة بدون تحميل." />
      <Card className="p-2">
        <MaterialPdfIframe
          src={`/api/courses/${courseId}/materials/${materialId}/pdf#toolbar=0`}
          title={material.title}
        />
      </Card>
    </div>
  );
}
