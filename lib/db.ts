import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Acrescenta limites de pool à connection string adequados ao pooler do
 * Supabase (pgbouncer). Em ambiente serverless cada instância deve usar
 * `connection_limit=1` para não esgotar o pooler partilhado (Prisma P2024);
 * `pool_timeout` evita esperas indefinidas quando o pool está saturado.
 *
 * Configurável por ambiente (`PRISMA_CONNECTION_LIMIT` / `PRISMA_POOL_TIMEOUT`),
 * com fallbacks seguros. Params já presentes na URL são respeitados.
 * Devolve `undefined` quando não há `DATABASE_URL` (Prisma cai no schema).
 */
function urlComPool(): string | undefined {
  const base = process.env.DATABASE_URL;
  if (!base) return undefined;
  try {
    const url = new URL(base);
    if (!url.searchParams.has("connection_limit")) {
      url.searchParams.set(
        "connection_limit",
        process.env.PRISMA_CONNECTION_LIMIT ?? "1",
      );
    }
    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set(
        "pool_timeout",
        process.env.PRISMA_POOL_TIMEOUT ?? "20",
      );
    }
    return url.toString();
  } catch {
    // URL não parseável — devolve intacta, sem quebrar o arranque.
    return base;
  }
}

const datasourceUrl = urlComPool();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    ...(datasourceUrl ? { datasources: { db: { url: datasourceUrl } } } : {}),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
