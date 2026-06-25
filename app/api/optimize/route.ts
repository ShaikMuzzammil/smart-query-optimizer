// app/api/optimize/route.ts
import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { optimizeSQL, AiParseError, AiUnavailableError } from "@/lib/ai-engine";
import { db } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  query:         z.string().min(3).max(50000),
  dialect:       z.string().optional().default("PostgreSQL"),
  schemaContext: z.string().optional(),
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

    const { query, dialect, schemaContext } = parsed.data;

    const start = Date.now();
    let result;
    try {
      result = await optimizeSQL(query, dialect, schemaContext);
    } catch (err) {
      if (err instanceof AiUnavailableError) {
        return NextResponse.json({
          error: "Optimization service is temporarily unavailable. Please try again in a moment.",
        }, { status: 503 });
      }
      if (err instanceof AiParseError)
        return NextResponse.json({ error: "Analysis returned an unexpected format — please try again." }, { status: 502 });

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
        engine:              "ai",
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
