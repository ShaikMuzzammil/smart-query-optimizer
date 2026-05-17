import { NextRequest, NextResponse } from 'next/server'
import { getAllFiles } from '../../../lib/indexer'

export async function GET() {
  const files = getAllFiles()
  return NextResponse.json({
    indices: files.map(f => ({
      id: f.id, name: f.name, status: f.status,
      pages: Math.max(1, Math.round(f.wordCount / 500)),
      size: f.sizeBytes > 1024*1024 ? (f.sizeBytes/1024/1024).toFixed(1)+' MB' : Math.round(f.sizeBytes/1024)+' KB',
      wordCount: f.wordCount, uniqueWords: f.uniqueWords,
      uploadedAt: f.uploadedAt, topKeywords: f.topKeywords.slice(0,3),
      vocabRichness: f.vocabRichness, avgWordLength: f.avgWordLength,
      queryAnalysis: f.queryAnalysis,
    }))
  })
}
