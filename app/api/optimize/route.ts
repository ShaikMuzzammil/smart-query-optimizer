// app/api/optimize/route.ts
import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { optimizeSQL, AiParseError, AiUnavailableError } from "@/lib/ai-engine";
import { db } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  query:   z.string().min(3).max(50000),
  dialect: z.string().optional().default("PostgreSQL"),
});

export async function POST(req: Request) {
  try {
    const session = await getAuth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Please sign in to optimize queries." }, { status: 401 });

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: "Paste at least 3 characters of SQL to optimize." }, { status: 400 });

    const { query, dialect } = parsed.data;

    // Rate limit: 20/hour
    const oneHourAgo = new Date(Date.now() - 3_600_000);
    const recent = await db.query.count({ where: { userId: session.user.id, createdAt: { gte: oneHourAgo } } });
    if (recent >= 20)
      return NextResponse.json({ error: "Rate limit: 20 optimizations/hour. Try again later." }, { status: 429 });

    const start = Date.now();
    let result;
    try {
      result = await optimizeSQL(query, dialect);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);

      if (err instanceof AiUnavailableError) {
        return NextResponse.json({
          error: `No AI provider is configured. ${msg}`,
          fix: "Add GEMINI_API_KEY (free at aistudio.google.com/apikey) in Vercel → Settings → Environment Variables, then redeploy.",
        }, { status: 503 });
      }

      if (err instanceof AiParseError)
        return NextResponse.json({ error: "AI returned an unreadable response — please try again." }, { status: 502 });

      const m = msg.toLowerCase();
      if (m.includes("api key") || m.includes("auth") || m.includes("401") || m.includes("invalid")) {
        return NextResponse.json({
          error: "AI engine authentication failed. Your API key may be invalid or expired.",
          fix: "Option 1: Fix your ANTHROPIC_API_KEY in Vercel env vars.\nOption 2: Add a free GEMINI_API_KEY from aistudio.google.com/apikey — it becomes the automatic fallback.",
        }, { status: 500 });
      }

      if (m.includes("rate") || m.includes("429") || m.includes("overload"))
        return NextResponse.json({ error: "AI engine is busy — please try again in a few seconds." }, { status: 503 });

      console.error("[OPTIMIZE]", err);
      return NextResponse.json({ error: "Optimization failed — please try again." }, { status: 502 });
    }

    const executionTimeMs = Date.now() - start;

    // Non-SQL input: return but don't persist
    if (!result.isValidSql)
      return NextResponse.json({ ...result, executionTimeMs, id: null });

    // Persist
    const saved = await db.query.create({
      data: {
        userId:              session.user.id,
        originalQuery:       query,
        optimizedQuery:      result.optimizedQuery,
        domain:              result.domain ?? "General",
        title:               result.title ?? "SQL Query",
        performanceGain:     Math.max(0, Math.min(99, result.performanceGain)),
        issues:              result.issues,
        improvements:        result.improvements,
        indexRecs:           result.indexRecommendations,
        tablesDetected:      result.tablesDetected,
        complexityBefore:    result.complexityBefore,
        complexityAfter:     result.complexityAfter,
        estimatedSpeedup:    result.estimatedSpeedup,
        estimatedRowsScanned: result.estimatedRowsScanned,
        costScore:           result.costScore,
        readabilityNotes:    result.readabilityNotes,
        engine:              result.engine,
        queryType:           result.queryType,
        explanation:         result.explanation,
        executionTimeMs,
      },
    });

    return NextResponse.json({ id: saved.id, ...result, executionTimeMs });
  } catch (err) {
    console.error("[OPTIMIZE]", err);
    return NextResponse.json({ error: "Unexpected error — please try again." }, { status: 500 });
  }
}
