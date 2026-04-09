import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Supabase transaction pooler (PgBouncer, port 6543) needs `pgbouncer=true` for Prisma.
 * Also cap `connection_limit` so Prisma does not open dozens of DB connections (pool
 * exhaustion / "Timed out fetching a new connection" on free-tier poolers).
 * @see https://www.prisma.io/docs/guides/database/supabase
 */
function normalizeDatabaseUrl(url: string): string {
  let out = url.trim();
  const isTxPooler =
    out.includes(".pooler.supabase.com") && out.includes(":6543");
  if (isTxPooler) {
    if (!/[?&]pgbouncer=true(?:&|$)/.test(out)) {
      out = out.includes("?") ? `${out}&pgbouncer=true` : `${out}?pgbouncer=true`;
    }
    if (!/[?&]connection_limit=/.test(out)) {
      const limit = process.env.PRISMA_CONNECTION_LIMIT ?? "5";
      out = out.includes("?") ? `${out}&connection_limit=${limit}` : `${out}?connection_limit=${limit}`;
    }
    if (!/[?&]pool_timeout=/.test(out)) {
      out = `${out}&pool_timeout=30`;
    }
  }
  return out;
}

function createClient() {
  const raw = process.env.DATABASE_URL;
  const url = raw ? normalizeDatabaseUrl(raw) : undefined;
  return new PrismaClient({
    ...(url ? { datasources: { db: { url } } } : {}),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = createClient();
}

export const db = globalForPrisma.prisma;
