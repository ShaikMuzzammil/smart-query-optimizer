import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { optimizeSQL } from "@/lib/ai-engine";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { sql, dialect = "PostgreSQL" } = await req.json();
    if (!sql?.trim()) return NextResponse.json({ error: "SQL required" }, { status: 400 });

    const start = Date.now();
    const result = await optimizeSQL(sql, dialect);
    const duration = Date.now() - start;

    const maxSeverity = result.issues.length
      ? result.issues.reduce((max, i) => {
          const order = ["critical", "high", "medium", "low"];
          return order.indexOf(i.severity) < order.indexOf(max) ? i.severity : max;
        }, "low" as string)
      : null;

    await prisma.conversion.create({
      data: {
        userId: session.user.id,
        type: "optimize",
        input: sql.slice(0, 5000),
        output: result.optimizedSQL.slice(0, 5000),
        dialect,
        issueCount: result.issues.length,
        severity: maxSeverity,
        status: result.modelUsed === "static-analysis" ? "partial" : "success",
        modelUsed: result.modelUsed,
        duration,
      },
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
