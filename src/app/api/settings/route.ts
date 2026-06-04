import { NextRequest, NextResponse } from 'next/server'
const store2 = new Map<string,string>()
export async function POST(req: NextRequest) {
  const body = await req.json()
  Object.entries(body).forEach(([k,v])=>store2.set(k,String(v)))
  return NextResponse.json({ok:true})
}
export async function GET() {
  const s: Record<string,string> = {}
  store2.forEach((v,k)=>{ s[k]=['resendKey','jwtSecret'].includes(k)?'••••••••':v })
  return NextResponse.json({settings:s})
}
