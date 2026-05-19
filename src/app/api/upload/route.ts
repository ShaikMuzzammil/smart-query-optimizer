import { NextRequest, NextResponse } from 'next/server'
import { store } from '../../../lib/store'
import { analyzeFile, buildIndex } from '../../../lib/analyzer'

export async function POST(req: NextRequest) {
  try {
    const fd = await req.formData()
    const file = fd.get('file') as File|null
    if (!file) return NextResponse.json({error:'No file'},{status:400})
    if (!file.name.endsWith('.txt')) return NextResponse.json({error:'Only .txt files supported'},{status:400})
    if (file.size > 10*1024*1024) return NextResponse.json({error:'Max 10MB'},{status:400})
    const content = await file.text()
    if (!content.trim()) return NextResponse.json({error:'File is empty'},{status:400})

    const id = 'f_'+Date.now()+'_'+Math.random().toString(36).slice(2,6)
    const result = analyzeFile(content, id, file.name, 'anon', file.size)
    const qFile = { ...result, uploadedAt: new Date().toISOString() }
    store.queryFiles.set(id, qFile)
    buildIndex(id, content, store.invertedIndex)

    // Log a synthetic query entry
    store.queryLogs.push({
      id:'l_'+Date.now(), userId:'anon', query:`Uploaded: ${file.name}`,
      latencyMs: Math.round(Math.random()*80)+20, success:true,
      resultCount: qFile.totalQueries, ts: new Date().toISOString(), category:'Upload'
    })

    return NextResponse.json({ok:true, file:{
      id:qFile.id, fileName:qFile.fileName, uploadedAt:qFile.uploadedAt,
      totalQueries:qFile.totalQueries, uniquePatterns:qFile.uniquePatterns,
      avgLength:qFile.avgLength, minLength:qFile.minLength, maxLength:qFile.maxLength,
      topKeywords:qFile.topKeywords, slowPatterns:qFile.slowPatterns,
      duplicates:qFile.duplicates, categories:qFile.categories,
      status:qFile.status, sizeBytes:qFile.sizeBytes, suggestions:qFile.suggestions
    }},{status:201})
  } catch(e:any) {
    console.error('[Upload]',e)
    return NextResponse.json({error:'Processing failed: '+e.message},{status:500})
  }
}
