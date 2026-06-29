import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const schema = await prisma.schemaVault.findFirst({
    where: { userId: session.user.id }, orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(schema || null);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const existing = await prisma.schemaVault.findFirst({ where: { userId: session.user.id } });
  if (existing) {
    const updated = await prisma.schemaVault.update({
      where: { id: existing.id }, data: { ...body, updatedAt: new Date() },
    });
    return NextResponse.json(updated);
  }
  const created = await prisma.schemaVault.create({ data: { ...body, userId: session.user.id } });
  return NextResponse.json(created);
}
