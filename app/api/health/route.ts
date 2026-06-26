// app/api/health/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const aiOk = !!(process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY);
  const infraOk = !!(process.env.DATABASE_URL && process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_URL);

  let dbOk = false;
  let dbDetail = "Not connected";
  let schemaOk = false;

  try {
    const start = Date.now();
    await db.$queryRaw`SELECT 1`;
    dbOk = true;
    dbDetail = `Connected (${Date.now() - start}ms)`;
    try {
      await db.user.count();
      schemaOk = true;
    } catch { schemaOk = false; }
  } catch { dbOk = false; }

  const allOk = aiOk && infraOk && dbOk && schemaOk;

  return NextResponse.json({
    status: allOk ? "healthy" : "degraded",
    services: {
      ai_engine:     { ok: aiOk,     label: aiOk ? "AI engine connected" : "AI engine unavailable" },
      infrastructure: { ok: infraOk, label: infraOk ? "Configuration complete" : "Configuration incomplete" },
      database:      { ok: dbOk,     label: dbDetail },
      schema:        { ok: schemaOk, label: schemaOk ? "Schema verified" : "Schema pending migration" },
    },
    timestamp: new Date().toISOString(),
  }, { status: allOk ? 200 : 500 });
}
