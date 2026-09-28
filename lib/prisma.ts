import { PrismaClient } from "@prisma/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { createClient } from "@libsql/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Local dev uses the plain SQLite file (via DATABASE_URL in the datasource
 * block) — no adapter needed. When TURSO_DATABASE_URL is set (Vercel /
 * production, see README "Deploying for phone access"), route through the
 * libSQL adapter instead so writes go to the remote Turso database.
 */
function createPrismaClient() {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) return new PrismaClient();

  const libsql = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  return new PrismaClient({ adapter: new PrismaLibSQL(libsql) });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
