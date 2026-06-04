import { NextRequest, NextResponse } from 'next/server'

const CORPUS = [
  'machine learning','distributed systems','next.js performance',
  'bm25 ranking algorithm','pagerank algorithm','web crawler design',
  'inverted index explained','redis autocomplete','typescript best practices',
  'postgresql full text search','grpc vs rest api','bloom filters',
  'docker kubernetes deployment','api rate limiting','jwt authentication',
  'react server components','tailwind css tips','prisma orm guide',
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const prefix = searchParams.get('q')?.toLowerCase().trim()
  if (!prefix || prefix.length < 2) return NextResponse.json({ suggestions: [] })
  const suggestions = CORPUS.filter(s => s.includes(prefix)).slice(0, 6)
  return NextResponse.json({ suggestions, prefix })
}
