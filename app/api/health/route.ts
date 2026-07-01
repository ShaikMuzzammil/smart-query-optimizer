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
  const details: Record<string, string> = {};

  // Database
  try {
    await db.$queryRaw`SELECT 1`;
    checks.database = "ok";
  } catch (e) {
    details.database = e instanceof Error ? e.message : "unknown error";
  }

  // AI engine — actually ping the model, not just check the key exists.
  // A missing/invalid key, a dead model ID, or a quota/region issue all show
  // up here instead of silently breaking Optimizer + NL to SQL.
  if (!process.env.GEMINI_API_KEY) {
    checks.ai = "missing";
    details.ai = "GEMINI_API_KEY is not set";
  } else {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "Reply with the single word: ok" }] }],
            generationConfig: { maxOutputTokens: 8 },
          }),
        }
      );
      if (res.ok) {
        checks.ai = "ok";
      } else {
        checks.ai = "error";
        const body = await res.text().catch(() => "");
        details.ai = `HTTP ${res.status}: ${body.slice(0, 150)}`;
      }
    } catch (e) {
      checks.ai = "error";
      details.ai = e instanceof Error ? e.message : "unknown error";
    }
  }

  // NextAuth
  checks.nextauth = process.env.NEXTAUTH_SECRET ? "ok" : "missing";

  const allOk = Object.values(checks).every((v) => v === "ok");

  return NextResponse.json(
    { status: allOk ? "healthy" : "degraded", checks, details, ts: new Date().toISOString() },
    { status: allOk ? 200 : 503 }
  );
}
