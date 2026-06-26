// app/api/conversions/route.ts — track schema uploads, playground runs
import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  type:     z.enum(["schema_upload", "playground", "nl2sql"]),
  prompt:   z.string().optional(),
  sql:      z.string().optional(),
  dialect:  z.string().optional(),
  domain:   z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getAuth();
    if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
    const { type, prompt, sql, dialect, domain, metadata } = parsed.data;
    await db.conversion.create({
      data: { userId: session.user.id, type, prompt, sql, dialect, domain, metadata: (metadata as any) ?? {} },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[CONVERSIONS]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
