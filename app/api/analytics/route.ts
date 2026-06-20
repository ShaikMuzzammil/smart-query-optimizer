// app/api/analytics/route.ts
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
      totalQueries, avgGain, domainBreakdown, recentTrend, topGains, issueTypes,
    ] = await Promise.all([
      // Total query count
      db.query.count({ where: { userId } }),

      // Average performance gain
      db.query.aggregate({ where: { userId }, _avg: { performanceGain: true } }),

      // Queries by domain
      db.query.groupBy({
        by: ["domain"],
        where: { userId },
        _count: { _all: true },
        _avg: { performanceGain: true },
        orderBy: { _count: { domain: "desc" } },
      }),

      // Last 14 days trend (1 entry per day)
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

      // Top 5 best optimized queries
      db.query.findMany({
        where: { userId },
        orderBy: { performanceGain: "desc" },
        take: 5,
        select: { id: true, title: true, domain: true, performanceGain: true, createdAt: true },
      }),

      // Most common issue types
      db.$queryRaw<Array<{ severity: string; count: bigint }>>`
        SELECT
          issue->>'severity' AS severity,
          COUNT(*)           AS count
        FROM queries, jsonb_array_elements(issues::jsonb) AS issue
        WHERE user_id = ${userId}
        GROUP BY issue->>'severity'
        ORDER BY count DESC
      `,
    ]);

    // Streak calculation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const day = new Date(today);
      day.setDate(today.getDate() - i);
      const next = new Date(day);
      next.setDate(day.getDate() + 1);
      const count = await db.query.count({
        where: { userId, createdAt: { gte: day, lt: next } },
      });
      if (count > 0) streak++;
      else if (i > 0) break;
    }

    return NextResponse.json({
      totalQueries,
      avgGain: Math.round(avgGain._avg.performanceGain ?? 0),
      totalIssuesFixed: await db.query.findMany({ where: { userId }, select: { issues: true } })
        .then((qs: Array<{ issues: unknown }>) => qs.reduce((s: number, q) => s + (Array.isArray(q.issues) ? q.issues.length : 0), 0)),
      streak,
      domainBreakdown: domainBreakdown.map((d: any) => ({
        domain: d.domain ?? "General",
        count: d._count._all,
        avgGain: Math.round(d._avg.performanceGain ?? 0),
      })),
      recentTrend: recentTrend.map((r: any) => ({
        date: r.date,
        count: Number(r.count),
        avgGain: Math.round(r.avg_gain),
      })),
      topGains,
      issueTypes: issueTypes.map((i: any) => ({ severity: i.severity, count: Number(i.count) })),
    });
  } catch (err) {
    console.error("[ANALYTICS]", err);
    return NextResponse.json({ error: "Failed to load analytics" }, { status: 500 });
  }
}
