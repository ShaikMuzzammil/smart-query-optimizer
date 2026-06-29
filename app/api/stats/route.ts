import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const [
    totalConversions, byType, bySeverity, byDialect, byDomain, recentTrend
  ] = await Promise.all([
    prisma.conversion.count({ where: { userId } }),
    prisma.conversion.groupBy({ by: ["type"], where: { userId }, _count: { id: true } }),
    prisma.conversion.groupBy({ by: ["severity"], where: { userId, severity: { not: null } }, _count: { id: true } }),
    prisma.conversion.groupBy({ by: ["dialect"], where: { userId, dialect: { not: null } }, _count: { id: true } }),
    prisma.conversion.groupBy({ by: ["domain"], where: { userId, domain: { not: null } }, _count: { id: true } }),
    prisma.conversion.findMany({
      where: { userId, createdAt: { gte: new Date(Date.now() - 7 * 86400000) } },
      select: { createdAt: true, type: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const issueStats = await prisma.conversion.aggregate({
    where: { userId, type: "optimize" },
    _sum: { issueCount: true },
    _avg: { issueCount: true, duration: true },
  });

  return NextResponse.json({
    totalConversions,
    byType: Object.fromEntries(byType.map(r => [r.type, r._count.id])),
    bySeverity: Object.fromEntries(bySeverity.map(r => [r.severity!, r._count.id])),
    byDialect: Object.fromEntries(byDialect.map(r => [r.dialect!, r._count.id])),
    byDomain: Object.fromEntries(byDomain.map(r => [r.domain!, r._count.id])),
    totalIssues: issueStats._sum.issueCount || 0,
    avgIssues: issueStats._avg.issueCount || 0,
    avgDurationMs: issueStats._avg.duration || 0,
    recentTrend,
  });
}
