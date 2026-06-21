// app/api/optimize/route.ts
import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { optimizeSQL, AiParseError } from "@/lib/anthropic";
import { db } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({ query: z.string().min(3).max(50000) });

export async function POST(req: Request) {
  try {
    const session = await getAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsedBody = schema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: "Paste at least 3 characters of SQL to optimize." },
        { status: 400 }
      );
    }
    const { query } = parsedBody.data;

    // Rate limiting: max 20 queries per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await db.query.count({
      where: { userId: session.user.id, createdAt: { gte: oneHourAgo } },
    });
    if (recentCount >= 20) {
      return NextResponse.json(
        { error: "Rate limit reached: 20 optimizations/hour. Try again later." },
        { status: 429 }
      );
    }

    // Call AI optimization engine
    const start = Date.now();
    let result;
    try {
      result = await optimizeSQL(query);
    } catch (aiErr) {
      if (aiErr instanceof AiParseError) {
        console.error("[OPTIMIZE] AI parse failure", aiErr);
        return NextResponse.json(
          { error: "The AI engine had trouble with that response — please try again in a moment." },
          { status: 502 }
        );
      }
      const msg = aiErr instanceof Error ? aiErr.message : "";
      if (msg.toLowerCase().includes("api key") || msg.toLowerCase().includes("authentication")) {
        return NextResponse.json(
          { error: "AI engine is not configured correctly (invalid API key). Contact the site admin." },
          { status: 500 }
        );
      }
      if (msg.toLowerCase().includes("rate") || msg.toLowerCase().includes("overloaded") || msg.toLowerCase().includes("429")) {
        return NextResponse.json(
          { error: "The AI engine is busy right now — please try again in a few seconds." },
          { status: 503 }
        );
      }
      console.error("[OPTIMIZE] AI call failed", aiErr);
      return NextResponse.json(
        { error: "Couldn't reach the AI engine. Please try again." },
        { status: 502 }
      );
    }
    const executionTimeMs = Date.now() - start;

    // If the input wasn't actually SQL, don't persist it as a "query" —
    // just hand the friendly explanation back to the UI.
    if (!result.isValidSql) {
      return NextResponse.json({ ...result, executionTimeMs, id: null });
    }

    // Save to database
    const saved = await db.query.create({
      data: {
        userId: session.user.id,
        originalQuery: query,
        optimizedQuery: result.optimizedQuery,
        domain: result.domain ?? "General",
        title: result.title ?? "SQL Query",
        performanceGain: Math.max(0, Math.min(99, result.performanceGain)),
        issues: result.issues,
        improvements: result.improvements,
        indexRecs: result.indexRecommendations,
        tablesDetected: result.tablesDetected,
        complexityBefore: result.complexityBefore,
        complexityAfter: result.complexityAfter,
        estimatedSpeedup: result.estimatedSpeedup,
        queryType: result.queryType,
        explanation: result.explanation,
        executionTimeMs,
      },
    });

    return NextResponse.json({ id: saved.id, ...result, executionTimeMs });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error("[OPTIMIZE]", err);
    return NextResponse.json(
      { error: "Something went wrong saving your result. Please try again." },
      { status: 500 }
    );
  }
}
