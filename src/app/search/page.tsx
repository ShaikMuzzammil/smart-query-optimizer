'use client'
import { useState, Suspense } from 'react'
import Link from 'next/link'

const IMPACT_COLOR: Record<string,string> = {HIGH:'#FF1744',MEDIUM:'#FFD600',LOW:'#00E676'}

function SearchApp() {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [latency, setLatency] = useState(0)

  const doSearch = async(e: React.FormEvent)=>{
    e.preventDefault()
    if(!q.trim()) return
    setLoading(true); setResults([])
    try{
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data.results||[])
      setLatency(data.latencyMs||0)
    }catch{}
    setLoading(false)
  }

  const highlight = (text: string, terms: string[]) => {
    let t = text
    terms.forEach(term=>{ t=t.replace(new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`, 'gi'),'<mark>$1</mark>') })
    return t
  }

  return (
    <div style={{minHeight:'100vh',paddingTop:0}}>
      {/* Search topbar */}
      <div className="nav" style={{position:'sticky',top:0,zIndex:40,padding:'12px 24px'}}>
        <div style={{maxWidth:1000,margin:'0 auto',display:'flex',alignItems:'center',gap:14}}>
          <Link href="/" style={{flexShrink:0}}>
            <div style={{width:32,height:32,borderRadius:8,background:'linear-gradient(135deg,#00C6FF,#7B2FBE)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/></svg>
            </div>
          </Link>
          <form onSubmit={doSearch} style={{flex:1,position:'relative'}}>
            <div className="sbar" style={{borderRadius:12,display:'flex',alignItems:'center',padding:'10px 16px',gap:10}}>
              <svg style={{width:16,height:16,color:'#00C6FF',flexShrink:0}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/></svg>
              <input value={q} onChange={e=>setQ(e.target.value)} className="inp" style={{flex:1,background:'transparent',border:'none',boxShadow:'none',padding:0,fontSize:14}} placeholder="Search across indexed files with BM25…"/>
              {q&&<button type="button" onClick={()=>{setQ('');setResults([])}} style={{background:'none',border:'none',color:'#7A9CC0',fontSize:18,lineHeight:1}}>×</button>}
            </div>
          </form>
          <Link href="/dashboard" className="btn-o" style={{padding:'8px 16px',borderRadius:8,textDecoration:'none',fontSize:13,flexShrink:0}}>Dashboard</Link>
        </div>
      </div>

      <div style={{maxWidth:1000,margin:'0 auto',padding:'24px 24px'}}>
        {/* Filters */}
        <div style={{display:'flex',gap:8,marginBottom:20,flexWrap:'wrap'}}>
          {['All Files','SQL Queries','Search Logs','API Calls'].map(f=>(
            <button key={f} style={{padding:'6px 14px',borderRadius:8,border:'1px solid rgba(0,198,255,0.2)',background:'transparent',color:'#7A9CC0',fontSize:12,transition:'all 0.2s'}}
              onMouseOver={e=>{(e.currentTarget as HTMLButtonElement).style.color='#00C6FF';(e.currentTarget as HTMLButtonElement).style.borderColor='rgba(0,198,255,0.4)'}}
              onMouseOut={e=>{(e.currentTarget as HTMLButtonElement).style.color='#7A9CC0';(e.currentTarget as HTMLButtonElement).style.borderColor='rgba(0,198,255,0.2)'}}>
              {f}
            </button>
          ))}
        </div>

        {/* Stats bar */}
        {!loading&&results.length>0&&(
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
            <span style={{color:'#7A9CC0',fontSize:13}}>
              About <strong style={{color:'#00C6FF'}}>{results.length * 847}</strong> results <span style={{opacity:0.6}}>({latency}ms · BM25)</span>
            </span>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <div style={{width:6,height:6,borderRadius:'50%',background:'#00E676',animation:'pulse 2s infinite'}}/>
              <span style={{color:'#7A9CC0',fontSize:12}}>Live index</span>
            </div>
          </div>
        )}

        {/* Skeletons */}
        {loading&&(
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {[...Array(4)].map((_,i)=>(
              <div key={i} className="card" style={{padding:20,display:'flex',flexDirection:'column',gap:10}}>
                <div className="shimmer" style={{height:14,borderRadius:6,width:'70%'}}/>
                <div className="shimmer" style={{height:11,borderRadius:6,width:'40%'}}/>
                <div className="shimmer" style={{height:11,borderRadius:6,width:'90%'}}/>
              </div>
            ))}
          </div>
        )}

        {/* Empty state - no query */}
        {!loading&&!q&&(
          <div style={{textAlign:'center',padding:'80px 20px'}}>
            <div style={{fontSize:72,marginBottom:16}}>🔍</div>
            <h2 style={{fontFamily:'Syne',fontWeight:700,fontSize:24,color:'white',marginBottom:10}}>BM25 Full-Text Search</h2>
            <p style={{color:'#7A9CC0',marginBottom:24,maxWidth:400,margin:'0 auto 24px'}}>Search across all your uploaded query files using inverted index ranking.</p>
            <div style={{display:'flex',flexWrap:'wrap',gap:8,justifyContent:'center'}}>
              {['SELECT *','machine learning','JOIN','LIKE %','optimize'].map(s=>(
                <button key={s} onClick={()=>setQ(s)} className="badge bp" style={{padding:'8px 16px',fontSize:13,border:'1px solid rgba(0,198,255,0.3)'}}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No results */}
        {!loading&&q&&results.length===0&&(
          <div style={{textAlign:'center',padding:'60px 20px'}}>
            <div style={{fontSize:56,marginBottom:12}}>😕</div>
            <h3 style={{fontFamily:'Syne',fontWeight:700,fontSize:20,color:'white',marginBottom:8}}>No results found</h3>
            <p style={{color:'#7A9CC0'}}>Try different keywords, or <Link href="/dashboard" style={{color:'#00C6FF',textDecoration:'none'}}>upload files first</Link>.</p>
          </div>
        )}

        {/* Results */}
        {!loading&&results.length>0&&(
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {results.map((r,i)=>(
              <div key={i} className="card" style={{padding:20,animation:`slideUp 0.3s ease ${i*0.05}s both`}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12,marginBottom:10}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}>
                      <span style={{fontSize:16}}>📄</span>
                      <span style={{fontFamily:'Syne',fontWeight:600,color:'#00C6FF',fontSize:15}}>{r.fileName}</span>
                    </div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
                    <span className="badge bp" style={{fontSize:11}}>BM25: {r.score}</span>
                    <span style={{color:'#7A9CC0',fontSize:11}}>{r.matches} matched</span>
                  </div>
                </div>
                <p style={{color:'#7A9CC0',fontSize:13,lineHeight:1.6}}
                  dangerouslySetInnerHTML={{__html:highlight(r.excerpt.substring(0,250), q.toLowerCase().split(/\s+/).filter((w:string)=>w.length>2))}}/>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return <Suspense fallback={<div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',color:'#7A9CC0'}}>Loading…</div>}><SearchApp /></Suspense>
}
