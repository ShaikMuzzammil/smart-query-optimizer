import { NextRequest, NextResponse } from 'next/server'
import { getFile, deleteFile } from '../../../../lib/indexer'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const file = getFile(params.id)
  if (!file) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ file })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const deleted = deleteFile(params.id)
  if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
