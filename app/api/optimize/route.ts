// app/api/optimize/route.ts
import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { optimizeSQL, AiUnavailableError, AiParseError } from "@/lib/ai-engine";
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
      return NextResponse.json({ error: "Please provide a SQL query to optimize." }, { status: 400 });

    const { query, dialect, schemaContext } = parsed.data;

    let result;
    try {
      result = await optimizeSQL(query, dialect, schemaContext);
    } catch (err) {
      if (err instanceof AiUnavailableError)
        return NextResponse.json({ error: "Optimization service is temporarily unavailable. Please try again in a moment." }, { status: 503 });
      if (err instanceof AiParseError)
        return NextResponse.json({ error: "Optimization returned an unexpected result — try again." }, { status: 502 });
      console.error("[OPTIMIZE]", err);
      return NextResponse.json({ error: "Optimization failed — please try again." }, { status: 500 });
    }

    try {
      await db.query.create({
        data: {
          userId:           session.user.id,
          originalQuery:    query,
          optimizedQuery:   result.optimizedQuery,
          domain:           result.domain,
          title:            result.title,
          performanceGain:  result.performanceGain,
          issues:           result.issues as any,
          improvements:     result.improvements as any,
          indexRecs:        result.indexRecommendations as any,
          tablesDetected:   result.tablesDetected as any,
          complexityBefore: result.complexityBefore,
          complexityAfter:  result.complexityAfter,
          estimatedSpeedup: result.estimatedSpeedup,
          estimatedRowsScanned: result.estimatedRowsScanned,
          costScore:        result.costScore,
          readabilityNotes: result.readabilityNotes,
          engine:           result.engine,
          queryType:        result.queryType,
          explanation:      result.explanation,
        },
      });
    } catch (dbErr) {
      console.error("[OPTIMIZE DB SAVE]", dbErr);
      // Still return result even if save fails
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[OPTIMIZE]", err);
    return NextResponse.json({ error: "Unexpected error — please try again." }, { status: 500 });
  }
}
