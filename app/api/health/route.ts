// app/api/health/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, { ok: boolean; detail: string }> = {};

  // ── Required infra vars ──────────────────────────────────────────────────
  const required = ["DATABASE_URL", "DIRECT_URL", "NEXTAUTH_SECRET", "NEXTAUTH_URL"];
  for (const key of required) {
    checks[key] = process.env[key]
      ? { ok: true, detail: "set" }
      : { ok: false, detail: "MISSING — add in Vercel → Settings → Environment Variables" };
  }

  // ── AI providers (at least one required, both optional) ──────────────────
  const hasClaude = !!process.env.ANTHROPIC_API_KEY;
  const hasGemini = !!process.env.GEMINI_API_KEY;

  checks.ANTHROPIC_API_KEY = hasClaude
    ? { ok: true,  detail: "configured — Claude Sonnet (primary engine)" }
    : { ok: false, detail: "not set — add for Claude AI (optional if GEMINI_API_KEY is set)" };

  checks.GEMINI_API_KEY = hasGemini
    ? { ok: true,  detail: "configured — Gemini 2.0 Flash (fallback engine)" }
    : { ok: false, detail: "not set — add for Gemini AI fallback (optional if ANTHROPIC_API_KEY is set). Get free key: aistudio.google.com/apikey" };

  const aiOk = hasClaude || hasGemini;
  const engineDetail = hasClaude && hasGemini
    ? "✓ Claude primary + Gemini fallback (maximum resilience)"
    : hasClaude
    ? "✓ Claude only — add GEMINI_API_KEY for automatic failover"
    : hasGemini
    ? "✓ Gemini only — add ANTHROPIC_API_KEY to use Claude as primary"
    : "✗ No AI provider configured — set ANTHROPIC_API_KEY and/or GEMINI_API_KEY";

  checks.ai_engine = { ok: aiOk, detail: engineDetail };

  // ── Database connectivity ─────────────────────────────────────────────────
  try {
    const start = Date.now();
    await db.$queryRaw`SELECT 1`;
    checks.database_connection = { ok: true, detail: `connected in ${Date.now() - start}ms` };
  } catch (err: any) {
    checks.database_connection = {
      ok: false,
      detail: `FAILED: ${(err?.message ?? String(err)).slice(0, 200)}`,
    };
  }

  // ── Schema existence ──────────────────────────────────────────────────────
  try {
    await db.user.count();
    checks.database_schema = { ok: true, detail: "schema OK — all tables present" };
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    checks.database_schema = {
      ok: false,
      detail: msg.includes("does not exist") || msg.includes("relation")
        ? "Tables missing — trigger a Redeploy in Vercel dashboard to run `prisma db push` automatically"
        : `FAILED: ${msg.slice(0, 200)}`,
    };
  }

  // ── Overall status: healthy if all REQUIRED checks pass ─────────────────
  // ANTHROPIC_API_KEY and GEMINI_API_KEY are individually optional —
  // only ai_engine (which checks at least one is set) must be ok.
  const optionalKeys = new Set(["ANTHROPIC_API_KEY", "GEMINI_API_KEY"]);
  const criticalFailed = Object.entries(checks)
    .filter(([k]) => !optionalKeys.has(k))
    .some(([, v]) => !v.ok);

  const status = criticalFailed ? "❌ misconfigured" : "✅ healthy";

  return NextResponse.json(
    { status, checks },
    { status: criticalFailed ? 500 : 200 }
  );
}
