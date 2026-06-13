import { NextResponse } from 'next/server';
import { isAiConfigured } from '../../../../lib/ai/gemini';

export async function GET() {
  return NextResponse.json({ configured: isAiConfigured() });
}
