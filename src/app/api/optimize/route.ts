import { NextRequest, NextResponse } from 'next/server'
import { getAI, MODEL } from '@/lib/openai'
import { connectDB } from '@/lib/mongodb'
import { QueryLog } from '@/models/QueryLog'
import { rateLimit } from '@/lib/rateLimit'
export const maxDuration = 60
const TIPS: Record<string,string> = {
  speed:'minimize execution time; push predicates early; replace correlated subqueries with JOINs; add covering indexes',
  cost:'minimize I/O; select only needed columns; use EXISTS over IN; avoid SELECT *; add partial indexes',
  readability:'use CTEs instead of nested subqueries; meaningful aliases; consistent formatting',
  balanced:'balance speed/cost/readability with highest-ROI changes only',
}
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 'anon'
  const rl = rateLimit(`opt:${ip}`, 10, 60000)
  if (!rl.ok) return NextResponse.json({ error: `Rate limit. Retry in ${Math.ceil(rl.retryAfter/1000)}s` }, { status: 429 })
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const { query='', naturalLanguage='', dbType='postgresql', optimizationGoal='balanced', schema='', dbVersion='', options={} } = body
  const input = (query||naturalLanguage||'').trim()
  if (!input) return NextResponse.json({ error: 'query required' }, { status: 400 })
  if (input.length > 10000) return NextResponse.json({ error: 'Query too long (max 10000)' }, { status: 400 })
  const system = `You are an elite DB engineer for ${dbType}${dbVersion?' v'+dbVersion:''}.
Return ONLY valid JSON (no markdown fences):
{"optimizedQuery":"string","explanation":"markdown string","indexSuggestions":[{"sql":"string","reason":"string","impact":"high|medium|low"}],"metrics":{"estimatedImprovement":0,"beforeCost":0,"afterCost":0,"estimatedExecMs":0},"queryComplexity":"simple|moderate|complex|very_complex","warnings":["string"]}
Goal: ${optimizationGoal} — ${TIPS[optimizationGoal]||TIPS.balanced}`
  const user = `SQL:\n${input}${schema?'\nSchema:\n'+schema:''}${naturalLanguage?'\nIntent: '+naturalLanguage:''}`
  try {
    const ai = getAI()
    const r = await ai.chat.completions.create({ model: MODEL, temperature: options.temperature??0.2, max_tokens: 3000, messages:[{role:'system',content:system},{role:'user',content:user}], response_format:{type:'json_object'} })
    const raw = r.choices[0]?.message?.content||''
    let d: any
    try { d = JSON.parse(raw) } catch { const m = raw.match(/\{[\s\S]*\}/); d = m ? JSON.parse(m[0]) : {}  }
    const result = {
      originalQuery: input,
      optimizedQuery: String(d.optimizedQuery||input),
      explanation: String(d.explanation||''),
      indexSuggestions: (Array.isArray(d.indexSuggestions)?d.indexSuggestions:[]).filter((s:any)=>s?.sql).map((s:any)=>({ sql:String(s.sql), reason:String(s.reason||''), impact:['high','medium','low'].includes(s.impact)?s.impact:'medium' })),
      metrics: { estimatedImprovement:Math.max(0,Math.min(100,Number(d.metrics?.estimatedImprovement)||0)), beforeCost:Math.max(0,Number(d.metrics?.beforeCost)||0), afterCost:Math.max(0,Number(d.metrics?.afterCost)||0), estimatedExecMs:Math.max(0,Number(d.metrics?.estimatedExecMs)||0) },
      queryComplexity: ['simple','moderate','complex','very_complex'].includes(d.queryComplexity)?d.queryComplexity:'moderate',
      warnings: Array.isArray(d.warnings)?d.warnings.map(String):[],
      sessionId: Math.random().toString(36).slice(2),
      createdAt: new Date().toISOString(),
    }
    ;(async()=>{ try { const db=await connectDB(); if(db) await QueryLog.create({...result,dbType,optimizationGoal,schema}) } catch {} })()
    return NextResponse.json({ success: true, data: result })
  } catch(e:any) {
    const msg = e?.message||'AI error'
    if(msg.includes('API key')) return NextResponse.json({error:'OPENAI_API_KEY not configured'},{status:503})
    return NextResponse.json({error:msg},{status:502})
  }
}
