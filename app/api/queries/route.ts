// app/api/queries/route.ts
import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getAuth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const domain = searchParams.get("domain");
    const search = searchParams.get("search");
    const favorites = searchParams.get("favorites") === "true";
    const queryType = searchParams.get("queryType");
    const skip = (page - 1) * limit;

    const where = {
      userId: session.user.id,
      ...(domain && domain !== "all" ? { domain } : {}),
      ...(favorites ? { isFavorited: true } : {}),
      ...(queryType && queryType !== "all" ? { queryType } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" as const } },
              { originalQuery: { contains: search, mode: "insensitive" as const } },
              { optimizedQuery: { contains: search, mode: "insensitive" as const } },
              { domain: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [total, queries] = await Promise.all([
      db.query.count({ where }),
      db.query.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true, title: true, domain: true, queryType: true,
          performanceGain: true, issues: true, improvements: true,
          indexRecs: true, tablesDetected: true, complexityBefore: true,
          complexityAfter: true, estimatedSpeedup: true, explanation: true,
          estimatedRowsScanned: true, costScore: true, readabilityNotes: true,
          engine: true,
          originalQuery: true, optimizedQuery: true,
          isFavorited: true, isShared: true, shareToken: true,
          executionTimeMs: true, createdAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      queries,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("[QUERIES GET]", err);
    return NextResponse.json({ error: "Failed to fetch queries" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getAuth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    // No id = clear ALL history for this user (used by Settings "Clear History")
    if (!id) {
      const { count } = await db.query.deleteMany({ where: { userId: session.user.id } });
      return NextResponse.json({ success: true, deleted: count });
    }

    const query = await db.query.findFirst({ where: { id, userId: session.user.id } });
    if (!query) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await db.query.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[QUERIES DELETE]", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getAuth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, isFavorited, isShared } = body;
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const query = await db.query.findFirst({ where: { id, userId: session.user.id } });
    if (!query) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const updated = await db.query.update({
      where: { id },
      data: {
        ...(isFavorited !== undefined ? { isFavorited } : {}),
        ...(isShared !== undefined ? { isShared } : {}),
      },
    });

    return NextResponse.json({ query: updated });
  } catch (err) {
    console.error("[QUERIES PATCH]", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
