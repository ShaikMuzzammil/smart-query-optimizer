import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { format = "json", types = ["optimize", "nl2sql"], dateRange = "all", limit = 1000 } = await req.json();

  const where: Record<string, unknown> = { userId: session.user.id };
  if (!types.includes("all")) where.type = { in: types };
  if (dateRange === "7d") where.createdAt = { gte: new Date(Date.now() - 7 * 86400000) };
  if (dateRange === "30d") where.createdAt = { gte: new Date(Date.now() - 30 * 86400000) };

  const data = await prisma.conversion.findMany({
    where, orderBy: { createdAt: "desc" }, take: limit,
    select: { id: true, type: true, input: true, output: true, dialect: true, domain: true, issueCount: true, severity: true, status: true, modelUsed: true, duration: true, createdAt: true },
  });

  if (format === "json") {
    const json = JSON.stringify(data, null, 2);
    return new NextResponse(json, {
      headers: { "Content-Type": "application/json", "Content-Disposition": "attachment; filename=sqo-export.json" },
    });
  }

  if (format === "csv") {
    const headers = ["id", "type", "dialect", "domain", "issueCount", "severity", "status", "modelUsed", "duration", "createdAt", "input", "output"];
    const rows = data.map(d => headers.map(h => JSON.stringify((d as Record<string,unknown>)[h] ?? "")).join(","));
    const csv = [headers.join(","), ...rows].join("\n");
    return new NextResponse(csv, {
      headers: { "Content-Type": "text/csv", "Content-Disposition": "attachment; filename=sqo-export.csv" },
    });
  }

  if (format === "sql") {
    const sqlDumps = data
      .filter(d => d.output)
      .map(d => `-- [${d.type.toUpperCase()}] ${d.createdAt.toISOString()} | ${d.dialect || "N/A"}\n-- Input: ${(d.input || "").slice(0, 100)}\n${d.output}\n`)
      .join("\n\n---\n\n");
    return new NextResponse(sqlDumps, {
      headers: { "Content-Type": "text/plain", "Content-Disposition": "attachment; filename=sqo-queries.sql" },
    });
  }

  return NextResponse.json({ error: "Unsupported format" }, { status: 400 });
}
