import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/** Supabase transaction pooler (PgBouncer) must use `pgbouncer=true` or Prisma can hit "prepared statement does not exist" (Postgres 26000). */
function normalizeSupabasePoolerDatabaseUrl(url: string): string {
  const isTxPooler =
    url.includes(".pooler.supabase.com") && url.includes(":6543");
  if (!isTxPooler) return url;
  if (/[?&]pgbouncer=true(?:&|$)/.test(url)) return url;
  return url.includes("?") ? `${url}&pgbouncer=true` : `${url}?pgbouncer=true`;
}

function createClient() {
  const raw = process.env.DATABASE_URL;
  const url = raw ? normalizeSupabasePoolerDatabaseUrl(raw) : undefined;
  return new PrismaClient({
    ...(url ? { datasources: { db: { url } } } : {}),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = createClient();
}

export const db = globalForPrisma.prisma;
