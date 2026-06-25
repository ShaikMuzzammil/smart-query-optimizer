// app/api/nl2sql/route.ts
import { NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { nl2sql, AiUnavailableError, AiParseError } from "@/lib/ai-engine";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  prompt:        z.string().min(5).max(2000),
  dialect:       z.string().optional().default("PostgreSQL"),
  schemaContext: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getAuth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Sign in required." }, { status: 401 });

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success)
      return NextResponse.json({ error: "Please describe what SQL you need (at least 5 characters)." }, { status: 400 });

    const { prompt, dialect, schemaContext } = parsed.data;
    const result = await nl2sql(prompt, dialect, schemaContext);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AiUnavailableError)
      return NextResponse.json({ error: "Conversion service is temporarily unavailable. Please try again." }, { status: 503 });
    if (err instanceof AiParseError)
      return NextResponse.json({ error: "Conversion returned an unexpected format — try again." }, { status: 502 });
    console.error("[NL2SQL]", err);
    return NextResponse.json({ error: "Conversion failed — please try again." }, { status: 500 });
  }
}
