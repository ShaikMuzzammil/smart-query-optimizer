// lib/db.ts
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// Always configure the WebSocket constructor for Node.js serverless runtimes
// (Vercel functions, local dev). This must run unconditionally — checking
// `typeof WebSocket === "undefined"` is unreliable across different Node
// versions/runtimes and was the root cause of silent connection failures.
neonConfig.webSocketConstructor = ws;
// Route simple queries over HTTP fetch instead of opening a full WebSocket
// connection when possible — much more reliable in short-lived serverless
// functions and avoids connection-hang related 500s.
neonConfig.poolQueryViaFetch = true;

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  // NOTE: intentionally do NOT throw here if DATABASE_URL is missing.
  // Next.js imports this module during the build-time "Collecting page
  // data" step for every route that touches `db` — a synchronous throw
  // at module-evaluation time kills the entire build. Prisma + the Neon
  // adapter connect lazily on first query, so an empty/undefined
  // connection string only surfaces as an error when a query actually
  // runs — which our route handlers already catch and report, and which
  // /api/health checks for directly via process.env without touching
  // Prisma at all.
  const connectionString = process.env.DATABASE_URL ?? "";
  const pool = new Pool({ connectionString });
  const adapter = new PrismaNeon(pool);
  return new PrismaClient({ adapter, log: ["error", "warn"] });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
