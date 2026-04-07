import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { ProfileForm } from "@/components/profile-form";
import { PageHeader } from "@/components/ui";
import { requireUser, resolveRoleHomePath } from "@/lib/auth";
import { arCopy } from "@/lib/copy/ar";

export default async function ProfilePage() {
  const user = await requireUser();
  if (user.role !== UserRole.INSTRUCTOR && user.role !== UserRole.PARTICIPANT) {
    redirect(resolveRoleHomePath(user));
  }
  const profileCopy = arCopy.profile ?? {
    title: "الملف الشخصي",
    subtitle: "تحديث بياناتك الشخصية الأساسية المستخدمة داخل المنصة.",
  };

  return (
    <div className="page-wrap gap-6">
      <PageHeader title={profileCopy.title} subtitle={profileCopy.subtitle} />
      <ProfileForm initialName={user.name} initialPhone={user.phone} />
    </div>
  );
}
