// app/api/export/route.ts
import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  format:   z.enum(["sql", "csv", "json", "pdf"]),
  scope:    z.enum(["all", "last30", "last7", "favorites"]),
  features: z.array(z.enum(["optimizer", "nl2sql"])).min(1),
});

// GET — quick single-result export (used by inline Export buttons on Optimizer/NL2SQL results)
export async function GET(req: Request) {
  try {
    const session = await getAuth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") ?? "sql";

    const latest = await db.query.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });
    if (!latest) return NextResponse.json({ error: "No result to export yet." }, { status: 404 });

    if (format === "json") {
      return new NextResponse(JSON.stringify(latest, null, 2), {
        headers: { "Content-Type": "application/json; charset=utf-8" },
      });
    }
    if (format === "csv") {
      const rows = [
        "title,domain,performance_gain,tables,created_at",
        [
          `"${(latest.title ?? "").replace(/"/g, '""')}"`,
          latest.domain ?? "",
          latest.performanceGain,
          `"${Array.isArray(latest.tablesDetected) ? latest.tablesDetected.join(";") : ""}"`,
          latest.createdAt.toISOString(),
        ].join(","),
      ];
      return new NextResponse(rows.join("\n"), { headers: { "Content-Type": "text/csv; charset=utf-8" } });
    }
    if (format === "pdf") {
      const text = [
        "SMARTQUERY OPTIMIZATION REPORT", "==============================", "",
        `Title:   ${latest.title ?? "—"}`,
        `Domain:  ${latest.domain ?? "—"}`,
        `Gain:    +${latest.performanceGain}%`,
        `Date:    ${latest.createdAt.toLocaleString()}`,
        "", "OPTIMIZED QUERY", "---------------", latest.optimizedQuery ?? "",
      ].join("\n");
      return new NextResponse(text, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }
    // default sql
    return new NextResponse(latest.optimizedQuery ?? "", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  } catch (err) {
    console.error("[EXPORT GET]", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: "Invalid export options." }, { status: 400 });

    const { format, scope, features } = parsed.data;
    const userId = session.user.id;

    // Date filter
    const dateFilter = (() => {
      const now = new Date();
      if (scope === "last7")  { const d = new Date(now); d.setDate(d.getDate() - 7);  return d; }
      if (scope === "last30") { const d = new Date(now); d.setDate(d.getDate() - 30); return d; }
      return undefined;
    })();

    // Fetch optimizer queries
    const queries = features.includes("optimizer") ? await db.query.findMany({
      where: {
        userId,
        ...(dateFilter ? { createdAt: { gte: dateFilter } } : {}),
        ...(scope === "favorites" ? { isFavorited: true } : {}),
      },
      orderBy: { createdAt: "desc" },
    }) : [];

    // Fetch NL2SQL conversions
    const conversions = features.includes("nl2sql") ? await db.conversion.findMany({
      where: {
        userId,
        feature: "nl2sql",
        success: true,
        ...(dateFilter ? { createdAt: { gte: dateFilter } } : {}),
      },
      orderBy: { createdAt: "desc" },
    }) : [];

    // Track export
    try {
      await db.conversion.create({
        data: {
          userId, feature: "export",
          metadata: { format, scope, queryCount: queries.length, conversionCount: conversions.length },
          success: true,
        },
      });
    } catch {}

    // ── Format: SQL ───────────────────────────────────────────────────────────
    if (format === "sql") {
      const lines: string[] = [
        `-- SmartQuery Export: SQL Queries`,
        `-- Exported: ${new Date().toISOString()}`,
        `-- Scope: ${scope} | Queries: ${queries.length} | NL2SQL: ${conversions.length}`,
        "",
      ];
      if (queries.length > 0) {
        lines.push("-- === SQL OPTIMIZER ===", "");
        queries.forEach((q: any, i: number) => {
          lines.push(`-- ${i + 1}. ${q.title ?? "Query"} | ${q.domain} | +${q.performanceGain}% | ${q.createdAt.toISOString()}`);
          lines.push(q.optimizedQuery);
          lines.push("");
        });
      }
      if (conversions.length > 0) {
        lines.push("-- === NATURAL LANGUAGE TO SQL ===", "");
        conversions.forEach((c: any, i: number) => {
          const meta = c.metadata as any;
          lines.push(`-- ${i + 1}. ${c.inputText?.slice(0, 80) ?? "Conversion"} | ${c.dialect ?? "SQL"} | ${c.createdAt.toISOString()}`);
          if (c.outputText) lines.push(c.outputText);
          lines.push("");
        });
      }
      return new NextResponse(lines.join("\n"), {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    // ── Format: CSV ───────────────────────────────────────────────────────────
    if (format === "csv") {
      const rows: string[] = [
        "type,id,title_or_prompt,domain,dialect,performance_gain,issues_count,tables,created_at"
      ];
      queries.forEach((q: any) => rows.push(
        [
          "optimizer",
          q.id,
          `"${(q.title ?? "").replace(/"/g, "\"\"")}"`,
          q.domain ?? "",
          "SQL",
          q.performanceGain,
          Array.isArray(q.issues) ? q.issues.length : 0,
          `"${Array.isArray(q.tablesDetected) ? q.tablesDetected.join(";") : ""}"`,
          q.createdAt.toISOString(),
        ].join(",")
      ));
      conversions.forEach((c: any) => rows.push(
        [
          "nl2sql",
          c.id,
          `"${(c.inputText ?? "").replace(/"/g, "\"\"").slice(0, 100)}"`,
          (c.metadata as any)?.domain ?? "",
          c.dialect ?? "SQL",
          0,
          0,
          "",
          c.createdAt.toISOString(),
        ].join(",")
      ));
      return new NextResponse(rows.join("\n"), {
        headers: { "Content-Type": "text/csv; charset=utf-8" },
      });
    }

    // ── Format: JSON ──────────────────────────────────────────────────────────
    if (format === "json") {
      const payload = {
        exportedAt: new Date().toISOString(),
        scope,
        features,
        summary: { optimizer: queries.length, nl2sql: conversions.length },
        optimizer: queries.map((q: any) => ({
          id: q.id, title: q.title, domain: q.domain, queryType: q.queryType,
          performanceGain: q.performanceGain, costScore: q.costScore,
          issues: q.issues, improvements: q.improvements, indexRecs: q.indexRecs,
          tablesDetected: q.tablesDetected, complexityBefore: q.complexityBefore,
          complexityAfter: q.complexityAfter, estimatedSpeedup: q.estimatedSpeedup,
          engine: q.engine, optimizedQuery: q.optimizedQuery, explanation: q.explanation,
          createdAt: q.createdAt,
        })),
        nl2sql: conversions.map((c: any) => ({
          id: c.id, prompt: c.inputText, sql: c.outputText,
          dialect: c.dialect, metadata: c.metadata, createdAt: c.createdAt,
        })),
      };
      return new NextResponse(JSON.stringify(payload, null, 2), {
        headers: { "Content-Type": "application/json; charset=utf-8" },
      });
    }

    // ── Format: PDF (plain text report) ──────────────────────────────────────
    if (format === "pdf") {
      const lines: string[] = [
        "SMARTQUERY EXPORT REPORT",
        "========================",
        `Exported: ${new Date().toLocaleString()}`,
        `Scope: ${scope}`,
        "",
        "SUMMARY",
        "-------",
        `SQL Optimizations:     ${queries.length}`,
        `NL to SQL Conversions: ${conversions.length}`,
        `Total Actions:         ${queries.length + conversions.length}`,
        "",
      ];
      if (queries.length > 0) {
        lines.push("SQL OPTIMIZER HISTORY", "---------------------", "");
        queries.forEach((q: any, i: number) => {
          lines.push(
            `${i + 1}. ${q.title ?? "SQL Query"}`,
            `   Domain:    ${q.domain ?? "—"}`,
            `   Gain:      +${q.performanceGain}%`,
            `   Tables:    ${Array.isArray(q.tablesDetected) ? q.tablesDetected.join(", ") : "—"}`,
            `   Date:      ${q.createdAt.toLocaleDateString()}`,
            `   Optimized: ${(q.optimizedQuery ?? "").slice(0, 200)}...`,
            "",
          );
        });
      }
      if (conversions.length > 0) {
        lines.push("NATURAL LANGUAGE TO SQL", "-----------------------", "");
        conversions.forEach((c: any, i: number) => {
          lines.push(
            `${i + 1}. ${(c.inputText ?? "").slice(0, 100)}`,
            `   Dialect: ${c.dialect ?? "SQL"}`,
            `   Date:    ${c.createdAt.toLocaleDateString()}`,
            `   SQL:     ${(c.outputText ?? "").slice(0, 200)}...`,
            "",
          );
        });
      }
      return new NextResponse(lines.join("\n"), {
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    return NextResponse.json({ error: "Invalid format" }, { status: 400 });
  } catch (err) {
    console.error("[EXPORT]", err);
    return NextResponse.json({ error: "Export failed — please try again." }, { status: 500 });
  }
}
