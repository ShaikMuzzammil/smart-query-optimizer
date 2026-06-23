// app/api/export/route.ts
import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildCsv, type ExportableQuery } from "@/lib/csv-export";
import { buildPdf } from "@/lib/pdf-export";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getAuth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const scope = searchParams.get("scope"); // "all" for bulk export
    const format = (searchParams.get("format") ?? "sql").toLowerCase(); // sql | json | csv | pdf
    const domain = searchParams.get("domain");
    const favoritesOnly = searchParams.get("favorites") === "true";

    // ── Bulk export (history page "Export All") ──────────────────────
    if (scope === "all") {
      const queries = await db.query.findMany({
        where: {
          userId: session.user.id,
          ...(domain && domain !== "all" ? { domain } : {}),
          ...(favoritesOnly ? { isFavorited: true } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 500,
      });

      if (queries.length === 0) {
        return NextResponse.json({ error: "No saved queries to export yet." }, { status: 404 });
      }

      if (format === "csv") {
        const csv = buildCsv(queries as unknown as ExportableQuery[]);
        return new NextResponse(csv, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="smart-query-optimizer-history.csv"`,
          },
        });
      }
      if (format === "pdf") {
        const pdfBytes = await buildPdf(queries as unknown as ExportableQuery[], "Optimization History Report");
        return new NextResponse(Buffer.from(pdfBytes), {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="smart-query-optimizer-history.pdf"`,
          },
        });
      }
      return NextResponse.json({ error: "Bulk export only supports format=csv or format=pdf" }, { status: 400 });
    }

    // ── Single-query export ───────────────────────────────────────────
    const query = await db.query.findFirst({ where: { id: id!, userId: session.user.id } });
    if (!query) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (format === "csv") {
      const csv = buildCsv([query as unknown as ExportableQuery]);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="query-${query.id}.csv"`,
        },
      });
    }

    if (format === "pdf") {
      const pdfBytes = await buildPdf([query as unknown as ExportableQuery], query.title ?? "Optimization Report");
      return new NextResponse(Buffer.from(pdfBytes), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="query-${query.id}.pdf"`,
        },
      });
    }

    if (format === "json") {
      return new NextResponse(
        JSON.stringify({
          id: query.id,
          title: query.title,
          domain: query.domain,
          engine: query.engine,
          originalQuery: query.originalQuery,
          optimizedQuery: query.optimizedQuery,
          performanceGain: query.performanceGain,
          costScore: query.costScore,
          estimatedRowsScanned: query.estimatedRowsScanned,
          readabilityNotes: query.readabilityNotes,
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

    // SQL format (default)
    const issues = Array.isArray(query.issues) ? query.issues as any[] : [];
    const improvements = Array.isArray(query.improvements) ? query.improvements as string[] : [];
    const indexRecs = Array.isArray(query.indexRecs) ? query.indexRecs as string[] : [];

    const sql = [
      `-- Smart Query Optimizer Export`,
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
