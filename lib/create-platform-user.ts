import { createClient } from "@supabase/supabase-js";
import { UserRole } from "@prisma/client";
import { db } from "@/lib/db";

export type CreatePlatformUserInput = {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: UserRole;
  platformApproved?: boolean;
};

const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.PARTICIPANT];

export async function createPlatformUser(input: CreatePlatformUserInput) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("إعدادات Supabase غير مكتملة.");
  }

  if (input.password.length < 8) {
    throw new Error("كلمة المرور يجب ألا تقل عن ٨ أحرف.");
  }

  if (!allowedRoles.includes(input.role)) {
    throw new Error("دور غير مسموح.");
  }

  const email = input.email.trim().toLowerCase();
  const phone = input.phone.trim().replace(/\s+/g, "");
  const name = (input.name ?? "").trim() || email;

  const existing = await db.user.findFirst({
    where: {
      OR: [
        { email: { equals: email, mode: "insensitive" } },
        { phone },
      ],
    },
  });
  if (existing) {
    throw new Error("البريد أو الجوال مستخدم مسبقًا.");
  }

  const supabase = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: created, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: { name, phone, full_name: name },
  });

  if (authError || !created?.user) {
    throw new Error(authError?.message ?? "تعذر إنشاء حساب الدخول.");
  }

  try {
    return await db.user.create({
      data: {
        name,
        email,
        phone,
        role: input.role,
        platformApproved: input.platformApproved ?? true,
      },
    });
  } catch (e) {
    await supabase.auth.admin.deleteUser(created.user.id);
    throw e;
  }
}
