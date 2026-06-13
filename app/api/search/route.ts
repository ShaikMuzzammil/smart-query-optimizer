import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../lib/session';
import { dbConnect, isDbConfigured } from '../../../lib/db/connect';
import FileDoc from '../../../lib/db/models/FileDoc';
import QueryLog from '../../../lib/db/models/QueryLog';
import { InvertedIndex } from '../../../lib/search/invertedIndex';
import { optimizeQuery } from '../../../lib/search/queryOptimizer';
import { buildUserTermWeights } from '../../../lib/search/personalization';
import { checkRateLimit } from '../../../lib/rateLimit';

export const runtime = 'nodejs';
export const maxDuration = 30;

interface SearchFilters {
  sentiment?: 'positive' | 'negative' | 'neutral';
  fileType?: string;
  minWordCount?: number;
  dateFrom?: string;
  dateTo?: string;
}

export async function POST(req: NextRequest) {
  const start = Date.now();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isDbConfigured()) return NextResponse.json({ error: 'Search requires MongoDB. Add MONGODB_URI to your environment.' }, { status: 503 });

  const optimizerMax = parseInt(process.env.RATE_LIMIT_OPTIMIZER_MAX || '30', 10);
  const rate = checkRateLimit(`search:${user.id}`, optimizerMax * 3, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Too many searches. Please slow down.' }, { status: 429, headers: { 'Retry-After': String(rate.retryAfterSec) } });
  }

  const body = await req.json().catch(() => ({}));
  const rawQuery: string = (body.query || '').toString().trim();
  const limit: number = Math.min(Math.max(parseInt(body.limit, 10) || 10, 1), 50);
  const filters: SearchFilters = body.filters || {};

  if (!rawQuery) {
    return NextResponse.json({ error: 'Query cannot be empty.' }, { status: 400 });
  }

  try {
    await dbConnect();

    const fileFilter: any = { userId: user.id, status: 'indexed' };
    if (filters.fileType) fileFilter.fileType = filters.fileType;
    if (filters.minWordCount) fileFilter.wordCount = { $gte: filters.minWordCount };
    if (filters.dateFrom || filters.dateTo) {
      fileFilter.createdAt = {};
      if (filters.dateFrom) fileFilter.createdAt.$gte = new Date(filters.dateFrom);
      if (filters.dateTo) fileFilter.createdAt.$lte = new Date(filters.dateTo);
    }
    if (filters.sentiment) fileFilter['analysis.sentiment.label'] = filters.sentiment;

    const docs = await FileDoc.find(fileFilter).select('fileName content createdAt analysis').lean();

    const index = new InvertedIndex(
      docs.map((d: any) => ({
        id: d._id.toString(),
        fileName: d.fileName,
        content: d.content || '',
        uploadDate: d.createdAt,
      }))
    );

    const vocabulary = index.vocabulary();
    const optimizer = await optimizeQuery(rawQuery, vocabulary.length ? vocabulary : index.surfaceVocabulary());

    // Personalization weights from prior successful searches
    const pastLogs = await QueryLog.find({ userId: user.id }).select('query resultCount').sort({ createdAt: -1 }).limit(100).lean();
    const userTermWeights = buildUserTermWeights(pastLogs as any);

    const results = index.search(optimizer.expandedTerms, { userTermWeights, limit });

    const avgScore = results.length ? results.reduce((sum, r) => sum + r.score, 0) / results.length : 0;
    const durationMs = Date.now() - start;

    await QueryLog.create({
      userId: user.id,
      query: rawQuery,
      correctedQuery: optimizer.correctedQuery !== rawQuery.toLowerCase() ? optimizer.correctedQuery : undefined,
      resultCount: results.length,
      avgScore: Math.round(avgScore * 1000) / 1000,
      matchedFileIds: results.map((r) => r.id),
      rankingStrategy: optimizer.rankingStrategy,
      durationMs,
    });

    if (results.length > 0) {
      await FileDoc.updateMany({ _id: { $in: results.map((r) => r.id) } }, { $inc: { queryCount: 1 } });
    }

    return NextResponse.json({
      results: results.map((r) => ({
        id: r.id,
        fileName: r.fileName,
        score: r.score,
        rawBm25: r.rawBm25,
        recencyBoost: r.recencyBoost,
        personalBoost: r.personalBoost,
        termContributions: r.termContributions,
        snippet: r.snippet,
        matchedTerms: r.matchedTerms,
        uploadDate: r.uploadDate,
      })),
      optimizer: {
        ...optimizer,
        estimatedResults: results.length,
      },
      durationMs,
    });
  } catch (err: any) {
    console.error('[api/search] DB error:', err?.message || err);
    return NextResponse.json(
      { error: `Could not reach the database: ${err?.message || 'unknown error'}. Check MONGODB_URI and your Atlas Network Access list.` },
      { status: 503 }
    );
  }
}
