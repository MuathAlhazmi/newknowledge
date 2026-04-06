import Link from "next/link";
import { notFound } from "next/navigation";
import { requireParticipant } from "@/lib/auth";
import { db } from "@/lib/db";
import { requireApprovedEnrollment } from "@/lib/guards";
import { Card, EmptyState, PageHeader } from "@/components/ui";

export default async function MaterialsPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const user = await requireParticipant();
  const { courseId } = await params;
  const approved = await requireApprovedEnrollment(user.id, courseId);
  if (!approved) notFound();

  const materials = await db.material.findMany({ where: { courseId } });
  return (
    <div className="page-wrap gap-5">
      <PageHeader title="محتوى الدورة" subtitle="تصفح ملفات PDF مباشرة من داخل المنصة." />
      {materials.length === 0 ? (
        <EmptyState text="لا توجد مواد متاحة حاليًا." />
      ) : (
        <div className="nk-stagger-list grid gap-3">
          {materials.map((material) => (
            <Card key={material.id}>
              <Link href={`/courses/${courseId}/materials/${material.id}`} className="font-semibold text-[var(--primary-strong)]">
                {material.title}
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
