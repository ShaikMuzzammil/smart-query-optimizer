// app/api/export/route.ts
import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = await getAuth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const format = searchParams.get("format") ?? "sql"; // sql | json

    const query = await db.query.findFirst({
      where: { id: id!, userId: session.user.id },
    });
    if (!query) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (format === "json") {
      return new NextResponse(
        JSON.stringify({
          id: query.id,
          title: query.title,
          domain: query.domain,
          originalQuery: query.originalQuery,
          optimizedQuery: query.optimizedQuery,
          performanceGain: query.performanceGain,
          issues: query.issues,
          improvements: query.improvements,
          indexRecommendations: query.indexRecs,
          explanation: query.explanation,
          createdAt: query.createdAt,
        }, null, 2),
        {
          headers: {
            "Content-Type": "application/json",
            "Content-Disposition": `attachment; filename="query-${query.id}.json"`,
          },
        }
      );
    }

    // SQL format
    const issues = Array.isArray(query.issues) ? query.issues as any[] : [];
    const improvements = Array.isArray(query.improvements) ? query.improvements as string[] : [];
    const indexRecs = Array.isArray(query.indexRecs) ? query.indexRecs as string[] : [];

    const sql = [
      `-- SmartQuery Pro Export`,
      `-- Title: ${query.title}`,
      `-- Domain: ${query.domain}`,
      `-- Performance Gain: +${query.performanceGain}%`,
      `-- Exported: ${new Date().toISOString()}`,
      `-- `,
      `-- ═══════════════════════════════════════`,
      `-- ORIGINAL QUERY`,
      `-- ═══════════════════════════════════════`,
      ``,
      issues.map((i: any) => `-- [${i.severity?.toUpperCase()}] ${i.description}`).join("\n"),
      ``,
      query.originalQuery,
      ``,
      `-- ═══════════════════════════════════════`,
      `-- OPTIMIZED QUERY (+${query.performanceGain}%)`,
      `-- ═══════════════════════════════════════`,
      ``,
      improvements.map((imp: string) => `-- ✓ ${imp}`).join("\n"),
      ``,
      query.optimizedQuery,
      ``,
      indexRecs.length > 0 ? `-- ═══ INDEX RECOMMENDATIONS ═══\n${indexRecs.join("\n")}` : "",
    ].filter(Boolean).join("\n");

    return new NextResponse(sql, {
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": `attachment; filename="optimized-${query.id}.sql"`,
      },
    });
  } catch (err) {
    console.error("[EXPORT]", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
