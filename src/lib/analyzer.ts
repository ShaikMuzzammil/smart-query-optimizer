import { SlowPattern, QueryFile } from './store'

const STOPWORDS = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','with',
  'by','from','is','are','was','were','be','have','has','had','do','does','did','will','would',
  'could','should','this','that','i','you','he','she','it','we','they','what','which','who',
  'when','where','how','not','so','if','as','its','into','not','no'])

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g,' ').split(/\s+/)
    .filter(w => w.length > 2 && !STOPWORDS.has(w))
}

function normalize(q: string): string {
  return q.toLowerCase()
    .replace(/\b\d+(\.\d+)?\b/g,'?')
    .replace(/'[^']*'/g,"'?'")
    .replace(/"[^"]*"/g,'"?"')
    .replace(/\s+/g,' ').trim()
}

function categorize(q: string): string {
  const l = q.toLowerCase()
  if (/^(select|insert|update|delete|create|drop|alter|truncate|with|explain)/i.test(l)) return 'SQL'
  if (/\b(buy|purchase|order|price|shop|cost|cheap|deal|discount)\b/.test(l)) return 'Transactional'
  if (/\b(what|how|why|when|who|which|where|explain|define|meaning|tutorial)\b/.test(l)) return 'Informational'
  if (/^[a-z0-9]+\.(com|org|net|io|app)\b/.test(l)) return 'Navigational'
  return 'General'
}

export function analyzeFile(content: string, id: string, fileName: string, userId: string, sizeBytes: number): Omit<QueryFile,'uploadedAt'> {
  const lines = content.split('\n').map(l => l.trim()).filter(l => l.length >= 2)
  const totalQueries = lines.length

  // Normalize & deduplicate
  const patternMap = new Map<string, string[]>()
  lines.forEach(q => {
    const p = normalize(q)
    if (!patternMap.has(p)) patternMap.set(p, [])
    patternMap.get(p)!.push(q)
  })
  const uniquePatterns = patternMap.size

  // Length stats
  const lengths = lines.map(q => q.length)
  const avgLength = lengths.length ? Math.round(lengths.reduce((a,b)=>a+b,0)/lengths.length) : 0
  const minLength = lengths.length ? Math.min(...lengths) : 0
  const maxLength = lengths.length ? Math.max(...lengths) : 0

  // Duplicates
  const duplicates: string[] = []
  patternMap.forEach((instances, pattern) => {
    if (instances.length > 1) {
      duplicates.push(`"${pattern.substring(0,80)}" — appears ${instances.length}×`)
    }
  })

  // Top keywords
  const allTokens: string[] = lines.flatMap(q => tokenize(q))
  const freq = new Map<string,number>()
  allTokens.forEach(w => freq.set(w,(freq.get(w)||0)+1))
  const topKeywords = Array.from(freq.entries())
    .sort((a,b) => b[1]-a[1]).slice(0,12)
    .map(([word,freq]) => ({word,freq}))

  // Categories
  const catCounts = new Map<string,number>()
  lines.forEach(q => {
    const c = categorize(q)
    catCounts.set(c,(catCounts.get(c)||0)+1)
  })
  const categories = Array.from(catCounts.entries())
    .sort((a,b)=>b[1]-a[1])
    .map(([name,count]) => ({ name, count, pct: Math.round(count/Math.max(1,totalQueries)*100) }))

  // ── Detection Rules ───────────────────────────────────────
  const slowPatterns: SlowPattern[] = []

  // Rule 1: SELECT *
  const selectStar = lines.filter(q => /^\s*select\s+\*/i.test(q))
  if (selectStar.length > 0) {
    slowPatterns.push({
      pattern: 'SELECT * (all columns)', example: selectStar[0].substring(0,100),
      count: selectStar.length, impact: 'HIGH',
      suggestion: 'Specify only required columns to reduce data transfer and enable index-only scans',
      fix: 'SELECT id, name, email FROM users WHERE ...'
    })
  }

  // Rule 2: Leading wildcard LIKE
  const leadingWildcard = lines.filter(q => /like\s+['"]\s*%/i.test(q))
  if (leadingWildcard.length > 0) {
    slowPatterns.push({
      pattern: "LIKE '%...' leading wildcard", example: leadingWildcard[0].substring(0,100),
      count: leadingWildcard.length, impact: 'HIGH',
      suggestion: "Leading wildcard prevents B-tree index usage — full table scan every time",
      fix: "Use MATCH() AGAINST() for full-text search, or LIKE 'prefix%' for trailing-only wildcard"
    })
  }

  // Rule 3: SELECT without WHERE
  const noWhere = lines.filter(q => /^\s*(select|update|delete)/i.test(q) && !/\bwhere\b/i.test(q) && !/\blimit\s+\d/i.test(q))
  if (noWhere.length > 0) {
    slowPatterns.push({
      pattern: 'Missing WHERE clause', example: noWhere[0].substring(0,100),
      count: noWhere.length, impact: 'HIGH',
      suggestion: 'Full table scan — no filtering applied. Catastrophic on large tables',
      fix: 'Always add WHERE condition or at minimum LIMIT 1000 to prevent runaway scans'
    })
  }

  // Rule 4: Multiple OR (use IN instead)
  const multipleOr = lines.filter(q => (q.match(/\bor\b/gi)||[]).length >= 3)
  if (multipleOr.length > 0) {
    slowPatterns.push({
      pattern: 'Multiple OR conditions (use IN)', example: multipleOr[0].substring(0,100),
      count: multipleOr.length, impact: 'MEDIUM',
      suggestion: 'Multiple OR conditions cannot always use indexes efficiently',
      fix: 'WHERE status IN (1,2,3) is faster than status=1 OR status=2 OR status=3'
    })
  }

  // Rule 5: N+1 pattern (same query repeated many times)
  const repeated = Array.from(patternMap.entries()).filter(([,v]) => v.length > 4)
  if (repeated.length > 0) {
    const totalRepeats = repeated.reduce((s,[,v]) => s+v.length, 0)
    slowPatterns.push({
      pattern: 'N+1 Query Pattern (repeated queries)', example: repeated[0][1][0].substring(0,100),
      count: totalRepeats, impact: 'HIGH',
      suggestion: `${repeated.length} query patterns repeat 5+ times — prime caching or batching opportunity`,
      fix: 'Use WHERE id IN (id1,id2,...) batch fetch, or Redis cache with TTL for repeated reads'
    })
  }

  // Rule 6: ORDER BY without LIMIT
  const orderNoLimit = lines.filter(q => /order\s+by/i.test(q) && !/limit\s+\d/i.test(q))
  if (orderNoLimit.length > 0) {
    slowPatterns.push({
      pattern: 'ORDER BY without LIMIT', example: orderNoLimit[0].substring(0,100),
      count: orderNoLimit.length, impact: 'MEDIUM',
      suggestion: 'Sorting entire result set without limiting rows is expensive on large datasets',
      fix: 'Add LIMIT 100 to all paginated queries; use cursor-based pagination for large sets'
    })
  }

  // Rule 7: Stopword-heavy queries
  const stopwordHeavy = lines.filter(q => {
    const words = q.toLowerCase().split(/\s+/).filter(w => w.length > 1)
    if (words.length < 3) return false
    const stops = words.filter(w => STOPWORDS.has(w))
    return stops.length / words.length > 0.65
  })
  if (stopwordHeavy.length > 0) {
    slowPatterns.push({
      pattern: 'Stopword-heavy search query', example: stopwordHeavy[0].substring(0,100),
      count: stopwordHeavy.length, impact: 'LOW',
      suggestion: 'Queries dominated by stopwords (the, a, is, are) yield poor search results',
      fix: 'Strip stopwords before indexing; use Porter stemming; implement TF-IDF weighting'
    })
  }

  // Rule 8: JOIN without index hint
  const joinNoIndex = lines.filter(q => /\bjoin\b/i.test(q) && !/\bindex\b/i.test(q) && !/\buse\s+index\b/i.test(q))
  if (joinNoIndex.length > 0) {
    slowPatterns.push({
      pattern: 'JOIN without explicit index hint', example: joinNoIndex[0].substring(0,100),
      count: joinNoIndex.length, impact: 'MEDIUM',
      suggestion: 'JOIN columns should have indexes; optimizer may choose poor join order',
      fix: 'CREATE INDEX idx_orders_user_id ON orders(user_id); or USE INDEX(idx_name) hint'
    })
  }

  // Rule 9: Overly long queries
  const longQueries = lines.filter(q => q.length > 400)
  if (longQueries.length > 0) {
    slowPatterns.push({
      pattern: 'Excessively long query (>400 chars)', example: longQueries[0].substring(0,100)+'...',
      count: longQueries.length, impact: 'MEDIUM',
      suggestion: 'Long queries are hard to optimize and maintain; parse time increases',
      fix: 'Refactor using CTEs: WITH active_users AS (SELECT ...) SELECT FROM active_users'
    })
  }

  // Rule 10: Boolean operator misuse in search
  const booleanMisuse = lines.filter(q => /\b(and|or|not)\b/i.test(q) && !/^\s*(select|insert|update|delete)/i.test(q) && q.split(/\s+/).length < 4)
  if (booleanMisuse.length > 0) {
    slowPatterns.push({
      pattern: 'Boolean operators in short search query', example: booleanMisuse[0].substring(0,100),
      count: booleanMisuse.length, impact: 'LOW',
      suggestion: 'Short queries with AND/OR/NOT are ambiguous and return poor results',
      fix: 'Use quoted phrases for exact match: "machine learning" instead of machine AND learning'
    })
  }

  // ── Auto suggestions ─────────────────────────────────────
  const suggestions: string[] = []
  if (selectStar.length > 0) suggestions.push(`${selectStar.length} queries use SELECT * — projecting only needed columns can reduce I/O by 60-80%`)
  if (duplicates.length > 0) suggestions.push(`${duplicates.length} duplicate query patterns detected — Redis caching could eliminate ${Math.round(duplicates.length/Math.max(1,totalQueries)*100)}% of DB load`)
  if (leadingWildcard.length > 0) suggestions.push(`${leadingWildcard.length} LIKE '%...' queries — migrate to PostgreSQL full-text search (tsvector) for 10-50× speedup`)
  if (noWhere.length > 0) suggestions.push(`${noWhere.length} queries lack WHERE clause — add NOT NULL checks and row limits to prevent full scans`)
  if (categories.length > 0) suggestions.push(`${categories[0].name} queries dominate at ${categories[0].pct}% — build a dedicated index or cache layer for this category`)
  if (topKeywords[0]) suggestions.push(`Term "${topKeywords[0].word}" appears ${topKeywords[0].freq}× — consider a materialized view or dedicated index for this hot term`)

  return {
    id, userId, fileName, rawContent: content, sizeBytes,
    totalQueries, uniquePatterns, avgLength, minLength, maxLength,
    topKeywords, slowPatterns, duplicates: duplicates.slice(0,15),
    categories, status: 'DONE', suggestions: suggestions.slice(0,6)
  }
}

// ── BM25 Search ───────────────────────────────────────────────
export function buildIndex(fileId: string, content: string, invertedIndex: Map<string,Map<string,number>>) {
  const tokens = content.toLowerCase().replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(w=>w.length>2)
  const freq = new Map<string,number>()
  tokens.forEach(w => freq.set(w,(freq.get(w)||0)+1))
  freq.forEach((count, word) => {
    if (!invertedIndex.has(word)) invertedIndex.set(word, new Map())
    invertedIndex.get(word)!.set(fileId, count)
  })
}

export function bm25Search(query: string, invertedIndex: Map<string,Map<string,number>>, files: Map<string,any>): {fileId:string;score:number;excerpt:string;matches:number}[] {
  const terms = tokenize(query)
  if (!terms.length) return []
  const N = files.size || 1
  const scores = new Map<string,number>()
  const allTokenCounts = new Map<string,number>()
  files.forEach((f,id) => {
    const c = (f.rawContent||'').toLowerCase().replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter((w:string)=>w.length>2).length
    allTokenCounts.set(id, c)
  })
  const avgdl = allTokenCounts.size ? Array.from(allTokenCounts.values()).reduce((a,b)=>a+b,0)/allTokenCounts.size : 1

  terms.forEach(term => {
    const postings = invertedIndex.get(term)
    if (!postings) return
    const df = postings.size
    const idf = Math.log((N+1)/(df+0.5))
    postings.forEach((tf, fid) => {
      const dl = allTokenCounts.get(fid)||1
      const k1=1.5,b=0.75
      const bm25 = idf*((tf*(k1+1))/(tf+k1*(1-b+b*(dl/avgdl))))
      scores.set(fid,(scores.get(fid)||0)+bm25)
    })
  })

  return Array.from(scores.entries()).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([fileId,score]) => {
    const f = files.get(fileId)
    const content = f?.rawContent||''
    const idx = content.toLowerCase().indexOf(terms[0]||'')
    const start = Math.max(0,idx-60)
    const excerpt = idx>=0 ? '…'+content.slice(start,start+180)+'…' : content.slice(0,180)
    return { fileId, score:Math.round(score*100)/100, excerpt, matches:terms.filter(t=>invertedIndex.get(t)?.has(fileId)).length }
  })
}
