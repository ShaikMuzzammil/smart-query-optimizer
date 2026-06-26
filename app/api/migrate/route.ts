// app/api/migrate/route.ts
// Run once after each deploy to push schema changes to the DB
// Protected by NEXTAUTH_SECRET so only you can trigger it
// Usage: POST /api/migrate with header Authorization: Bearer <NEXTAUTH_SECRET>
import { NextResponse } from "next/server";
import { execSync } from "child_process";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  const secret = process.env.NEXTAUTH_SECRET;

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const output = execSync("npx prisma db push --accept-data-loss --skip-generate", {
      encoding: "utf8",
      timeout: 60_000,
    });
    return NextResponse.json({ ok: true, output });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: String(err.message ?? err) }, { status: 500 });
  }
}
