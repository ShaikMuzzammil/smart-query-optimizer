// app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password } = schema.parse(body);

    const exists = await db.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json({ error: "That email is already registered — try signing in instead." }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await db.user.create({
      data: { name, email, password: hashed },
      select: { id: true, name: true, email: true },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }

    const message = err instanceof Error ? err.message : String(err);
    console.error("[REGISTER]", message);

    // Unique constraint violation (race condition on duplicate email)
    if (message.includes("Unique constraint")) {
      return NextResponse.json({ error: "That email is already registered — try signing in instead." }, { status: 409 });
    }

    // Tables don't exist yet — `prisma db push` was never run against this DB.
    // This is the most common real-world cause of registration failing on a
    // fresh Vercel + Neon setup: the connection works fine, but the schema
    // was never pushed, so the `users` table is missing.
    if (message.includes("does not exist") || message.toLowerCase().includes("relation")) {
      return NextResponse.json(
        { error: "Database tables aren't set up yet. Run `npx prisma db push` against your Neon database, then try again. Visit /api/health for full diagnostics." },
        { status: 503 }
      );
    }

    // Database connection / initialization failures — version-agnostic detection
    if (
      message.includes("Can't reach database") ||
      message.includes("did not initialize") ||
      message.includes("Connection") ||
      message.includes("ECONNREFUSED") ||
      message.includes("DATABASE_URL")
    ) {
      return NextResponse.json(
        { error: "Database connection failed. Visit /api/health to diagnose, or check DATABASE_URL in Vercel env vars." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: `Registration failed: ${message.slice(0, 150)}. Visit /api/health to diagnose.` },
      { status: 500 }
    );
  }
}
