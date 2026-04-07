"use server";

import { UserRole } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { arCopy } from "@/lib/copy/ar";
import { db } from "@/lib/db";

export type ProfileState = { ok: true; message: string } | { ok: false; message: string } | null;

function normalizePhone(raw: string) {
  return raw.trim().replace(/\s+/g, "");
}

export async function updateProfileAction(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const profileCopy = arCopy.profile ?? {
    saved: "تم تحديث بيانات الملف الشخصي بنجاح.",
    errors: {
      notAllowed: "هذه الصفحة مخصصة للمدرب والمتدرب فقط.",
      nameRequired: "يرجى إدخال الاسم الكامل.",
      phoneInvalid: "يرجى إدخال رقم جوال صالح (8 أحرف على الأقل).",
      phoneTaken: "رقم الجوال مسجّل مسبقًا.",
    },
  };

  const user = await requireUser();
  if (user.role !== UserRole.INSTRUCTOR && user.role !== UserRole.PARTICIPANT) {
    return { ok: false, message: profileCopy.errors.notAllowed };
  }

  const name = String(formData.get("name") ?? "").trim();
  const phone = normalizePhone(String(formData.get("phone") ?? ""));

  if (!name) return { ok: false, message: profileCopy.errors.nameRequired };
  if (phone.length < 8 || !/^[\d+][\d\s\-+()]*$/.test(phone)) {
    return { ok: false, message: profileCopy.errors.phoneInvalid };
  }

  const phoneOwner = await db.user.findFirst({
    where: {
      phone,
      id: { not: user.id },
    },
    select: { id: true },
  });
  if (phoneOwner) return { ok: false, message: profileCopy.errors.phoneTaken };

  await db.user.update({
    where: { id: user.id },
    data: { name, phone },
  });

  return { ok: true, message: profileCopy.saved };
}
