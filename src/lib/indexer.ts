// ============================================================
// Real Inverted Index Engine — BM25 Scoring
// ============================================================

export interface IndexedFile {
  id: string
  name: string
  content: string
  words: string[]
  wordCount: number
  uniqueWords: number
  sizeBytes: number
  uploadedAt: string
  status: 'INDEXING' | 'COMPLETED' | 'ERROR'
  topKeywords: { word: string; freq: number }[]
  vocabRichness: number
  avgWordLength: number
  queryAnalysis: QueryAnalysis | null
}

export interface QueryAnalysis {
  totalQueries: number
  uniquePatterns: number
  avgLength: number
  minLength: number
  maxLength: number
  duplicates: string[]
  slowPatterns: SlowPattern[]
  suggestions: Suggestion[]
}

export interface SlowPattern {
  pattern: string
  example: string
  count: number
  impact: 'HIGH' | 'MEDIUM' | 'LOW'
  suggestion: string
  fix: string
}

export interface Suggestion {
  rule: string
  description: string
  impact: 'HIGH' | 'MEDIUM' | 'LOW'
  count: number
}

export interface SearchResult {
  fileId: string
  fileName: string
  score: number
  matchCount: number
  excerpt: string
  highlights: string[]
}

// ── Inverted Index: word → { fileId → frequency } ──
const invertedIndex = new Map<string, Map<string, number>>()
const fileStore = new Map<string, IndexedFile>()

// ── Stopwords ──
const STOPWORDS = new Set(['the','a','an','and','or','but','in','on','at','to','for',
  'of','with','by','from','is','are','was','were','be','been','being','have','has',
  'had','do','does','did','will','would','could','should','may','might','shall',
  'this','that','these','those','i','you','he','she','it','we','they','what',
  'which','who','when','where','how','not','no','so','if','as','its','into'])

function tokenize(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOPWORDS.has(w))
}

function getTopKeywords(words: string[], n = 10): { word: string; freq: number }[] {
  const freq = new Map<string, number>()
  words.forEach(w => { if (!STOPWORDS.has(w)) freq.set(w, (freq.get(w) || 0) + 1) })
  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([word, freq]) => ({ word, freq }))
}

// ── SQL / Query Analysis Rules ──
function analyzeQueries(content: string): QueryAnalysis {
  const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 3)
  const queries = lines
  const totalQueries = queries.length

  // Normalize patterns
  const normalize = (q: string) => q.toLowerCase()
    .replace(/\b\d+\b/g, '?')
    .replace(/'[^']*'/g, '?')
    .replace(/"[^"]*"/g, '?')
    .trim()

  const patternMap = new Map<string, string[]>()
  queries.forEach(q => {
    const p = normalize(q)
    if (!patternMap.has(p)) patternMap.set(p, [])
    patternMap.get(p)!.push(q)
  })

  const uniquePatterns = patternMap.size
  const lengths = queries.map(q => q.length)
  const avgLength = lengths.length ? Math.round(lengths.reduce((a,b) => a+b, 0) / lengths.length) : 0
  const minLength = lengths.length ? Math.min(...lengths) : 0
  const maxLength = lengths.length ? Math.max(...lengths) : 0

  // Duplicates
  const duplicates: string[] = []
  patternMap.forEach((instances, pattern) => {
    if (instances.length > 1) duplicates.push(`"${pattern}" appears ${instances.length}x`)
  })

  // Detection rules
  const slowPatterns: SlowPattern[] = []
  const suggestions: Suggestion[] = []

  // Rule 1: SELECT *
  const selectStar = queries.filter(q => /select\s+\*/i.test(q))
  if (selectStar.length > 0) {
    slowPatterns.push({ pattern: 'SELECT *', example: selectStar[0], count: selectStar.length, impact: 'HIGH', suggestion: 'Specify only needed columns', fix: 'SELECT col1, col2 FROM table' })
    suggestions.push({ rule: 'SELECT *', description: `${selectStar.length} queries fetch all columns — wasteful on wide tables`, impact: 'HIGH', count: selectStar.length })
  }

  // Rule 2: LIKE with leading wildcard
  const leadingWildcard = queries.filter(q => /like\s+'%/i.test(q))
  if (leadingWildcard.length > 0) {
    slowPatterns.push({ pattern: "LIKE '%...'", example: leadingWildcard[0], count: leadingWildcard.length, impact: 'HIGH', suggestion: 'Use full-text search or trailing wildcard', fix: "Use MATCH() AGAINST() or LIKE 'term%'" })
    suggestions.push({ rule: 'Leading Wildcard', description: `${leadingWildcard.length} queries use LIKE '%...' — cannot use B-tree index`, impact: 'HIGH', count: leadingWildcard.length })
  }

  // Rule 3: Missing WHERE clause
  const noWhere = queries.filter(q => /^select/i.test(q) && !/where/i.test(q) && !/limit/i.test(q))
  if (noWhere.length > 0) {
    slowPatterns.push({ pattern: 'SELECT without WHERE', example: noWhere[0], count: noWhere.length, impact: 'HIGH', suggestion: 'Add WHERE clause or LIMIT', fix: 'SELECT ... FROM table WHERE condition LIMIT 100' })
    suggestions.push({ rule: 'No WHERE clause', description: `${noWhere.length} queries do full table scans`, impact: 'HIGH', count: noWhere.length })
  }

  // Rule 4: OR instead of IN
  const orQueries = queries.filter(q => (q.match(/\bor\b/gi) || []).length > 2)
  if (orQueries.length > 0) {
    slowPatterns.push({ pattern: 'Multiple OR conditions', example: orQueries[0], count: orQueries.length, impact: 'MEDIUM', suggestion: 'Replace OR with IN()', fix: "WHERE id IN (1, 2, 3) instead of id=1 OR id=2 OR id=3" })
    suggestions.push({ rule: 'OR vs IN', description: `${orQueries.length} queries use multiple OR — IN() is faster`, impact: 'MEDIUM', count: orQueries.length })
  }

  // Rule 5: N+1 patterns (repeated similar queries)
  const repeated = Array.from(patternMap.entries()).filter(([,v]) => v.length > 3)
  if (repeated.length > 0) {
    slowPatterns.push({ pattern: 'N+1 Query Pattern', example: repeated[0][1][0], count: repeated.reduce((s,[,v]) => s+v.length,0), impact: 'HIGH', suggestion: 'Batch with IN() or use JOIN', fix: 'SELECT ... WHERE id IN (ids) instead of individual queries' })
    suggestions.push({ rule: 'N+1 Queries', description: `${repeated.length} patterns repeat 3+ times — cache or batch`, impact: 'HIGH', count: repeated.length })
  }

  // Rule 6: Overly long queries
  const longQueries = queries.filter(q => q.length > 500)
  if (longQueries.length > 0) {
    slowPatterns.push({ pattern: 'Extremely Long Query', example: longQueries[0].substring(0,100)+'...', count: longQueries.length, impact: 'MEDIUM', suggestion: 'Break into subqueries or CTEs', fix: 'WITH cte AS (SELECT ...) SELECT FROM cte' })
    suggestions.push({ rule: 'Query Length', description: `${longQueries.length} queries exceed 500 chars — consider CTEs`, impact: 'MEDIUM', count: longQueries.length })
  }

  // Rule 7: Stopword-heavy search queries
  const stopwordHeavy = queries.filter(q => {
    const words = q.toLowerCase().split(/\s+/)
    const stops = words.filter(w => STOPWORDS.has(w))
    return words.length > 0 && stops.length / words.length > 0.6
  })
  if (stopwordHeavy.length > 0) {
    slowPatterns.push({ pattern: 'Stopword-heavy Query', example: stopwordHeavy[0], count: stopwordHeavy.length, impact: 'LOW', suggestion: 'Remove stopwords before indexing', fix: 'Strip common words (the, a, is, are) from search terms' })
    suggestions.push({ rule: 'Stopword Heavy', description: `${stopwordHeavy.length} queries are mostly stopwords — inefficient`, impact: 'LOW', count: stopwordHeavy.length })
  }

  return { totalQueries, uniquePatterns, avgLength, minLength, maxLength, duplicates: duplicates.slice(0,10), slowPatterns, suggestions }
}

// ── Public API ──
export function indexFile(id: string, name: string, content: string): IndexedFile {
  const allWords = content.toLowerCase().replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(w => w.length > 1)
  const tokens = tokenize(content)
  const unique = new Set(tokens)

  // Build inverted index
  const freq = new Map<string, number>()
  tokens.forEach(w => freq.set(w, (freq.get(w)||0)+1))
  freq.forEach((count, word) => {
    if (!invertedIndex.has(word)) invertedIndex.set(word, new Map())
    invertedIndex.get(word)!.set(id, count)
  })

  const avgWordLength = allWords.length > 0
    ? Math.round(allWords.reduce((s,w) => s+w.length, 0) / allWords.length * 10) / 10
    : 0

  const file: IndexedFile = {
    id, name, content,
    words: tokens,
    wordCount: allWords.length,
    uniqueWords: unique.size,
    sizeBytes: new TextEncoder().encode(content).length,
    uploadedAt: new Date().toISOString(),
    status: 'COMPLETED',
    topKeywords: getTopKeywords(tokens),
    vocabRichness: allWords.length > 0 ? Math.round((unique.size / allWords.length) * 100) : 0,
    avgWordLength,
    queryAnalysis: analyzeQueries(content),
  }

  fileStore.set(id, file)
  return file
}

export function searchFiles(query: string): SearchResult[] {
  const terms = tokenize(query)
  if (!terms.length) return []

  const scores = new Map<string, number>()
  const N = fileStore.size || 1

  terms.forEach(term => {
    const postings = invertedIndex.get(term)
    if (!postings) return
    const df = postings.size
    const idf = Math.log((N + 1) / (df + 0.5))
    postings.forEach((tf, fileId) => {
      const file = fileStore.get(fileId)
      if (!file) return
      const dl = file.words.length
      const avgdl = Array.from(fileStore.values()).reduce((s,f) => s+f.words.length,0) / N
      const k1 = 1.5, b = 0.75
      const bm25 = idf * ((tf * (k1+1)) / (tf + k1*(1-b+b*(dl/avgdl))))
      scores.set(fileId, (scores.get(fileId)||0) + bm25)
    })
  })

  return Array.from(scores.entries())
    .sort((a,b) => b[1]-a[1])
    .slice(0,10)
    .map(([fileId, score]) => {
      const file = fileStore.get(fileId)!
      const idx = file.content.toLowerCase().indexOf(terms[0])
      const start = Math.max(0, idx-80)
      const excerpt = idx>=0 ? '…'+file.content.slice(start, start+200)+'…' : file.content.slice(0,200)
      return {
        fileId, fileName: file.name,
        score: Math.round(score*100)/100,
        matchCount: terms.filter(t => invertedIndex.get(t)?.has(fileId)).length,
        excerpt,
        highlights: terms,
      }
    })
}

export function getFile(id: string): IndexedFile | undefined {
  return fileStore.get(id)
}

export function getAllFiles(): IndexedFile[] {
  return Array.from(fileStore.values()).sort((a,b) => new Date(b.uploadedAt).getTime()-new Date(a.uploadedAt).getTime())
}

export function deleteFile(id: string): boolean {
  const file = fileStore.get(id)
  if (!file) return false
  // Remove from inverted index
  file.words.forEach(word => {
    const postings = invertedIndex.get(word)
    if (postings) {
      postings.delete(id)
      if (postings.size === 0) invertedIndex.delete(word)
    }
  })
  fileStore.delete(id)
  return true
}

export function getStats() {
  const files = getAllFiles()
  const totalWords = files.reduce((s,f) => s+f.wordCount, 0)
  const totalSearches = searchLog.length
  return {
    totalFiles: files.size || files.length,
    totalWords,
    totalSearches,
    indexSize: invertedIndex.size,
  }
}

// Search log
const searchLog: { query: string; results: number; ts: string }[] = []
export function logSearch(query: string, results: number) {
  searchLog.push({ query, results, ts: new Date().toISOString() })
}
export function getSearchLog() { return searchLog.slice(-50).reverse() }
