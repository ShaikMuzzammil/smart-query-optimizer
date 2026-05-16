import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '../../../lib/auth'
import { store } from '../../../lib/db'

function getUserId(req: NextRequest): string | null {
  const token = req.cookies.get('sq_token')?.value
  if (!token) return null
  const payload = verifyToken(token)
  return payload?.userId || null
}

export async function GET(req: NextRequest) {
  const userId = getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const userIndices = Array.from(store.indices.values()).filter(i => i.userId === userId)
  return NextResponse.json({ indices: userIndices })
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { name, domains, depth } = await req.json()
  if (!name?.trim() || !domains?.length) return NextResponse.json({ error: 'Name and domains are required.' }, { status: 400 })
  const id = 'idx_' + Date.now()
  const record = { id, userId, name: name.trim(), domains: Array.isArray(domains) ? domains : [domains], status: 'IDLE', pages: 0, size: '0 MB', lastCrawled: 'Never', progress: 0, depth: depth || 3 }
  store.indices.set(id, record)
  return NextResponse.json({ index: record }, { status: 201 })
}
