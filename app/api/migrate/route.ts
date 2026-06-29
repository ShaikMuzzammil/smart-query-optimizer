import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { execSync } from "child_process";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const token = auth?.replace("Bearer ", "");
  if (token !== process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    execSync("npx prisma db push --accept-data-loss", { stdio: "pipe" });
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, message: "Schema pushed successfully" });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
