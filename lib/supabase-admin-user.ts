import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function getServiceClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Resolve Supabase Auth user id by email (paginates listUsers; fine for typical tenant sizes). */
export async function findAuthUserIdByEmail(emailLower: string): Promise<string | null> {
  const supabase = getServiceClient();
  if (!supabase) return null;
  const needle = emailLower.trim().toLowerCase();
  let page = 1;
  const perPage = 1000;
  for (let i = 0; i < 50; i++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error || !data?.users?.length) return null;
    const hit = data.users.find((u) => (u.email ?? "").toLowerCase() === needle);
    if (hit) return hit.id;
    if (data.users.length < perPage) return null;
    page += 1;
  }
  return null;
}

export async function deleteAuthUserByEmail(email: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = getServiceClient();
  if (!supabase) return { ok: false, message: "إعدادات Supabase غير مكتملة." };
  const id = await findAuthUserIdByEmail(email.trim().toLowerCase());
  if (!id) return { ok: true };
  const { error } = await supabase.auth.admin.deleteUser(id);
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}

export async function updateAuthUserByEmail(
  currentEmailLower: string,
  updates: {
    email?: string;
    password?: string;
    name?: string;
    phone?: string;
  },
): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = getServiceClient();
  if (!supabase) return { ok: false, message: "إعدادات Supabase غير مكتملة." };
  const id = await findAuthUserIdByEmail(currentEmailLower);
  if (!id) return { ok: true };

  const attrs: {
    email?: string;
    password?: string;
    user_metadata?: Record<string, string>;
  } = {};
  if (updates.email) attrs.email = updates.email.trim().toLowerCase();
  if (updates.password && updates.password.length >= 8) attrs.password = updates.password;
  if (updates.name !== undefined || updates.phone !== undefined) {
    const name = (updates.name ?? "").trim();
    const phone = (updates.phone ?? "").trim();
    attrs.user_metadata = {
      name,
      phone,
      full_name: name || (attrs.email ?? currentEmailLower),
    };
  }

  if (!attrs.email && !attrs.password && !attrs.user_metadata) {
    return { ok: true };
  }

  const { error } = await supabase.auth.admin.updateUserById(id, attrs);
  if (error) return { ok: false, message: error.message };
  return { ok: true };
}
