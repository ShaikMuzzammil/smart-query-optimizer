// app/api/health/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const geminiOk = !!process.env.GEMINI_API_KEY;
  const anthropicOk = !!process.env.ANTHROPIC_API_KEY;
  const aiOk = geminiOk || anthropicOk;
  const infraOk = !!(process.env.DATABASE_URL && process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_URL);

  let dbOk = false, dbDetail = "Not connected", schemaOk = false;
  try {
    const start = Date.now();
    await db.$queryRaw`SELECT 1`;
    dbOk = true;
    dbDetail = `Connected (${Date.now() - start}ms)`;
    try { await db.user.count(); schemaOk = true; } catch { schemaOk = false; }
  } catch { dbOk = false; }

  const aiLabel = geminiOk && anthropicOk
    ? "Dual engine active (primary + fallback)"
    : geminiOk
      ? "Query engine connected"
      : anthropicOk
        ? "Fallback engine only"
        : "No engine configured — add GEMINI_API_KEY";

  const allOk = aiOk && infraOk && dbOk && schemaOk;
  return NextResponse.json({
    status: allOk ? "healthy" : "degraded",
    services: {
      ai_engine:      { ok: aiOk,     label: aiLabel },
      infrastructure: { ok: infraOk,  label: infraOk ? "Configuration complete" : "Missing env vars" },
      database:       { ok: dbOk,     label: dbDetail },
      schema:         { ok: schemaOk, label: schemaOk ? "Schema verified" : "Schema pending migration" },
    },
    timestamp: new Date().toISOString(),
  }, { status: allOk ? 200 : 500 });
}
