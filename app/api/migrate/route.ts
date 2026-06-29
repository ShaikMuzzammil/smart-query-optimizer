// app/api/migrate/route.ts — Run prisma db push once after deploy
import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

export const dynamic = "force-dynamic";
const execAsync = promisify(exec);

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret || auth !== `Bearer ${secret}`)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { stdout, stderr } = await execAsync("npx prisma db push --accept-data-loss --skip-generate");
    return NextResponse.json({ ok: true, stdout: stdout.slice(0, 2000), stderr: stderr.slice(0, 500) });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message.slice(0, 1000) }, { status: 500 });
  }
}
