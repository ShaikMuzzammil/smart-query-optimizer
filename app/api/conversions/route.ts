import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = parseInt(searchParams.get("offset") || "0");
  const search = searchParams.get("search") || "";

  const where: Record<string, unknown> = { userId: session.user.id };
  if (type && type !== "all") where.type = type;
  if (search) where.input = { contains: search, mode: "insensitive" };

  const [items, total] = await Promise.all([
    prisma.conversion.findMany({
      where, orderBy: { createdAt: "desc" }, take: limit, skip: offset,
      select: { id: true, type: true, input: true, output: true, dialect: true, domain: true, issueCount: true, severity: true, status: true, modelUsed: true, duration: true, createdAt: true },
    }),
    prisma.conversion.count({ where }),
  ]);

  return NextResponse.json({ items, total, offset, limit });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const item = await prisma.conversion.create({
    data: { ...body, userId: session.user.id },
  });
  return NextResponse.json(item);
}
