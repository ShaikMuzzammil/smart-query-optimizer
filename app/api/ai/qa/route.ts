import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../lib/session';
import { dbConnect, isDbConfigured } from '../../../../lib/db/connect';
import FileDoc from '../../../../lib/db/models/FileDoc';
import Notification from '../../../../lib/db/models/Notification';
import { InvertedIndex } from '../../../../lib/search/invertedIndex';
import { optimizeQuery } from '../../../../lib/search/queryOptimizer';
import { generateText, isAiConfigured } from '../../../../lib/ai/gemini';
import { checkRateLimit } from '../../../../lib/rateLimit';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isDbConfigured()) return NextResponse.json({ error: 'Q&A requires MongoDB. Add MONGODB_URI to your environment.' }, { status: 503 });

  const rate = checkRateLimit(`qa:${user.id}`, 15, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Too many AI requests. Please wait a moment.' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfterSec) } });
  }

  const body = await req.json().catch(() => ({}));
  const question: string = (body.question || '').toString().trim();
  if (!question) return NextResponse.json({ error: 'question is required.' }, { status: 400 });

  await dbConnect();

  const docs = await FileDoc.find({ userId: user.id, status: 'indexed' }).select('fileName content createdAt').lean();
  if (docs.length === 0) {
    return NextResponse.json({
      answer: "You don't have any indexed documents yet. Upload a file first, then ask questions about it.",
      sources: [],
      aiAssisted: false,
    });
  }

  const index = new InvertedIndex(
    docs.map((d: any) => ({ id: d._id.toString(), fileName: d.fileName, content: d.content || '', uploadDate: d.createdAt }))
  );

  const vocabulary = index.vocabulary();
  const optimizer = await optimizeQuery(question, vocabulary);
  const results = index.search(optimizer.expandedTerms, { limit: 4 });

  if (results.length === 0) {
    return NextResponse.json({
      answer: "I couldn't find any content in your documents related to that question. Try rephrasing, or upload a document covering this topic.",
      sources: [],
      aiAssisted: false,
    });
  }

  const docMap = new Map(docs.map((d: any) => [d._id.toString(), d]));
  const contextChunks = results.map((r) => {
    const full = docMap.get(r.id);
    const content: string = full?.content || '';
    return { fileName: r.fileName, excerpt: content.slice(0, 2500) };
  });

  let answer: string;
  let aiAssisted = false;

  if (isAiConfigured()) {
    const contextText = contextChunks.map((c, i) => `[Source ${i + 1}: ${c.fileName}]\n${c.excerpt}`).join('\n\n---\n\n');
    const prompt =
      `You are a helpful assistant answering questions about a user's document collection. ` +
      `Use ONLY the information in the provided sources to answer the question. If the answer isn't in the sources, say so honestly. ` +
      `Cite sources by their name in parentheses, e.g. (privacy-policy.md), when relevant. Keep the answer concise (2-5 sentences), plain prose, no markdown.\n\n` +
      `Sources:\n${contextText}\n\n` +
      `Question: ${question}`;

    const aiAnswer = await generateText(prompt, { maxOutputTokens: 350, temperature: 0.3 });
    if (aiAnswer) {
      answer = aiAnswer.trim();
      aiAssisted = true;
    } else {
      answer = `Based on "${results[0].fileName}": ${stripHtml(results[0].snippet)}`;
    }
  } else {
    answer = `Based on "${results[0].fileName}": ${stripHtml(results[0].snippet)}`;
  }

  await Notification.create({
    userId: user.id,
    type: 'ai',
    title: 'Q&A answered',
    message: `"${question.slice(0, 60)}${question.length > 60 ? '…' : ''}" - answered using ${results.length} source${results.length > 1 ? 's' : ''}.`,
  });

  return NextResponse.json({
    answer,
    sources: results.map((r) => ({ fileName: r.fileName, fileId: r.id, snippet: r.snippet, score: r.score })),
    aiAssisted,
  });
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}
