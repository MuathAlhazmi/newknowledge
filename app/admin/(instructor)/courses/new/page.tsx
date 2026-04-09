import Link from "next/link";
import { PageHeader } from "@/components/ui";
import { CreateCourseForm } from "@/components/create-course-form";

export default function NewCoursePage() {
  return (
    <div className="page-wrap gap-6">
      <PageHeader
        eyebrow="المدرب"
        title="إنشاء دورة جديدة"
        subtitle="ستُسجَّل كمسؤول الدورة ويمكنك دعوة مدربين مشاركين من صفحة الدورة."
        actions={
          <Link href="/admin/courses" className="nk-btn nk-btn-secondary text-sm">
            إلغاء
          </Link>
        }
      />
      <CreateCourseForm />
    </div>
  );
}
