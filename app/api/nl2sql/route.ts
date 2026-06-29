import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { convertNL2SQL } from "@/lib/ai-engine";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { prompt, dialect = "PostgreSQL", schemaContext, domain } = await req.json();
    if (!prompt?.trim()) return NextResponse.json({ error: "Prompt required" }, { status: 400 });

    const start = Date.now();
    const result = await convertNL2SQL(prompt, dialect, schemaContext);
    const duration = Date.now() - start;

    await prisma.conversion.create({
      data: {
        userId: session.user.id,
        type: "nl2sql",
        input: prompt.slice(0, 2000),
        output: result.sql.slice(0, 5000),
        dialect,
        domain: domain || null,
        status: "success",
        modelUsed: result.modelUsed,
        duration,
        metadata: JSON.stringify({ complexity: result.complexity, tables: result.tables }),
      },
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Conversion failed" }, { status: 500 });
  }
}
