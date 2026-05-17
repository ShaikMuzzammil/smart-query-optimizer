import { NextRequest, NextResponse } from 'next/server'
import { searchFiles, logSearch } from '../../../lib/indexer'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q')?.trim()
  if (!query) return NextResponse.json({ error: 'Query "q" required.' }, { status: 400 })

  const start = Date.now()
  const results = searchFiles(query)
  const latency = Date.now() - start
  logSearch(query, results.length)

  return NextResponse.json({ query, results, total: results.length, latencyMs: latency })
}
