// app/api/analytics/route.ts — Universal analytics across all features
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
      totalQueries, avgGain, domainBreakdown, recentTrend, topGains, issueTypes, avgCost,
      nl2sqlCount, schemaCount, playgroundCount, exportCount, totalConversions,
    ] = await Promise.all([
      db.query.count({ where: { userId } }),
      db.query.aggregate({ where: { userId }, _avg: { performanceGain: true } }),
      db.query.groupBy({
        by: ["domain"],
        where: { userId },
        _count: { _all: true },
        _avg: { performanceGain: true },
        orderBy: { _count: { domain: "desc" } },
      }),
      db.$queryRaw<Array<{ date: string; count: bigint; avg_gain: number }>>`
        SELECT
          DATE(created_at)::text AS date,
          COUNT(*)               AS count,
          AVG(performance_gain)  AS avg_gain
        FROM queries
        WHERE user_id = ${userId}
          AND created_at >= NOW() - INTERVAL '14 days'
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `,
      db.query.findMany({
        where: { userId },
        orderBy: { performanceGain: "desc" },
        take: 5,
        select: { id: true, title: true, domain: true, performanceGain: true, createdAt: true },
      }),
      db.$queryRaw<Array<{ severity: string; count: bigint }>>`
        SELECT
          issue->>'severity' AS severity,
          COUNT(*)           AS count
        FROM queries, jsonb_array_elements(issues::jsonb) AS issue
        WHERE user_id = ${userId}
        GROUP BY issue->>'severity'
        ORDER BY count DESC
      `,
      db.query.aggregate({ where: { userId, costScore: { not: null } }, _avg: { costScore: true } }),
      // Feature usage counts
      db.conversion.count({ where: { userId, feature: "nl2sql", success: true } }),
      db.conversion.count({ where: { userId, feature: "schema_upload", success: true } }),
      db.conversion.count({ where: { userId, feature: "playground_run", success: true } }),
      db.conversion.count({ where: { userId, feature: "export", success: true } }),
      db.conversion.count({ where: { userId } }),
    ]);

    // Streak calculation — single query instead of 30 days × 2 sequential
    // round-trips. The old loop made up to 60 sequential DB calls awaited one
    // at a time, which could exceed serverless function time limits on
    // Vercel and cause the whole /api/analytics call to fail/time out —
    // exactly the cause of Analytics getting stuck on "Loading…" forever.
    const activeDays = await db.$queryRaw<Array<{ day: string }>>`
      SELECT DATE(created_at)::text AS day FROM queries
      WHERE user_id = ${userId} AND created_at >= NOW() - INTERVAL '31 days'
      UNION
      SELECT DATE(created_at)::text AS day FROM conversions
      WHERE user_id = ${userId} AND created_at >= NOW() - INTERVAL '31 days'
    `;
    const activeDaySet = new Set(activeDays.map((d: { day: string }) => d.day));
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 31; i++) {
      const day = new Date(today);
      day.setDate(today.getDate() - i);
      const key = day.toISOString().slice(0, 10);
      if (activeDaySet.has(key)) streak++;
      else if (i > 0) break;
    }

    // NL2SQL trend (last 14 days)
    const nl2sqlTrend = await db.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT DATE(created_at)::text AS date, COUNT(*) AS count
      FROM conversions
      WHERE user_id = ${userId}
        AND feature = 'nl2sql'
        AND created_at >= NOW() - INTERVAL '14 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    const totalIssuesFixed = await db.query.findMany({
      where: { userId }, select: { issues: true }
    }).then((qs: Array<{ issues: unknown }>) =>
      qs.reduce((s: number, q) => s + (Array.isArray(q.issues) ? q.issues.length : 0), 0)
    );

    return NextResponse.json({
      // Optimizer stats
      totalQueries,
      avgGain: Math.round(avgGain._avg.performanceGain ?? 0),
      totalIssuesFixed,
      streak,
      avgCostScore: avgCost._avg.costScore != null ? Math.round(avgCost._avg.costScore) : null,
      domainBreakdown: domainBreakdown.map((d: any) => ({
        domain: d.domain ?? "General",
        count: d._count._all,
        avgGain: Math.round(d._avg.performanceGain ?? 0),
      })),
      recentTrend: recentTrend.map((r: any) => ({
        date: r.date,
        count: Number(r.count),
        avg_gain: Math.round(r.avg_gain ?? 0),
      })),
      topGains,
      issueTypes: issueTypes.map((i: any) => ({ severity: i.severity, count: Number(i.count) })),
      // Universal feature stats
      featureUsage: {
        optimizer:  totalQueries,
        nl2sql:     nl2sqlCount,
        schema:     schemaCount,
        playground: playgroundCount,
        export:     exportCount,
      },
      totalActions: totalQueries + totalConversions,
      nl2sqlTrend: nl2sqlTrend.map((r: any) => ({ date: r.date, count: Number(r.count) })),
    });
  } catch (err) {
    console.error("[ANALYTICS]", err);
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}
