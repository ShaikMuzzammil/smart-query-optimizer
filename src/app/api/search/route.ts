import { NextRequest, NextResponse } from 'next/server'
import { store } from '../../../lib/store'
import { bm25Search } from '../../../lib/analyzer'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()
  if (!q) return NextResponse.json({error:'q required'},{status:400})
  const start = Date.now()
  const results = bm25Search(q, store.invertedIndex, store.queryFiles)
  const latency = Date.now()-start
  // Attach file names
  const enriched = results.map(r=>({ ...r, fileName: store.queryFiles.get(r.fileId)?.fileName||r.fileId }))
  store.queryLogs.push({ id:'l_'+Date.now(), userId:'anon', query:q, latencyMs:latency, success:true, resultCount:results.length, ts:new Date().toISOString(), category:'Search' })
  return NextResponse.json({ query:q, results:enriched, total:results.length, latencyMs:latency })
}
