// app/api/health/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, { ok: boolean; detail: string }> = {};

  // 1. Required env vars present?
  const required = ["DATABASE_URL", "DIRECT_URL", "NEXTAUTH_SECRET", "NEXTAUTH_URL", "ANTHROPIC_API_KEY"];
  for (const key of required) {
    checks[key] = process.env[key]
      ? { ok: true, detail: "set" }
      : { ok: false, detail: "MISSING — add this in Vercel → Settings → Environment Variables" };
  }

  // 2. Raw database connectivity
  try {
    const start = Date.now();
    await db.$queryRaw`SELECT 1`;
    checks.database_connection = { ok: true, detail: `connected in ${Date.now() - start}ms` };
  } catch (err: any) {
    checks.database_connection = {
      ok: false,
      detail: `FAILED: ${(err?.message ?? String(err)).slice(0, 250)}`,
    };
  }

  // 3. Do the actual tables exist? Connection can succeed while tables are
  // missing if `prisma db push` was never run against this database —
  // this is the #1 cause of "works locally, fails on Vercel" registration
  // errors, and a plain SELECT 1 above does NOT catch it.
  try {
    await db.user.count();
    checks.database_schema = { ok: true, detail: "users table exists" };
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    checks.database_schema = {
      ok: false,
      detail: msg.includes("does not exist") || msg.includes("relation")
        ? "Tables not found — run `npx prisma db push` locally against this DATABASE_URL to create them."
        : `FAILED: ${msg.slice(0, 250)}`,
    };
  }

  const allOk = Object.values(checks).every((c) => c.ok);

  return NextResponse.json(
    { status: allOk ? "✅ healthy" : "❌ misconfigured", checks },
    { status: allOk ? 200 : 500 }
  );
}
