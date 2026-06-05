import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '../../../lib/mongodb'
import { QueryLog } from '../../../models/QueryLog'

export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams
  const page = Math.max(1, parseInt(sp.get('page')||'1'))
  const limit = Math.min(20, parseInt(sp.get('limit')||'12'))
  try {
    const db = await connectDB()
    if (!db) return NextResponse.json({ success: true, data: { items: [], total: 0, page, pages: 0 } })
    const filter: any = {}
    if (sp.get('dbType')) filter.dbType = sp.get('dbType')
    const [items, total] = await Promise.all([
      QueryLog.find(filter).sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit).select('-explanation -schema').lean(),
      QueryLog.countDocuments(filter)
    ])
    return NextResponse.json({ success: true, data: { items, total, page, pages: Math.ceil(total/limit) } })
  } catch { return NextResponse.json({ success: false, error: 'DB error' }, { status: 500 }) }
}
export async function DELETE(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  try {
    const db = await connectDB()
    if (db) await QueryLog.findByIdAndDelete(id)
    return NextResponse.json({ success: true })
  } catch { return NextResponse.json({ error: 'failed' }, { status: 500 }) }
}
