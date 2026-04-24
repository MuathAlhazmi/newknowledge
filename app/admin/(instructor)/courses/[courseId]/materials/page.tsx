import { db } from "@/lib/db";
import { materialFoldersWithLabels } from "@/lib/material-folder-labels";
import { MaterialsAdminTable } from "@/components/materials-admin-table";
import { MaterialFoldersAdmin } from "@/components/material-folders-admin";
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

  const [folderRows, materials] = await Promise.all([
    db.materialFolder.findMany({
      where: { courseId },
      orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, parentId: true, sortOrder: true },
    }),
    db.material.findMany({
      where: { courseId },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, kind: true, folderId: true },
    }),
  ]);

  const foldersForSelect = materialFoldersWithLabels(folderRows);
  const labelById = new Map(foldersForSelect.map((f) => [f.id, f.label]));
  const foldersForFolderAdmin = folderRows.map((r) => ({
    id: r.id,
    name: r.name,
    parentId: r.parentId,
    label: labelById.get(r.id) ?? r.name,
    sortOrder: r.sortOrder,
  }));

  return (
    <div className="page-wrap gap-4">
      <PageHeader title="مواد الدورة" subtitle="ارفع ملفات PDF أو Word، ونظّمها في مجلدات، مع عرض PDF داخل المنصة وتنزيل Word." />
      <MaterialFoldersAdmin courseId={courseId} folders={foldersForFolderAdmin} canEdit={canEdit} />
      <PdfUploadForm courseId={courseId} canEdit={canEdit} folders={foldersForSelect} />
      <MaterialsAdminTable
        courseId={courseId}
        materials={materials}
        folders={foldersForSelect}
        canEdit={canEdit}
      />
      {materials.length === 0 ? <EmptyState text="لم تتم إضافة مواد بعد." /> : null}
    </div>
  );
}
