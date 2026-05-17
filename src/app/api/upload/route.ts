import { NextRequest, NextResponse } from 'next/server'
import { indexFile } from '../../../lib/indexer'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
    if (!file.name.endsWith('.txt')) return NextResponse.json({ error: 'Only .txt files are supported.' }, { status: 400 })
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'File too large. Max 5MB.' }, { status: 400 })

    const content = await file.text()
    if (!content.trim()) return NextResponse.json({ error: 'File is empty.' }, { status: 400 })

    const id = 'idx_' + Date.now() + '_' + Math.random().toString(36).slice(2,7)
    const indexed = indexFile(id, file.name, content)

    return NextResponse.json({
      ok: true,
      file: {
        id: indexed.id,
        name: indexed.name,
        wordCount: indexed.wordCount,
        uniqueWords: indexed.uniqueWords,
        sizeBytes: indexed.sizeBytes,
        status: indexed.status,
        uploadedAt: indexed.uploadedAt,
        topKeywords: indexed.topKeywords,
        vocabRichness: indexed.vocabRichness,
        avgWordLength: indexed.avgWordLength,
        queryAnalysis: indexed.queryAnalysis,
        pages: Math.max(1, Math.round(indexed.wordCount / 500)),
        size: indexed.sizeBytes > 1024*1024
          ? (indexed.sizeBytes/1024/1024).toFixed(1)+' MB'
          : Math.round(indexed.sizeBytes/1024)+' KB',
      }
    }, { status: 201 })
  } catch (err: any) {
    console.error('[Upload Error]', err)
    return NextResponse.json({ error: 'Failed to process file.' }, { status: 500 })
  }
}
