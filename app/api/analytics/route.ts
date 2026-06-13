import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '../../../lib/session';
import { dbConnect, isDbConfigured } from '../../../lib/db/connect';
import FileDoc from '../../../lib/db/models/FileDoc';
import QueryLog from '../../../lib/db/models/QueryLog';
import { InvertedIndex } from '../../../lib/search/invertedIndex';

export const runtime = 'nodejs';

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function lastNDays(n: number): string[] {
  const days: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    days.push(dayKey(d));
  }
  return days;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  if (!isDbConfigured()) {
    return NextResponse.json({
      totals: { filesIndexed: 0, totalQueries: 0, indexTerms: 0, highImpactIssues: 0, avgReadabilityGrade: 'N/A' },
      queriesOverTime: lastNDays(14).map((d) => ({ date: d, count: 0 })),
      fileGrowth: lastNDays(14).map((d) => ({ date: d, count: 0 })),
      topTerms: [],
      sentimentTrend: lastNDays(14).map((d) => ({ date: d, positive: 0, negative: 0, neutral: 0 })),
      recentQueries: [],
      topFiles: [],
    });
  }

  await dbConnect();

  const files = await FileDoc.find({ userId: user.id }).select('fileName content createdAt analysis queryCount status').lean();
  const queryLogs = await QueryLog.find({ userId: user.id }).sort({ createdAt: -1 }).limit(500).lean();

  const indexedFiles = files.filter((f: any) => f.status === 'indexed');

  // Total terms via inverted index
  const index = new InvertedIndex(
    indexedFiles.map((d: any) => ({ id: d._id.toString(), fileName: d.fileName, content: d.content || '', uploadDate: d.createdAt }))
  );

  // High impact issues = total issue count across files
  const highImpactIssues = indexedFiles.reduce((sum: number, f: any) => sum + (f.analysis?.issues?.length || 0), 0);

  // Average readability grade level (most common)
  const gradeCounts = new Map<string, number>();
  for (const f of indexedFiles as any[]) {
    const grade = f.analysis?.readability?.gradeLevel;
    if (grade) gradeCounts.set(grade, (gradeCounts.get(grade) || 0) + 1);
  }
  let avgReadabilityGrade = 'N/A';
  let maxCount = 0;
  for (const [grade, count] of gradeCounts.entries()) {
    if (count > maxCount) {
      maxCount = count;
      avgReadabilityGrade = grade;
    }
  }

  // Queries over time (last 14 days)
  const days = lastNDays(14);
  const queryCountByDay = new Map<string, number>();
  for (const day of days) queryCountByDay.set(day, 0);
  for (const log of queryLogs as any[]) {
    const key = dayKey(new Date(log.createdAt));
    if (queryCountByDay.has(key)) queryCountByDay.set(key, (queryCountByDay.get(key) || 0) + 1);
  }

  // File growth (last 14 days)
  const fileCountByDay = new Map<string, number>();
  for (const day of days) fileCountByDay.set(day, 0);
  for (const f of files as any[]) {
    const key = dayKey(new Date(f.createdAt));
    if (fileCountByDay.has(key)) fileCountByDay.set(key, (fileCountByDay.get(key) || 0) + 1);
  }

  // Sentiment trend by day
  const sentimentByDay = new Map<string, { positive: number; negative: number; neutral: number }>();
  for (const day of days) sentimentByDay.set(day, { positive: 0, negative: 0, neutral: 0 });
  for (const f of indexedFiles as any[]) {
    const key = dayKey(new Date(f.createdAt));
    if (sentimentByDay.has(key) && f.analysis?.sentiment?.label) {
      const bucket = sentimentByDay.get(key)!;
      bucket[f.analysis.sentiment.label as 'positive' | 'negative' | 'neutral']++;
    }
  }

  // Top terms across corpus (aggregate keyword scores)
  const termScores = new Map<string, number>();
  for (const f of indexedFiles as any[]) {
    for (const kw of f.analysis?.keywords || []) {
      termScores.set(kw.term, (termScores.get(kw.term) || 0) + kw.score);
    }
  }
  const topTerms = Array.from(termScores.entries())
    .map(([term, score]) => ({ term, score: Math.round(score * 1000) / 1000 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  // Top files by query count
  const topFiles = [...files]
    .sort((a: any, b: any) => (b.queryCount || 0) - (a.queryCount || 0))
    .slice(0, 5)
    .map((f: any) => ({ fileName: f.fileName, queryCount: f.queryCount || 0, id: f._id.toString() }));

  // Recent queries
  const recentQueries = (queryLogs as any[]).slice(0, 8).map((q) => ({
    query: q.query,
    correctedQuery: q.correctedQuery,
    resultCount: q.resultCount,
    createdAt: q.createdAt,
  }));

  return NextResponse.json({
    totals: {
      filesIndexed: indexedFiles.length,
      totalQueries: queryLogs.length,
      indexTerms: index.totalTerms(),
      highImpactIssues,
      avgReadabilityGrade,
    },
    queriesOverTime: days.map((d) => ({ date: d, count: queryCountByDay.get(d) || 0 })),
    fileGrowth: days.map((d) => ({ date: d, count: fileCountByDay.get(d) || 0 })),
    topTerms,
    sentimentTrend: days.map((d) => ({ date: d, ...sentimentByDay.get(d)! })),
    recentQueries,
    topFiles,
  });
}
