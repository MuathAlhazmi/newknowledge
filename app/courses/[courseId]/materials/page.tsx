import Link from "next/link";
import { MaterialKind } from "@prisma/client";
import { notFound } from "next/navigation";
import { requireParticipant } from "@/lib/auth";
import { db } from "@/lib/db";
import { materialFoldersWithLabels } from "@/lib/material-folder-labels";
import { requireApprovedEnrollment } from "@/lib/guards";
import { Card, EmptyState, PageHeader } from "@/components/ui";

function kindHint(kind: MaterialKind) {
  return kind === MaterialKind.PDF ? "PDF" : "DOCX";
}

export default async function MaterialsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const user = await requireParticipant();
  const { courseId } = await params;
  const approved = await requireApprovedEnrollment(user.id, courseId);
  if (!approved) notFound();

  const [folderRows, materials] = await Promise.all([
    db.materialFolder.findMany({
      where: { courseId },
      orderBy: [{ name: "asc" }],
      select: { id: true, name: true, parentId: true },
    }),
    db.material.findMany({
      where: { courseId },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, kind: true, folderId: true },
    }),
  ]);

  const folderLabels = materialFoldersWithLabels(folderRows);
  const folderName = (id: string) => folderLabels.find((f) => f.id === id)?.label ?? id;

  const rootMaterials = materials.filter((m) => !m.folderId);
  const folderIds = [...new Set(materials.map((m) => m.folderId).filter(Boolean))] as string[];

  return (
    <div className="page-wrap gap-5">
      <PageHeader
        title="محتوى الدورة"
        subtitle="عرض ملفات PDF داخل المنصة، وتنزيل مستندات Word (DOCX) عند الحاجة."
      />
      {materials.length === 0 ? (
        <EmptyState text="لا توجد مواد متاحة حاليًا." />
      ) : (
        <div className="nk-stagger-list grid gap-6">
          {rootMaterials.length > 0 ? (
            <section className="grid gap-2">
              <h2 className="text-sm font-semibold text-[var(--text-muted)]">عام</h2>
              <div className="grid gap-3">
                {rootMaterials.map((material) => (
                  <Card key={material.id}>
                    <Link
                      href={`/courses/${courseId}/materials/${material.id}`}
                      className="font-semibold text-[var(--primary-strong)]"
                    >
                      {material.title}
                    </Link>
                    <span className="ms-2 text-xs text-[var(--text-muted)]">({kindHint(material.kind)})</span>
                  </Card>
                ))}
              </div>
            </section>
          ) : null}
          {folderIds.map((fid) => {
            const inFolder = materials.filter((m) => m.folderId === fid);
            if (inFolder.length === 0) return null;
            return (
              <section key={fid} className="grid gap-2">
                <h2 className="text-sm font-semibold text-[var(--text-muted)]">{folderName(fid)}</h2>
                <div className="grid gap-3">
                  {inFolder.map((material) => (
                    <Card key={material.id}>
                      <Link
                        href={`/courses/${courseId}/materials/${material.id}`}
                        className="font-semibold text-[var(--primary-strong)]"
                      >
                        {material.title}
                      </Link>
                      <span className="ms-2 text-xs text-[var(--text-muted)]">({kindHint(material.kind)})</span>
                    </Card>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
