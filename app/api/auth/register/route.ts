// app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { z } from "zod";

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

    // Database connection / initialization failures — version-agnostic detection
    // (avoids relying on specific Prisma error class exports, which differ across versions)
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
      { error: "Registration failed unexpectedly. Visit /api/health to diagnose the issue." },
      { status: 500 }
    );
  }
}
