// app/api/optimize/route.ts
import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { optimizeSQL } from "@/lib/anthropic";
import { db } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({ query: z.string().min(5).max(50000) });

export async function POST(req: Request) {
  try {
    const session = await getAuth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { query } = schema.parse(body);

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
    const result = await optimizeSQL(query);
    const executionTimeMs = Date.now() - start;

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
    return NextResponse.json({ error: "Optimization failed. Please try again." }, { status: 500 });
  }
}
