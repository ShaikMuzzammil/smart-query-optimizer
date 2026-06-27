// app/api/conversions/route.ts
import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getAuth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const limit  = Math.min(parseInt(url.searchParams.get("limit")  ?? "50"), 200);
    const feature = url.searchParams.get("feature") ?? undefined;

    const conversions = await db.conversion.findMany({
      where: {
        userId: session.user.id,
        ...(feature ? { feature } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json({ conversions });
  } catch (err) {
    console.error("[CONVERSIONS]", err);
    return NextResponse.json({ error: "Failed to load conversions" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const conversion = await db.conversion.create({
      data: {
        userId:    session.user.id,
        feature:   body.feature ?? "other",
        inputText: body.inputText,
        outputText:body.outputText,
        dialect:   body.dialect,
        domain:    body.domain,
        success:   body.success ?? true,
        metadata:  body.metadata ?? {},
      },
    });

    return NextResponse.json(conversion);
  } catch (err) {
    console.error("[CONVERSIONS POST]", err);
    return NextResponse.json({ error: "Failed to save conversion" }, { status: 500 });
  }
}
