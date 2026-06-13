import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../lib/session';
import { dbConnect, isDbConfigured } from '../../../../lib/db/connect';
import FileDoc from '../../../../lib/db/models/FileDoc';
import Notification from '../../../../lib/db/models/Notification';
import { generateText, isAiConfigured } from '../../../../lib/ai/gemini';
import { tokenize } from '../../../../lib/search/textProcessing';
import { checkRateLimit } from '../../../../lib/rateLimit';

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * Extractive fallback summarizer used when GEMINI_API_KEY is not configured.
 * Scores sentences by frequency of their most "informative" (non-stopword)
 * tokens and returns the top-scoring sentences in original order.
 */
function extractiveSummary(content: string, maxSentences = 4): string {
  const sentences = content.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => s.length > 20);
  if (sentences.length <= maxSentences) return sentences.join(' ');

  const freq = new Map<string, number>();
  for (const s of sentences) {
    for (const t of tokenize(s)) freq.set(t, (freq.get(t) || 0) + 1);
  }

  const scored = sentences.map((s, idx) => {
    const tokens = tokenize(s);
    const score = tokens.reduce((sum, t) => sum + (freq.get(t) || 0), 0) / (tokens.length || 1);
    return { idx, s, score };
  });

  const top = scored.sort((a, b) => b.score - a.score).slice(0, maxSentences).sort((a, b) => a.idx - b.idx);
  return top.map((t) => t.s).join(' ');
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isDbConfigured()) return NextResponse.json({ error: 'Not configured' }, { status: 503 });

  const rate = checkRateLimit(`summarize:${user.id}`, 15, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Too many AI requests. Please wait a moment.' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfterSec) } });
  }

  const body = await req.json().catch(() => ({}));
  const fileId: string = body.fileId;
  if (!fileId) return NextResponse.json({ error: 'fileId is required.' }, { status: 400 });

  await dbConnect();
  const doc = await FileDoc.findOne({ _id: fileId, userId: user.id });
  if (!doc) return NextResponse.json({ error: 'File not found.' }, { status: 404 });
  if (!doc.content) return NextResponse.json({ error: 'This file has no extracted text content.' }, { status: 400 });

  let summary: string;
  let aiAssisted = false;

  if (isAiConfigured()) {
    const prompt =
      `Summarize the following document in 3-5 concise sentences (a TL;DR). Focus on the most important facts, decisions, or themes. ` +
      `Do not use markdown formatting or bullet points - return plain prose only.\n\n` +
      `Document name: ${doc.fileName}\n\n` +
      `Document content:\n${doc.content.slice(0, 12000)}`;

    const aiSummary = await generateText(prompt, { maxOutputTokens: 300, temperature: 0.3 });
    if (aiSummary) {
      summary = aiSummary.trim();
      aiAssisted = true;
    } else {
      summary = extractiveSummary(doc.content);
    }
  } else {
    summary = extractiveSummary(doc.content);
  }

  doc.summary = summary;
  await doc.save();

  await Notification.create({
    userId: user.id,
    type: 'ai',
    title: 'Summary generated',
    message: `${doc.fileName} now has ${aiAssisted ? 'an AI-generated' : 'an extractive'} summary.`,
  });

  return NextResponse.json({ summary, aiAssisted });
}
