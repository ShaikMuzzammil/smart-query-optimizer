import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query   = searchParams.get('q')?.trim()
  const page    = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const perPage = Math.min(50, parseInt(searchParams.get('per_page') || '10'))

  if (!query) return NextResponse.json({ error: 'Query "q" is required.' }, { status: 400 })

  const start = Date.now()
  const results = Array.from({ length: 5 }, (_, i) => ({
    rank: i + 1,
    url: `https://example-${i+1}.com/${query.replace(/\s+/g, '-')}`,
    title: `${query} — Result ${i + 1}`,
    snippet: `This document discusses <em>${query}</em> in detail, covering key concepts and practical implementation.`,
    score: +(0.95 - i * 0.08).toFixed(3),
    pageRank: +(0.90 - i * 0.06).toFixed(3),
    domain: `example-${i+1}.com`,
    cachedAt: new Date(Date.now() - i * 86400000).toISOString(),
    sizeBytes: 1024 * (20 + i * 10),
  }))

  return NextResponse.json({
    query, total: results.length, page, perPage,
    latencyMs: Date.now() - start,
    results: results.slice((page-1)*perPage, page*perPage),
  })
}
