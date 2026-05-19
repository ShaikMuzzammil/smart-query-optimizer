export interface User {
  id: string; name: string; email: string; passwordHash: string; plan: string; createdAt: string
}
export interface SlowPattern {
  pattern: string; example: string; count: number; impact: 'HIGH'|'MEDIUM'|'LOW'; suggestion: string; fix: string
}
export interface QueryFile {
  id: string; userId: string; fileName: string; uploadedAt: string; rawContent: string
  totalQueries: number; uniquePatterns: number; avgLength: number; minLength: number; maxLength: number
  topKeywords: {word:string;freq:number}[]; slowPatterns: SlowPattern[]; duplicates: string[]
  categories: {name:string;count:number;pct:number}[]; status: 'DONE'|'ERROR'; sizeBytes: number
  suggestions: string[]
}
export interface QueryLog {
  id: string; userId: string; query: string; latencyMs: number; success: boolean
  resultCount: number; ts: string; category: string
}

const users = new Map<string,User>()
const queryFiles = new Map<string,QueryFile>()
const queryLogs: QueryLog[] = []
const invertedIndex = new Map<string,Map<string,number>>()

export const store = { users, queryFiles, queryLogs, invertedIndex }
