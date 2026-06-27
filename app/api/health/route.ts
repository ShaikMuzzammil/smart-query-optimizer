// app/api/health/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, "ok" | "error" | "missing"> = {
    database: "error",
    ai:       "missing",
    nextauth: "missing",
  };

  // Database
  try {
    await db.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch {}

  // AI engine
  checks.ai = process.env.GEMINI_API_KEY ? "ok" : "missing";

  // NextAuth
  checks.nextauth = process.env.NEXTAUTH_SECRET ? "ok" : "missing";

  const allOk = Object.values(checks).every((v) => v === "ok");

  return NextResponse.json(
    { status: allOk ? "healthy" : "degraded", checks, ts: new Date().toISOString() },
    { status: allOk ? 200 : 503 }
  );
}
