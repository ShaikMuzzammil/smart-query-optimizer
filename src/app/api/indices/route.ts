import { NextResponse } from 'next/server'
import { store } from '../../../lib/store'

export async function GET() {
  const files = Array.from(store.queryFiles.values())
    .sort((a,b)=>new Date(b.uploadedAt).getTime()-new Date(a.uploadedAt).getTime())
  return NextResponse.json({ files: files.map(f=>({
    id:f.id, fileName:f.fileName, uploadedAt:f.uploadedAt, status:f.status,
    totalQueries:f.totalQueries, uniquePatterns:f.uniquePatterns,
    sizeBytes:f.sizeBytes, topKeywords:f.topKeywords.slice(0,5),
    slowPatterns:f.slowPatterns, duplicates:f.duplicates,
    categories:f.categories, suggestions:f.suggestions,
    avgLength:f.avgLength, minLength:f.minLength, maxLength:f.maxLength
  })) })
}
