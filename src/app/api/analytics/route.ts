import { NextResponse } from 'next/server'
import { store } from '../../../lib/store'

export async function GET() {
  const files = Array.from(store.queryFiles.values())
  const logs = store.queryLogs
  const totalFiles = files.length
  const totalQueries = files.reduce((s,f)=>s+f.totalQueries,0)
  const totalSearches = logs.filter(l=>l.category==='Search').length
  const avgLatency = logs.length ? Math.round(logs.reduce((s,l)=>s+l.latencyMs,0)/logs.length) : 0
  const successRate = logs.length ? Math.round(logs.filter(l=>l.success).length/logs.length*1000)/10 : 100
  const allCategories = new Map<string,number>()
  files.forEach(f=>f.categories.forEach(c=>allCategories.set(c.name,(allCategories.get(c.name)||0)+c.count)))
  const categorySummary = Array.from(allCategories.entries()).map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count)
  const allKeywords = new Map<string,number>()
  files.forEach(f=>f.topKeywords.forEach(k=>allKeywords.set(k.word,(allKeywords.get(k.word)||0)+k.freq)))
  const topKeywords = Array.from(allKeywords.entries()).sort((a,b)=>b[1]-a[1]).slice(0,15).map(([word,freq])=>({word,freq}))
  const allSuggestions = Array.from(new Set(files.flatMap(f=>f.suggestions))).slice(0,8)
  const recentLogs = logs.slice(-20).reverse().map(l=>({
    query:l.query, latencyMs:l.latencyMs, success:l.success, ts:l.ts, category:l.category
  }))
  const slowCount = files.flatMap(f=>f.slowPatterns).filter(p=>p.impact==='HIGH').length
  const indexTerms = store.invertedIndex.size
  return NextResponse.json({ totalFiles, totalQueries, totalSearches, avgLatency, successRate, categorySummary, topKeywords, allSuggestions, recentLogs, slowCount, indexTerms })
}
