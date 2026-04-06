import { requireInstructor } from "@/lib/auth";
import { db } from "@/lib/db";
import { PdfUploadForm } from "@/components/pdf-upload-form";
import { Card, EmptyState, PageHeader } from "@/components/ui";

export default async function AdminMaterialsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  await requireInstructor();
  const { courseId } = await params;

  const materials = await db.material.findMany({
    where: { courseId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="page-wrap gap-5">
      <PageHeader title="مواد الدورة (PDF)" subtitle="ارفع المواد ونظّمها لعرضها مباشرة داخل المنصة." />
      <PdfUploadForm courseId={courseId} />
      {materials.length === 0 ? (
        <EmptyState text="لم تتم إضافة مواد بعد." />
      ) : (
        <div className="nk-stagger-list grid gap-2">
          {materials.map((material) => (
            <Card key={material.id}>
              <p className="font-medium">{material.title}</p>
              <p className="text-xs text-[var(--text-muted)]">{material.pdfPath}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
