import { MaterialKind } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";
import { recordMaterialOpened } from "@/lib/course-progress";
import { db } from "@/lib/db";
import { materialSuggestedDownloadName } from "@/lib/material-content-disposition";
import { requireCourseLearnerView } from "@/lib/course-preview";
import { MaterialPdfIframe } from "@/components/material-pdf-iframe";
import { Card, PageHeader } from "@/components/ui";

export default async function MaterialViewerPage({
  params,
}: {
  params: Promise<{ courseId: string; materialId: string }>;
}) {
  const { courseId, materialId } = await params;
  const { user, mode } = await requireCourseLearnerView(courseId);

  const material = await db.material.findFirst({
    where: { id: materialId, courseId },
  });
  if (!material) notFound();

  if (mode === "learner") {
    await recordMaterialOpened(user.id, materialId, courseId);
  }

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
            download={materialSuggestedDownloadName(material.title, "docx")}
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

  if (material.kind === MaterialKind.PDF) {
    const pdfSrc = `/api/courses/${courseId}/materials/${materialId}/pdf#toolbar=0`;
    const pdfOpenHref = `/api/courses/${courseId}/materials/${materialId}/pdf`;
    const downloadHref = `/api/courses/${courseId}/materials/${materialId}/file`;
    return (
      <div className="page-wrap gap-5">
        <PageHeader
          title={material.title}
          subtitle="معاينة داخل المتصفح، أو فتح الملف في صفحة جديدة، أو تنزيله كملف PDF."
        />
        <Card className="p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            <a
              href={pdfOpenHref}
              target="_blank"
              rel="noopener noreferrer"
              className="nk-btn nk-btn-secondary inline-flex items-center gap-2 text-sm"
            >
              فتح في صفحة جديدة
            </a>
            <a
              href={downloadHref}
              className="nk-btn nk-btn-primary inline-flex items-center gap-2 text-sm"
              download={materialSuggestedDownloadName(material.title, "pdf")}
            >
              تنزيل
            </a>
          </div>
          <MaterialPdfIframe src={pdfSrc} title={material.title} />
          <div className="mt-4 px-2 pb-2">
            <Link
              href={`/courses/${courseId}/materials`}
              className="text-sm font-medium text-[var(--primary-strong)] underline-offset-2 hover:underline"
            >
              العودة إلى قائمة المواد
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  notFound();
}
