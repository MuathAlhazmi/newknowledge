import { db } from "@/lib/db";
import { MaterialsAdminTable } from "@/components/materials-admin-table";
import { PdfUploadForm } from "@/components/pdf-upload-form";
import { canEditCourse, requireCourseAccess } from "@/lib/course-staff";
import { EmptyState, PageHeader } from "@/components/ui";

export default async function AdminMaterialsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const { membership } = await requireCourseAccess(courseId);
  const canEdit = canEditCourse(membership.role);

  const materials = await db.material.findMany({
    where: { courseId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="page-wrap gap-5">
      <PageHeader title="مواد الدورة (PDF)" subtitle="ارفع المواد ونظّمها لعرضها مباشرة داخل المنصة." />
      <PdfUploadForm courseId={courseId} canEdit={canEdit} />
      <MaterialsAdminTable
        courseId={courseId}
        materials={materials.map((m) => ({ id: m.id, title: m.title, pdfPath: m.pdfPath }))}
        canEdit={canEdit}
      />
      {materials.length === 0 ? <EmptyState text="لم تتم إضافة مواد بعد." /> : null}
    </div>
  );
}
