// In-memory store — works without a real database.
// In production: replace these Map operations with Prisma calls.

export interface User {
  id: string
  name: string
  email: string
  passwordHash: string
  plan: string
  createdAt: string
}

export interface IndexRecord {
  id: string
  userId: string
  name: string
  domains: string[]
  status: string
  pages: number
  size: string
  lastCrawled: string
  progress: number
  depth: number
}

const users   = new Map<string, User>()
const indices = new Map<string, IndexRecord>()

export const store = { users, indices }
