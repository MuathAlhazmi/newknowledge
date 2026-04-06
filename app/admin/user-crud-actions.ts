"use server";

import { revalidatePath } from "next/cache";
import { UserRole } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { arCopy } from "@/lib/copy/ar";
import { db } from "@/lib/db";
import {
  deleteAuthUserByEmail,
  findAuthUserIdByEmail,
  updateAuthUserByEmail,
} from "@/lib/supabase-admin-user";

export type UpdateUserCrudState =
  | { kind: "success"; message: string }
  | { kind: "error"; message: string }
  | null;

function parseRole(raw: string): UserRole {
  const u = raw.toUpperCase();
  if (u === "ADMIN") return UserRole.ADMIN;
  if (u === "INSTRUCTOR") return UserRole.INSTRUCTOR;
  return UserRole.PARTICIPANT;
}

export async function updatePlatformUserCrudAction(
  _prev: UpdateUserCrudState,
  formData: FormData,
): Promise<UpdateUserCrudState> {
  const admin = await requireAdmin();
  const userId = String(formData.get("userId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim().replace(/\s+/g, "");
  const role = parseRole(String(formData.get("role") ?? "PARTICIPANT"));
  const platformApproved = formData.get("platformApproved") === "on";
  const newPassword = String(formData.get("newPassword") ?? "").trim();

  if (!userId || !name || !email || !phone) {
    return { kind: "error", message: "يرجى تعبئة الاسم والبريد والجوال." };
  }

  if (newPassword && newPassword.length < 8) {
    return { kind: "error", message: "كلمة المرور الجديدة يجب ألا تقل عن ٨ أحرف أو اترك الحقل فارغًا." };
  }

  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) {
    return { kind: "error", message: "المستخدم غير موجود." };
  }

  if (target.id === admin.id) {
    return { kind: "error", message: "لا يمكنك تعديل حسابك من هنا؛ استخدم إعدادات الحساب." };
  }

  const emailTaken = await db.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" }, NOT: { id: userId } },
  });
  if (emailTaken) {
    return { kind: "error", message: "البريد مستخدم لمستخدم آخر." };
  }

  const phoneTaken = await db.user.findFirst({
    where: { phone, NOT: { id: userId } },
  });
  if (phoneTaken) {
    return { kind: "error", message: "الجوال مستخدم لمستخدم آخر." };
  }

  if (target.role === UserRole.ADMIN && role !== UserRole.ADMIN) {
    const admins = await db.user.count({ where: { role: UserRole.ADMIN } });
    if (admins <= 1) {
      return { kind: "error", message: "لا يمكن تغيير دور آخر إداري في المنصة." };
    }
  }

  const oldEmailLower = target.email.trim().toLowerCase();
  const emailChanged = email !== oldEmailLower;
  if (emailChanged || newPassword) {
    const authId = await findAuthUserIdByEmail(oldEmailLower);
    if (!authId) {
      return {
        kind: "error",
        message: arCopy.adminUserHub.updateRequiresAuthUser,
      };
    }
  }

  const authSync = await updateAuthUserByEmail(oldEmailLower, {
    email: emailChanged ? email : undefined,
    password: newPassword || undefined,
    name,
    phone,
  });
  if (!authSync.ok) {
    return { kind: "error", message: authSync.message };
  }

  const approved =
    role === UserRole.PARTICIPANT ? platformApproved : true;

  try {
    await db.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        phone,
        role,
        platformApproved: approved,
      },
    });
  } catch (e) {
    return {
      kind: "error",
      message: e instanceof Error ? e.message : "تعذر حفظ التغييرات في قاعدة البيانات.",
    };
  }

  revalidatePath("/admin");
  return { kind: "success", message: arCopy.adminUserHub.userUpdatedSuccess };
}

export type DeleteUserCrudResult =
  | { ok: true; warning?: string }
  | { ok: false; message: string };

export async function deletePlatformUserCrudAction(userId: string): Promise<DeleteUserCrudResult> {
  const admin = await requireAdmin();
  if (!userId) return { ok: false, message: "معرّف المستخدم غير صالح." };

  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target) return { ok: false, message: "المستخدم غير موجود." };

  if (target.id === admin.id) {
    return { ok: false, message: "لا يمكنك حذف حسابك أثناء تسجيل الدخول." };
  }

  if (target.role === UserRole.ADMIN) {
    const admins = await db.user.count({ where: { role: UserRole.ADMIN } });
    if (admins <= 1) {
      return { ok: false, message: "لا يمكن حذف آخر حساب إداري في المنصة." };
    }
  }

  const emailLower = target.email.trim().toLowerCase();

  try {
    await db.user.delete({ where: { id: userId } });
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "تعذر حذف المستخدم من قاعدة البيانات.",
    };
  }

  revalidatePath("/admin");

  const authDel = await deleteAuthUserByEmail(emailLower);
  if (!authDel.ok) {
    return { ok: true, warning: arCopy.adminUserHub.userDeletedAuthWarning };
  }

  return { ok: true };
}
