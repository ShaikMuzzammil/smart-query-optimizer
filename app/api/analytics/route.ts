// app/api/analytics/route.ts — full platform analytics across all features
import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getAuth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    const [
      totalQueries, avgGain, domainBreakdown, recentTrend, topGains,
      issueTypes, engineBreakdown, avgCost,
      totalNl2sql, totalSchemaUploads, totalPlayground,
      nl2sqlByDialect, recentConversions,
    ] = await Promise.all([
      // SQL Optimizer stats
      db.query.count({ where: { userId } }),
      db.query.aggregate({ where: { userId }, _avg: { performanceGain: true } }),
      db.query.groupBy({ by: ["domain"], where: { userId }, _count: { _all: true }, _avg: { performanceGain: true }, orderBy: { _count: { domain: "desc" } } }),
      db.$queryRaw<Array<{ date: string; count: bigint; avg_gain: number }>>`
        SELECT DATE(created_at)::text AS date, COUNT(*) AS count, AVG(performance_gain) AS avg_gain
        FROM queries WHERE user_id = ${userId} AND created_at >= NOW() - INTERVAL '14 days'
        GROUP BY DATE(created_at) ORDER BY date ASC`,
      db.query.findMany({ where: { userId }, orderBy: { performanceGain: "desc" }, take: 5, select: { id: true, title: true, domain: true, performanceGain: true, createdAt: true } }),
      db.$queryRaw<Array<{ severity: string; count: bigint }>>`
        SELECT issue->>'severity' AS severity, COUNT(*) AS count
        FROM queries, jsonb_array_elements(issues::jsonb) AS issue
        WHERE user_id = ${userId} GROUP BY issue->>'severity' ORDER BY count DESC`,
      db.query.groupBy({ by: ["engine"], where: { userId }, _count: { _all: true } }),
      db.query.aggregate({ where: { userId, costScore: { not: null } }, _avg: { costScore: true } }),

      // Conversion feature stats (NL2SQL, Schema uploads, Playground)
      db.conversion.count({ where: { userId, type: "nl2sql" } }).catch(() => 0),
      db.conversion.count({ where: { userId, type: "schema_upload" } }).catch(() => 0),
      db.conversion.count({ where: { userId, type: "playground" } }).catch(() => 0),

      // NL2SQL breakdown by dialect
      db.conversion.groupBy({ by: ["dialect"], where: { userId, type: "nl2sql" }, _count: { _all: true } }).catch(() => []),

      // Recent conversions across all types (last 14 days)
      db.$queryRaw<Array<{ date: string; nl2sql: bigint; schema_upload: bigint; optimizer: bigint }>>`
        SELECT
          DATE(created_at)::text AS date,
          COUNT(*) FILTER (WHERE type = 'nl2sql') AS nl2sql,
          COUNT(*) FILTER (WHERE type = 'schema_upload') AS schema_upload,
          0::bigint AS optimizer
        FROM conversions
        WHERE user_id = ${userId} AND created_at >= NOW() - INTERVAL '14 days'
        GROUP BY DATE(created_at)
        ORDER BY date ASC`.catch(() => []),
    ]);

    // Streak calculation
    const today = new Date(); today.setHours(0, 0, 0, 0);
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const day = new Date(today); day.setDate(today.getDate() - i);
      const next = new Date(day); next.setDate(day.getDate() + 1);
      const count = await db.query.count({ where: { userId, createdAt: { gte: day, lt: next } } });
      if (count > 0) streak++; else if (i > 0) break;
    }

    const totalIssuesFixed = await db.query.findMany({ where: { userId }, select: { issues: true } })
      .then((qs: Array<{ issues: unknown }>) => qs.reduce((s: number, q) => s + (Array.isArray(q.issues) ? q.issues.length : 0), 0));

    // Merge optimizer trend with conversion trend
    const trendMap: Record<string, { date: string; count: number; avg_gain: number; nl2sql: number; schemaUploads: number }> = {};
    for (const r of recentTrend as any[]) {
      trendMap[r.date] = { date: r.date, count: Number(r.count), avg_gain: Math.round(r.avg_gain ?? 0), nl2sql: 0, schemaUploads: 0 };
    }
    for (const r of recentConversions as any[]) {
      if (!trendMap[r.date]) trendMap[r.date] = { date: r.date, count: 0, avg_gain: 0, nl2sql: 0, schemaUploads: 0 };
      trendMap[r.date].nl2sql = Number(r.nl2sql ?? 0);
      trendMap[r.date].schemaUploads = Number(r.schema_upload ?? 0);
    }
    const mergedTrend = Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      // Optimizer stats
      totalQueries,
      avgGain: Math.round(avgGain._avg.performanceGain ?? 0),
      totalIssuesFixed,
      streak,
      domainBreakdown: domainBreakdown.map((d: any) => ({ domain: d.domain ?? "General", count: d._count._all, avgGain: Math.round(d._avg.performanceGain ?? 0) })),
      recentTrend: mergedTrend,
      topGains,
      issueTypes: issueTypes.map((i: any) => ({ severity: i.severity, count: Number(i.count) })),
      engineBreakdown: engineBreakdown.map((e: any) => ({ engine: e.engine ?? "engine-b", count: e._count._all })),
      avgCostScore: avgCost._avg.costScore != null ? Math.round(avgCost._avg.costScore) : null,
      // Feature usage stats
      totalNl2sql,
      totalSchemaUploads,
      totalPlayground,
      totalAllFeatures: totalQueries + totalNl2sql + totalSchemaUploads + totalPlayground,
      nl2sqlByDialect: (nl2sqlByDialect as any[]).map((d: any) => ({ dialect: d.dialect ?? "PostgreSQL", count: d._count._all })),
    });
  } catch (err) {
    console.error("[ANALYTICS]", err);
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}
