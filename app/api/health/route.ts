// app/api/health/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, { ok: boolean; detail: string }> = {};

  // 1. Required env vars present?
  const required = ["DATABASE_URL", "DIRECT_URL", "NEXTAUTH_SECRET", "NEXTAUTH_URL"];
  for (const key of required) {
    checks[key] = process.env[key]
      ? { ok: true, detail: "set" }
      : { ok: false, detail: "MISSING — add this in Vercel → Settings → Environment Variables" };
  }

  // 1b. At least one AI provider must be configured — neither is individually
  // "required" since either alone is enough to power the optimizer.
  const hasClaude = !!process.env.ANTHROPIC_API_KEY;
  const hasGemini = !!process.env.GEMINI_API_KEY;
  checks.ANTHROPIC_API_KEY = hasClaude
    ? { ok: true, detail: "set (primary AI engine)" }
    : { ok: false, detail: "not set — optional only if GEMINI_API_KEY is set" };
  checks.GEMINI_API_KEY = hasGemini
    ? { ok: true, detail: "set (automatic fallback engine)" }
    : { ok: false, detail: "not set — optional only if ANTHROPIC_API_KEY is set" };
  checks.ai_provider = (hasClaude || hasGemini)
    ? { ok: true, detail: hasClaude && hasGemini ? "Claude primary + Gemini fallback active" : hasClaude ? "Claude only (set GEMINI_API_KEY for automatic failover)" : "Gemini only (set ANTHROPIC_API_KEY to use Claude as primary)" }
    : { ok: false, detail: "MISSING — set at least one of ANTHROPIC_API_KEY or GEMINI_API_KEY for the optimizer to work" };

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
        ? "Tables not found. This should be automatic (prisma db push runs on every build) — trigger a fresh deploy from the Vercel dashboard (Deployments → ⋯ → Redeploy) to pick that up, or run `npx prisma db push` locally against this DATABASE_URL as a one-time fix."
        : `FAILED: ${msg.slice(0, 250)}`,
    };
  }

  const allOk = Object.values(checks).every((c) => c.ok);

  return NextResponse.json(
    { status: allOk ? "✅ healthy" : "❌ misconfigured", checks },
    { status: allOk ? 200 : 500 }
  );
}
