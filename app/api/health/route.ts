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

  // 2. Actual database connectivity (the real test)
  try {
    const start = Date.now();
    await db.$queryRaw`SELECT 1`;
    checks.database = { ok: true, detail: `connected in ${Date.now() - start}ms` };
  } catch (err: any) {
    checks.database = {
      ok: false,
      detail: `FAILED: ${err?.message ?? String(err)}`.slice(0, 300),
    };
  }

  const allOk = Object.values(checks).every((c) => c.ok);

  return NextResponse.json(
    { status: allOk ? "✅ healthy" : "❌ misconfigured", checks },
    { status: allOk ? 200 : 500 }
  );
}
