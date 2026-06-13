import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../../lib/session';
import { dbConnect, isDbConfigured } from '../../../../lib/db/connect';
import FileDoc from '../../../../lib/db/models/FileDoc';
import { InvertedIndex } from '../../../../lib/search/invertedIndex';
import { optimizeQuery } from '../../../../lib/search/queryOptimizer';
import { checkRateLimit } from '../../../../lib/rateLimit';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const optimizerMax = parseInt(process.env.RATE_LIMIT_OPTIMIZER_MAX || '30', 10);
  const rate = checkRateLimit(`optimize:${user.id}`, optimizerMax, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Too many optimizer requests. Please slow down.' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfterSec) } });
  }

  const body = await req.json().catch(() => ({}));
  const rawQuery: string = (body.query || '').toString().trim();
  if (!rawQuery) return NextResponse.json({ error: 'Query cannot be empty.' }, { status: 400 });

  let vocabulary: string[] = [];
  let estimatedResults = 0;

  if (isDbConfigured()) {
    await dbConnect();
    const docs = await FileDoc.find({ userId: user.id, status: 'indexed' }).select('fileName content createdAt').lean();
    const index = new InvertedIndex(
      docs.map((d: any) => ({ id: d._id.toString(), fileName: d.fileName, content: d.content || '', uploadDate: d.createdAt }))
    );
    vocabulary = index.vocabulary();
    const optimizer = await optimizeQuery(rawQuery, vocabulary.length ? vocabulary : index.surfaceVocabulary());
    estimatedResults = index.search(optimizer.expandedTerms, { limit: 50 }).length;
    return NextResponse.json({ ...optimizer, estimatedResults });
  }

  const optimizer = await optimizeQuery(rawQuery, vocabulary);
  return NextResponse.json({ ...optimizer, estimatedResults });
}
