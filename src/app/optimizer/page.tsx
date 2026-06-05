'use client'
import { useState, useCallback } from 'react'
import Link from 'next/link'
import Navbar from '../../components/Navbar'
import Footer from '../../components/Footer'

type DbType = 'postgresql'|'mysql'|'sqlserver'|'sqlite'|'oracle'|'mongodb'|'cockroachdb'|'supabase'
type Goal   = 'speed'|'cost'|'readability'|'balanced'
type Step   = 1|2|3

const DBS: {id:DbType;label:string;icon:string}[] = [
  {id:'postgresql',label:'PostgreSQL',icon:'🐘'},{id:'mysql',label:'MySQL',icon:'🐬'},
  {id:'sqlserver',label:'SQL Server',icon:'🖥️'},{id:'sqlite',label:'SQLite',icon:'💎'},
  {id:'oracle',label:'Oracle',icon:'🔴'},{id:'mongodb',label:'MongoDB',icon:'🍃'},
  {id:'cockroachdb',label:'CockroachDB',icon:'🪳'},{id:'supabase',label:'Supabase',icon:'⚡'},
]
const GOALS: {id:Goal;label:string;icon:string;desc:string}[] = [
  {id:'speed',label:'Max Speed',icon:'⚡',desc:'Minimize execution time'},
  {id:'cost',label:'Reduce Cost',icon:'💰',desc:'Lower I/O & memory'},
  {id:'readability',label:'Clarity',icon:'📖',desc:'Improve maintainability'},
  {id:'balanced',label:'Balanced',icon:'⚖️',desc:'Speed + cost + clarity'},
]
const EXAMPLES = [
  { label:'N+1 Join', query:`SELECT o.id, o.total,\n  c.email,\n  (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS items\nFROM orders o\nJOIN customers c ON c.id = o.customer_id\nWHERE o.status = 'pending'\nORDER BY o.created_at DESC;`, db:'postgresql' as DbType },
  { label:'Missing Index', query:`SELECT p.id, p.name, p.price\nFROM products p\nJOIN categories c ON c.id = p.category_id\nWHERE p.is_active = 1\n  AND p.category_id = 42\n  AND p.price BETWEEN 10 AND 500\nORDER BY p.price ASC\nLIMIT 20;`, db:'mysql' as DbType },
  { label:'Deep Subquery', query:`SELECT u.id, u.username,\n  (SELECT COUNT(*) FROM posts p WHERE p.user_id = u.id AND p.published = true) AS posts,\n  (SELECT MAX(p2.created_at) FROM posts p2 WHERE p2.user_id = u.id) AS last_post\nFROM users u\nWHERE u.is_active = true\n  AND (SELECT COUNT(*) FROM posts p3 WHERE p3.user_id = u.id) > 0\nORDER BY posts DESC LIMIT 50;`, db:'postgresql' as DbType },
]
const PHASES = ['Parsing Query AST','Analyzing Execution Plan','Generating Optimizations','Building Index Suggestions']

function ImprovBadge({pct}:{pct:number}) {
  const c = pct>=70?'#00E676':pct>=40?'#00C6FF':'#7B2FBE'
  return <span style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'2rem',color:c}}>{pct}%</span>
}

export default function OptimizerPage() {
  const [step, setStep] = useState<Step>(1)
  const [query, setQuery] = useState('')
  const [dbType, setDb] = useState<DbType>('postgresql')
  const [goal, setGoal] = useState<Goal>('balanced')
  const [schema, setSchema] = useState('')
  const [showSchema, setShowSchema] = useState(false)
  const [temperature, setTemp] = useState(0.2)
  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState(0)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [activeTab, setTab] = useState<'diff'|'metrics'|'indexes'|'explain'>('diff')
  const [copied, setCopied] = useState(false)

  const MIN_MS = 4000
  const phaseMs = [800,1200,1400,600]

  const runOptimize = useCallback(async () => {
    if (!query.trim()) { setError('Please enter a SQL query.'); return }
    setError(''); setLoading(true); setPhase(0); setResult(null); setStep(3)
    const start = Date.now()
    let p = 0
    const tick = () => { if (p < PHASES.length-1) { p++; setPhase(p); setTimeout(tick, phaseMs[p]) } }
    setTimeout(tick, phaseMs[0])
    try {
      const res = await fetch('/api/optimize', { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ query, dbType, optimizationGoal: goal, schema, options:{ temperature } }) })
      const elapsed = Date.now()-start
      if (elapsed < MIN_MS) await new Promise(r=>setTimeout(r, MIN_MS-elapsed))
      const json = await res.json()
      if (!res.ok) throw new Error(json.error||'Optimization failed')
      setResult(json.data)
    } catch(e:any) { setError(e.message||'Something went wrong') }
    finally { setLoading(false) }
  }, [query, dbType, goal, schema, temperature])

  const reset = () => { setStep(1); setResult(null); setError(''); setPhase(0) }
  const copy = () => {
    if (result) { navigator.clipboard.writeText(result.optimizedQuery); setCopied(true); setTimeout(()=>setCopied(false),2000) }
  }
  const download = () => {
    if (!result) return
    const txt = `-- Smart Query Optimizer\n-- ${new Date().toISOString()}\n-- Improvement: ${result.metrics.estimatedImprovement}%\n\n-- ORIGINAL\n${result.originalQuery}\n\n-- OPTIMIZED\n${result.optimizedQuery}\n\n-- INDEXES\n${result.indexSuggestions.map((s:any)=>s.sql).join('\n')}`
    const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([txt],{type:'text/plain'})); a.download=`optimized-${Date.now()}.sql`; a.click()
  }

  return (
    <>
      <Navbar />
      <main style={{minHeight:'100vh',paddingTop:90,paddingBottom:80}}>
        <div style={{maxWidth:860,margin:'0 auto',padding:'0 20px'}}>

          {/* Header */}
          <div style={{textAlign:'center',marginBottom:40}}>
            <div style={{display:'inline-flex',alignItems:'center',gap:8,background:'rgba(0,198,255,0.08)',border:'1px solid rgba(0,198,255,0.2)',borderRadius:100,padding:'5px 16px',fontSize:12,color:'#00C6FF',letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:16}}>
              <span style={{width:7,height:7,borderRadius:'50%',background:'#00C6FF',display:'inline-block',boxShadow:'0 0 8px #00C6FF'}} />
              AI-Powered · Live
            </div>
            <h1 style={{fontSize:'clamp(1.8rem,4vw,2.8rem)',fontFamily:'Syne,sans-serif',fontWeight:800,marginBottom:10}}>
              Smart <span className="gtext">Query Optimizer</span>
            </h1>
            <p style={{color:'#7A9CC0',fontSize:16}}>GPT-4o powered SQL analysis — indexes, cost estimates, and diffs in seconds.</p>
          </div>

          {/* Step indicator */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:0,marginBottom:40}}>
            {[{n:1,l:'Configure'},{n:2,l:'Confirm'},{n:3,l:'Results'}].map(({n,l},i)=>(
              <div key={n} style={{display:'flex',alignItems:'center'}}>
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                  <div style={{width:36,height:36,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,
                    background: step>n?'#00E676':step===n?'linear-gradient(135deg,#00C6FF,#7B2FBE)':'rgba(255,255,255,0.06)',
                    color: step>n?'#000':step===n?'#fff':'#445566',
                    boxShadow: step===n?'0 0 20px rgba(0,198,255,0.4)':'none',
                    transition:'all 0.4s'}}>
                    {step>n?'✓':n}
                  </div>
                  <span style={{fontSize:11,color:step===n?'#00C6FF':step>n?'#00E676':'#445566',fontWeight:600}}>{l}</span>
                </div>
                {i<2&&<div style={{width:60,height:2,margin:'0 4px',marginTop:-16,background:step>n?'linear-gradient(90deg,#00C6FF,#7B2FBE)':'rgba(255,255,255,0.06)',transition:'all 0.5s'}} />}
              </div>
            ))}
          </div>

          {/* Card */}
          <div className="glass" style={{borderRadius:16,overflow:'hidden'}}>
            <div style={{height:2,background:'linear-gradient(90deg,transparent,rgba(0,198,255,0.4),transparent)'}} />
            <div style={{padding:'32px 36px'}}>

              {/* ── STEP 1 ── */}
              {step===1 && (
                <div style={{display:'flex',flexDirection:'column',gap:24}}>
                  <div>
                    <h2 style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:'1.3rem',marginBottom:4}}>Configure Query</h2>
                    <p style={{color:'#7A9CC0',fontSize:14}}>Enter your SQL, select database and goal.</p>
                  </div>

                  {/* Example loader */}
                  <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                    {EXAMPLES.map(ex=>(
                      <button key={ex.label} onClick={()=>{setQuery(ex.query);setDb(ex.db)}}
                        style={{padding:'5px 12px',borderRadius:8,border:'1px solid rgba(0,198,255,0.2)',background:'rgba(0,198,255,0.06)',color:'#00C6FF',fontSize:12,fontWeight:600,cursor:'pointer',transition:'all 0.2s'}}
                        onMouseEnter={e=>(e.currentTarget.style.background='rgba(0,198,255,0.14)')}
                        onMouseLeave={e=>(e.currentTarget.style.background='rgba(0,198,255,0.06)')}>
                        📄 {ex.label}
                      </button>
                    ))}
                  </div>

                  {/* Query textarea */}
                  <div>
                    <label style={{display:'block',fontSize:13,fontWeight:600,color:'#E8F4FD',marginBottom:8}}>
                      SQL Query <span style={{color:'#FF1744'}}>*</span>
                    </label>
                    <textarea value={query} onChange={e=>setQuery(e.target.value)} rows={8}
                      style={{width:'100%',background:'#0A0F1E',border:'1px solid rgba(0,198,255,0.2)',borderRadius:10,padding:14,fontFamily:"'JetBrains Mono',monospace",fontSize:13,color:'#E8F4FD',resize:'vertical',outline:'none',lineHeight:1.7,boxSizing:'border-box'}}
                      placeholder="SELECT o.id, c.email&#10;FROM orders o&#10;JOIN customers c ON c.id = o.customer_id&#10;WHERE o.status = 'pending';"
                      onFocus={e=>(e.target.style.borderColor='#00C6FF')}
                      onBlur={e=>(e.target.style.borderColor='rgba(0,198,255,0.2)')} />
                    {query && <div style={{fontSize:11,color:'#445566',marginTop:4}}>{query.length} chars · {query.split('\n').length} lines</div>}
                  </div>

                  {/* DB grid */}
                  <div>
                    <label style={{display:'block',fontSize:13,fontWeight:600,color:'#E8F4FD',marginBottom:8}}>Database Engine</label>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
                      {DBS.map(db=>(
                        <button key={db.id} onClick={()=>setDb(db.id)}
                          style={{padding:'10px 8px',borderRadius:10,border:`1px solid ${dbType===db.id?'rgba(0,198,255,0.5)':'rgba(255,255,255,0.06)'}`,background:dbType===db.id?'rgba(0,198,255,0.12)':'rgba(255,255,255,0.02)',color:dbType===db.id?'#00C6FF':'#7A9CC0',fontSize:12,fontWeight:600,cursor:'pointer',transition:'all 0.2s',display:'flex',alignItems:'center',gap:6}}>
                          <span style={{fontSize:16}}>{db.icon}</span>{db.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Goal */}
                  <div>
                    <label style={{display:'block',fontSize:13,fontWeight:600,color:'#E8F4FD',marginBottom:8}}>Optimization Goal</label>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:10}}>
                      {GOALS.map(g=>(
                        <button key={g.id} onClick={()=>setGoal(g.id)}
                          style={{padding:'12px 16px',borderRadius:10,border:`1px solid ${goal===g.id?'rgba(0,198,255,0.45)':'rgba(255,255,255,0.06)'}`,background:goal===g.id?'rgba(0,198,255,0.1)':'rgba(255,255,255,0.02)',cursor:'pointer',transition:'all 0.2s',textAlign:'left'}}>
                          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2}}>
                            <span style={{fontSize:16}}>{g.icon}</span>
                            <span style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:13,color:goal===g.id?'#00C6FF':'#E8F4FD'}}>{g.label}</span>
                          </div>
                          <div style={{color:'#7A9CC0',fontSize:11,paddingLeft:24}}>{g.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Schema toggle */}
                  <div>
                    <button onClick={()=>setShowSchema(v=>!v)} style={{background:'none',border:'none',color:'#7A9CC0',fontSize:13,cursor:'pointer',display:'flex',alignItems:'center',gap:6}}>
                      <span style={{transition:'transform 0.2s',display:'inline-block',transform:showSchema?'rotate(90deg)':'none'}}>›</span>
                      Schema context <span style={{color:'#445566'}}>(optional — improves accuracy)</span>
                    </button>
                    {showSchema && (
                      <textarea value={schema} onChange={e=>setSchema(e.target.value)} rows={4}
                        style={{width:'100%',marginTop:10,background:'#0A0F1E',border:'1px solid rgba(0,198,255,0.15)',borderRadius:10,padding:12,fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:'#7A9CC0',resize:'vertical',outline:'none',lineHeight:1.6,boxSizing:'border-box'}}
                        placeholder="CREATE TABLE orders (id BIGSERIAL PRIMARY KEY, customer_id BIGINT, ...);" />
                    )}
                  </div>

                  {error && <div style={{color:'#FF1744',fontSize:13,padding:'10px 14px',background:'rgba(255,23,68,0.08)',borderRadius:8,border:'1px solid rgba(255,23,68,0.2)'}}>⚠ {error}</div>}

                  <button onClick={()=>{ if(!query.trim()){setError('Please enter a SQL query.');return} setError('');setStep(2) }}
                    className="btn-p" style={{width:'100%',padding:'14px',borderRadius:10,fontSize:15,fontWeight:700,border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                    <span>Continue →</span>
                  </button>
                </div>
              )}

              {/* ── STEP 2 ── */}
              {step===2 && (
                <div style={{display:'flex',flexDirection:'column',gap:24}}>
                  <div>
                    <h2 style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:'1.3rem',marginBottom:4}}>Confirm & Launch</h2>
                    <p style={{color:'#7A9CC0',fontSize:14}}>Review your settings, then launch.</p>
                  </div>

                  <div style={{background:'#0A0F1E',borderRadius:10,border:'1px solid rgba(0,198,255,0.12)',padding:14,fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:'#7A9CC0',lineHeight:1.7,maxHeight:140,overflow:'auto'}}>
                    {query.slice(0,400)}{query.length>400?'…':''}
                  </div>

                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                    {[{l:'Database',v:DBS.find(d=>d.id===dbType)?.icon+' '+DBS.find(d=>d.id===dbType)?.label},{l:'Goal',v:GOALS.find(g=>g.id===goal)?.icon+' '+GOALS.find(g=>g.id===goal)?.label},{l:'Schema',v:schema?'✅ Provided':'Not provided'},{l:'AI Mode',v:'GPT-4o'}].map(({l,v})=>(
                      <div key={l} style={{background:'rgba(0,198,255,0.04)',border:'1px solid rgba(0,198,255,0.1)',borderRadius:10,padding:'14px 16px'}}>
                        <div style={{fontSize:10,color:'#445566',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:4}}>{l}</div>
                        <div style={{fontWeight:600,fontSize:14}}>{v}</div>
                      </div>
                    ))}
                  </div>

                  {/* Temperature */}
                  <div style={{background:'rgba(0,198,255,0.03)',border:'1px solid rgba(0,198,255,0.1)',borderRadius:10,padding:16}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                      <div><div style={{fontWeight:600,fontSize:14}}>AI Creativity</div><div style={{color:'#7A9CC0',fontSize:12}}>Lower = conservative, Higher = creative rewrites</div></div>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontFamily:'Syne,sans-serif',fontWeight:800,fontSize:'1.2rem',color:'#00C6FF'}}>{temperature.toFixed(1)}</div>
                        <div style={{fontSize:10,color:'#445566'}}>{temperature<=0.2?'Conservative':temperature<=0.5?'Balanced':'Creative'}</div>
                      </div>
                    </div>
                    <input type="range" min="0" max="1" step="0.1" value={temperature} onChange={e=>setTemp(parseFloat(e.target.value))}
                      style={{width:'100%',accentColor:'#00C6FF'}} />
                  </div>

                  <div style={{display:'flex',gap:12}}>
                    <button onClick={()=>setStep(1)} className="btn-o" style={{flex:1,padding:'13px',borderRadius:10,fontSize:14,cursor:'pointer'}}>← Back</button>
                    <button onClick={runOptimize} className="btn-p" style={{flex:2,padding:'13px',borderRadius:10,fontSize:14,fontWeight:700,border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                      <span>🚀 Launch Optimizer</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 3: Loading ── */}
              {step===3 && loading && (
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',padding:'40px 0',gap:24}}>
                  {/* Orb */}
                  <div style={{position:'relative',width:120,height:120,display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <div style={{position:'absolute',inset:0,borderRadius:'50%',border:'1px solid rgba(0,198,255,0.2)',animation:'spin 4s linear infinite'}} />
                    <div style={{position:'absolute',inset:8,borderRadius:'50%',border:'1px solid rgba(123,47,190,0.3)',animation:'spin 6s linear infinite reverse'}} />
                    <div style={{width:70,height:70,borderRadius:'50%',background:'radial-gradient(circle at 35% 35%,#00C6FF,#7B2FBE)',boxShadow:'0 0 40px rgba(0,198,255,0.6),0 0 80px rgba(0,198,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28,animation:'pulse 2s ease-in-out infinite'}}>
                      ⚡
                    </div>
                  </div>
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}`}</style>

                  <div style={{textAlign:'center'}}>
                    <div style={{fontSize:'1.1rem',fontFamily:'Syne,sans-serif',fontWeight:700,color:'#00C6FF',marginBottom:4}}>{PHASES[phase]}</div>
                    <div style={{color:'#7A9CC0',fontSize:13}}>AI analysis in progress…</div>
                  </div>

                  {/* Phase dots */}
                  <div style={{display:'flex',gap:16}}>
                    {PHASES.map((p,i)=>(
                      <div key={p} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4}}>
                        <div style={{width:32,height:32,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,background:i<phase?'#00E676':i===phase?'linear-gradient(135deg,#00C6FF,#7B2FBE)':'rgba(255,255,255,0.06)',transition:'all 0.5s',boxShadow:i===phase?'0 0 14px rgba(0,198,255,0.5)':'none'}}>
                          {i<phase?'✓':['🔬','📊','⚡','🗂️'][i]}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Progress bar */}
                  <div style={{width:320,background:'rgba(255,255,255,0.06)',borderRadius:100,height:4,overflow:'hidden'}}>
                    <div className="pfill" style={{width:`${[15,40,75,95][phase]}%`,height:'100%'}} />
                  </div>
                </div>
              )}

              {/* ── STEP 3: Error ── */}
              {step===3 && !loading && error && (
                <div style={{textAlign:'center',padding:'40px 0'}}>
                  <div style={{fontSize:48,marginBottom:16}}>⚠️</div>
                  <h3 style={{fontFamily:'Syne,sans-serif',fontWeight:700,marginBottom:12}}>Optimization Failed</h3>
                  <p style={{color:'#7A9CC0',fontSize:14,marginBottom:24}}>{error}</p>
                  <div style={{display:'flex',gap:12,justifyContent:'center'}}>
                    <button onClick={()=>setStep(2)} className="btn-o" style={{padding:'11px 28px',borderRadius:10,fontSize:14,cursor:'pointer'}}>Try Again</button>
                    <button onClick={reset} className="btn-p" style={{padding:'11px 28px',borderRadius:10,fontSize:14,border:'none',cursor:'pointer'}}>Start Over</button>
                  </div>
                </div>
              )}

              {/* ── STEP 3: Result ── */}
              {step===3 && !loading && result && !error && (
                <div>
                  {/* Success banner */}
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,padding:'16px 20px',background:'rgba(0,198,255,0.06)',border:'1px solid rgba(0,198,255,0.2)',borderRadius:12,marginBottom:24,flexWrap:'wrap'}}>
                    <div style={{display:'flex',alignItems:'center',gap:16}}>
                      <div style={{width:60,height:60,borderRadius:12,background:'linear-gradient(135deg,#00C6FF,#7B2FBE)',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',flexShrink:0}}>
                        <ImprovBadge pct={result.metrics.estimatedImprovement} />
                      </div>
                      <div>
                        <div style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:'1rem'}}>Optimization Complete!</div>
                        <div style={{color:'#7A9CC0',fontSize:13}}>{result.metrics.estimatedImprovement}% estimated improvement · {result.queryComplexity} query</div>
                      </div>
                    </div>
                    <div style={{display:'flex',gap:8}}>
                      <button onClick={copy} style={{padding:'8px 14px',borderRadius:8,border:'1px solid rgba(0,198,255,0.25)',background:'rgba(0,198,255,0.08)',color:'#00C6FF',fontSize:12,cursor:'pointer',fontWeight:600}}>
                        {copied?'✓ Copied':'📋 Copy SQL'}
                      </button>
                      <button onClick={download} style={{padding:'8px 14px',borderRadius:8,border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.04)',color:'#7A9CC0',fontSize:12,cursor:'pointer'}}>⬇ .sql</button>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div style={{display:'flex',gap:4,marginBottom:20,overflowX:'auto'}}>
                    {(['diff','metrics','indexes','explain'] as const).map(t=>(
                      <button key={t} onClick={()=>setTab(t)}
                        style={{padding:'8px 18px',borderRadius:8,border:`1px solid ${activeTab===t?'rgba(0,198,255,0.3)':'rgba(255,255,255,0.06)'}`,background:activeTab===t?'rgba(0,198,255,0.1)':'transparent',color:activeTab===t?'#00C6FF':'#7A9CC0',fontSize:13,fontWeight:600,cursor:'pointer',whiteSpace:'nowrap',transition:'all 0.2s'}}>
                        {t==='diff'?'🔀 Diff':t==='metrics'?'📊 Metrics':t==='indexes'?`🗂️ Indexes${result.indexSuggestions?.length?' ('+result.indexSuggestions.length+')':''}`:t==='explain'?'📖 Explanation':''}
                      </button>
                    ))}
                  </div>

                  {/* Diff tab */}
                  {activeTab==='diff' && (
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                      {[{label:'Before',color:'#FF1744',code:result.originalQuery},{label:'After',color:'#00E676',code:result.optimizedQuery}].map(({label,color,code})=>(
                        <div key={label}>
                          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                            <span style={{width:8,height:8,borderRadius:'50%',background:color,display:'inline-block'}} />
                            <span style={{fontSize:11,fontWeight:700,color,textTransform:'uppercase',letterSpacing:'0.08em'}}>{label}</span>
                          </div>
                          <div style={{background:'#0A0F1E',border:`1px solid ${color}22`,borderRadius:10,padding:14,fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:'#C8D8E8',lineHeight:1.8,overflow:'auto',maxHeight:260,whiteSpace:'pre'}}>
                            {code}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Metrics tab */}
                  {activeTab==='metrics' && (
                    <div>
                      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:16}}>
                        {[
                          {l:'Improvement',v:`${result.metrics.estimatedImprovement}%`,c:'#00E676'},
                          {l:'Cost After',v:`${result.metrics.afterCost.toLocaleString()}`,sub:`was ${result.metrics.beforeCost.toLocaleString()}`,c:'#00C6FF'},
                          {l:'Est. Time',v:result.metrics.estimatedExecMs>=1000?`${(result.metrics.estimatedExecMs/1000).toFixed(2)}s`:`${result.metrics.estimatedExecMs}ms`,c:'#7B2FBE'},
                        ].map(m=>(
                          <div key={m.l} style={{background:'rgba(0,198,255,0.04)',border:'1px solid rgba(0,198,255,0.1)',borderRadius:12,padding:'16px',textAlign:'center'}}>
                            <div style={{fontSize:10,color:'#445566',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:6}}>{m.l}</div>
                            <div style={{fontSize:'1.8rem',fontFamily:'Syne,sans-serif',fontWeight:800,color:m.c}}>{m.v}</div>
                            {m.sub && <div style={{fontSize:11,color:'#445566',marginTop:2}}>{m.sub}</div>}
                            <div style={{height:3,background:'rgba(255,255,255,0.06)',borderRadius:100,marginTop:10,overflow:'hidden'}}>
                              <div style={{height:'100%',background:m.c,borderRadius:100,width:`${m.l==='Improvement'?result.metrics.estimatedImprovement:50}%`,transition:'width 1s'}} />
                            </div>
                          </div>
                        ))}
                      </div>
                      {result.warnings?.length>0 && (
                        <div style={{padding:'14px 16px',background:'rgba(255,107,53,0.06)',border:'1px solid rgba(255,107,53,0.2)',borderRadius:10}}>
                          <div style={{color:'#FF6B35',fontWeight:600,fontSize:13,marginBottom:8}}>⚠ Warnings</div>
                          {result.warnings.map((w:string,i:number)=><div key={i} style={{color:'#C8D8E8',fontSize:13,marginBottom:4}}>• {w}</div>)}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Indexes tab */}
                  {activeTab==='indexes' && (
                    <div style={{display:'flex',flexDirection:'column',gap:12}}>
                      {!result.indexSuggestions?.length ? (
                        <div style={{textAlign:'center',padding:'32px 0',color:'#445566'}}><div style={{fontSize:32,marginBottom:8}}>✅</div>No additional indexes needed.</div>
                      ) : result.indexSuggestions.map((s:any,i:number)=>(
                        <div key={i} style={{background:'rgba(0,198,255,0.04)',border:'1px solid rgba(0,198,255,0.12)',borderRadius:12,padding:16}}>
                          <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                            <span style={{padding:'2px 10px',borderRadius:100,fontSize:10,fontWeight:700,background:s.impact==='high'?'rgba(0,230,118,0.15)':s.impact==='medium'?'rgba(0,198,255,0.15)':'rgba(123,47,190,0.15)',color:s.impact==='high'?'#00E676':s.impact==='medium'?'#00C6FF':'#7B2FBE',textTransform:'uppercase',letterSpacing:'0.06em'}}>
                              {s.impact} impact
                            </span>
                          </div>
                          <pre style={{background:'#050B18',border:'1px solid rgba(0,198,255,0.1)',borderRadius:8,padding:'10px 12px',fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:'#00C6FF',overflow:'auto',marginBottom:10,whiteSpace:'pre-wrap'}}>{s.sql}</pre>
                          <p style={{color:'#7A9CC0',fontSize:13}}>{s.reason}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Explanation tab */}
                  {activeTab==='explain' && (
                    <div style={{background:'#0A0F1E',border:'1px solid rgba(0,198,255,0.1)',borderRadius:12,padding:24,color:'#C8D8E8',fontSize:14,lineHeight:1.8,whiteSpace:'pre-wrap'}}>
                      {result.explanation}
                    </div>
                  )}

                  <button onClick={reset} className="btn-o" style={{width:'100%',marginTop:24,padding:'12px',borderRadius:10,fontSize:14,cursor:'pointer'}}>
                    ↺ Optimize Another Query
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
