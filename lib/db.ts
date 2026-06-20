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
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "[db.ts] DATABASE_URL is not set. Add it in Vercel → Project Settings → Environment Variables (Production + Preview + Development), then redeploy."
    );
  }
  const pool = new Pool({ connectionString });
  const adapter = new PrismaNeon(pool);
  return new PrismaClient({ adapter, log: ["error", "warn"] });
}

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
