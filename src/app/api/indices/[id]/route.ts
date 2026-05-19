import { NextRequest, NextResponse } from 'next/server'
import { store } from '../../../../lib/store'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const f = store.queryFiles.get(params.id)
  if (!f) return NextResponse.json({error:'Not found'},{status:404})
  return NextResponse.json({ file: f })
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const f = store.queryFiles.get(params.id)
  if (!f) return NextResponse.json({error:'Not found'},{status:404})
  // Remove from inverted index
  f.rawContent.toLowerCase().replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter((w:string)=>w.length>2).forEach((word:string)=>{
    const p = store.invertedIndex.get(word)
    if (p) { p.delete(params.id); if(p.size===0) store.invertedIndex.delete(word) }
  })
  store.queryFiles.delete(params.id)
  return NextResponse.json({ok:true})
}
