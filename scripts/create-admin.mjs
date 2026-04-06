/**
 * Create a platform user in Postgres (Prisma) + Supabase Auth (service role).
 *
 * Usage (from repo root):
 *   npm run create-admin -- --email=... --password='8+chars' --name='...' --phone='+966...' [--role=ADMIN|INSTRUCTOR|PARTICIPANT]
 *   npm run create-instructor -- --email=... --password='8+chars' --name='...' --phone='+966...'
 *
 * Loads .env then .env.local from cwd. Requires: DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient, UserRole } from "@prisma/client";

function loadEnvFiles() {
  for (const file of [".env", ".env.local"]) {
    const p = resolve(process.cwd(), file);
    if (!existsSync(p)) continue;
    for (const line of readFileSync(p, "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq <= 0) continue;
      const k = t.slice(0, eq).trim();
      let v = t.slice(eq + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      process.env[k] = v;
    }
  }
}

loadEnvFiles();

function arg(name) {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : null;
}

const email = (arg("email") ?? "").trim().toLowerCase();
const password = arg("password") ?? "";
const name = (arg("name") ?? "").trim() || "مدير المنصة";
const phone = (arg("phone") ?? "").trim().replace(/\s+/g, "");
const roleArg = (arg("role") ?? "ADMIN").toUpperCase();
const role =
  roleArg === "INSTRUCTOR"
    ? UserRole.INSTRUCTOR
    : roleArg === "PARTICIPANT"
      ? UserRole.PARTICIPANT
      : UserRole.ADMIN;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!email || !password || password.length < 8) {
  console.error(
    "Usage: npm run create-admin -- --email=a@b.com --password='8+chars' [--name='الاسم'] --phone='+9665xxxxxxxx' [--role=ADMIN|INSTRUCTOR|PARTICIPANT]",
  );
  process.exit(1);
}

if (!phone || phone.length < 8) {
  console.error("Missing or invalid --phone (min 8 chars, unique in DB).");
  process.exit(1);
}

if (!url || !serviceKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const prisma = new PrismaClient();
const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { email: { equals: email, mode: "insensitive" } },
        { phone },
      ],
    },
  });
  if (existing) {
    console.error("A user with this email or phone already exists in the database.");
    process.exit(1);
  }

  const { data: created, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, phone, full_name: name },
  });

  if (authError || !created?.user) {
    console.error("Supabase Auth error:", authError?.message ?? "unknown");
    process.exit(1);
  }

  try {
    await prisma.user.create({
      data: {
        name,
        email,
        phone,
        role,
        platformApproved: true,
      },
    });
  } catch (e) {
    await supabase.auth.admin.deleteUser(created.user.id);
    console.error("Prisma create failed; removed Auth user.", e);
    process.exit(1);
  }

  console.log("User created:", email, role);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
