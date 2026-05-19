'use client'
import { useState } from 'react'
import Link from 'next/link'

const SECTIONS = [
  {id:'start',l:'Quick Start',icon:'⚡',title:'Quick Start',body:'Upload a .txt file and get real analysis instantly.',
    subs:[{t:'1. Sign Up',d:'Create a free account at /auth/signup — no credit card needed.'},
      {t:'2. Upload File',d:'Go to Dashboard → Upload tab. Drag & drop any .txt file (up to 10MB).'},
      {t:'3. View Analysis',d:'Instantly see: query count, patterns, slow queries with fixes, top keywords.'},
      {t:'4. Search',d:'Use the Search tab or /search page to query across all uploaded files using BM25.'}]},
  {id:'upload',l:'File Upload',icon:'📤',title:'File Upload',body:'Upload any .txt file containing queries — one per line.',
    subs:[{t:'Supported Formats',d:'Any .txt file. Works best with SQL queries, search logs, API call logs, or any line-delimited text.'},
      {t:'File Limits',d:'Max 10MB per file. Thousands of queries processed in under a second.'},
      {t:'What Happens',d:'File is tokenized → inverted index built → 10 detection rules applied → categories assigned → keywords extracted.'}]},
  {id:'analysis',l:'Analysis Engine',icon:'🧠',title:'Analysis Engine',body:'10 real detection rules applied to every uploaded file.',
    subs:[
      {t:'Rule 1: SELECT *',d:'Detects full column scans. Fix: specify only needed columns.'},
      {t:'Rule 2: Leading LIKE %',d:'Detects LIKE \'%...\' preventing index use. Fix: full-text search.'},
      {t:'Rule 3: Missing WHERE',d:'Full table scans. Fix: add WHERE clause or LIMIT.'},
      {t:'Rule 4: Multiple OR',d:'Use IN() instead for better index performance.'},
      {t:'Rule 5: N+1 Queries',d:'Repeated patterns detected. Fix: batch with IN() or cache.'},
      {t:'Rule 6: ORDER BY no LIMIT',d:'Sorts full table. Fix: always add LIMIT.'},
      {t:'Rule 7: Stopword-heavy',d:'Queries dominated by stopwords. Fix: stem and strip stopwords.'},
      {t:'Rule 8: JOIN no index',d:'Missing index hint on JOIN columns. Fix: CREATE INDEX.'},
      {t:'Rule 9: Long queries',d:'>400 chars. Fix: refactor with CTEs.'},
      {t:'Rule 10: Boolean misuse',d:'AND/OR in short search queries. Fix: use quoted phrases.'}]},
  {id:'search',l:'BM25 Search',icon:'🔍',title:'BM25 Full-Text Search',body:'Real inverted index with BM25 scoring across all uploaded files.',
    subs:[{t:'How BM25 Works',d:'BM25 (Best Match 25) scores documents by term frequency and inverse document frequency. Parameters: k1=1.5, b=0.75.'},
      {t:'Search API',code:'GET /api/search?q=your+query+here\n// Returns: results[], total, latencyMs'},
      {t:'Result Fields',d:'Each result: fileId, fileName, score (BM25), matchCount (terms matched), excerpt with surrounding context.'}]},
  {id:'api',l:'API Reference',icon:'🔌',title:'API Reference',body:'All endpoints are REST-style. No authentication required for search.',
    subs:[
      {t:'Upload File',code:'POST /api/upload\nContent-Type: multipart/form-data\nBody: file (File, .txt)'},
      {t:'Get All Files',code:'GET /api/indices\n// Returns: files[] with full analysis'},
      {t:'Get Single File',code:'GET /api/indices/:id\n// Returns: file with rawContent and full analysis'},
      {t:'Delete File',code:'DELETE /api/indices/:id\n// Removes from index and store'},
      {t:'Search',code:'GET /api/search?q=query\n// Returns: BM25-ranked results[]'},
      {t:'Analytics',code:'GET /api/analytics\n// Returns: KPIs, categories, keywords, logs'}]}
]

export default function Docs() {
  const [active, setActive] = useState('start')
  const [search, setSearch] = useState('')
  const section = SECTIONS.find(s=>s.id===active)!
  const filtered = search ? SECTIONS.filter(s=>s.l.toLowerCase().includes(search.toLowerCase())) : SECTIONS
  const idx = SECTIONS.findIndex(s=>s.id===active)
  const prev = SECTIONS[idx-1], next = SECTIONS[idx+1]

  return (
    <div style={{display:'flex',minHeight:'100vh',paddingTop:0}}>
      {/* Sidebar */}
      <aside style={{width:220,flexShrink:0,position:'sticky',top:0,height:'100vh',overflowY:'auto',background:'rgba(5,11,24,0.9)',borderRight:'1px solid rgba(0,198,255,0.1)',display:'flex',flexDirection:'column'}}>
        <Link href="/" style={{display:'flex',alignItems:'center',gap:8,padding:'16px 14px',borderBottom:'1px solid rgba(0,198,255,0.1)',textDecoration:'none'}}>
          <div style={{width:26,height:26,borderRadius:6,background:'linear-gradient(135deg,#00C6FF,#7B2FBE)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/></svg>
          </div>
          <span style={{fontFamily:'Syne',fontWeight:700,color:'white',fontSize:14}}>SmartQuery</span>
        </Link>
        <div style={{padding:'10px 10px 4px'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} className="inp" style={{width:'100%',padding:'7px 10px',borderRadius:7,fontSize:12}} placeholder="Search docs…"/>
        </div>
        <nav style={{padding:'6px 8px',flex:1}}>
          <p style={{color:'#7A9CC0',fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:6,padding:'0 6px'}}>Docs</p>
          {filtered.map(s=>(
            <button key={s.id} onClick={()=>{setActive(s.id);setSearch('')}}
              className="sl" style={{fontFamily:'Outfit',fontSize:13,border:'none',background:'none'+(active===s.id?' rgba(0,198,255,0.12)':''),color:active===s.id?'#00C6FF':'#7A9CC0',borderLeft:active===s.id?'2px solid #00C6FF':'2px solid transparent',marginBottom:2}}>
              <span style={{fontSize:14}}>{s.icon}</span>
              <span>{s.l}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Content */}
      <div style={{flex:1,padding:'48px 48px 80px',maxWidth:800,animation:'pageIn 0.3s ease both'}} key={active}>
        <div className="badge bp" style={{marginBottom:14,fontSize:11}}>{section.icon} {section.l}</div>
        <h1 style={{fontFamily:'Syne',fontWeight:800,fontSize:'clamp(24px,3vw,40px)',color:'white',marginBottom:10}}>{section.title}</h1>
        <p style={{color:'#7A9CC0',fontSize:16,lineHeight:1.7,marginBottom:40,borderLeft:'2px solid rgba(0,198,255,0.3)',paddingLeft:16}}>{section.body}</p>

        <div style={{display:'flex',flexDirection:'column',gap:32}}>
          {section.subs.map((sub,i)=>(
            <div key={i}>
              <h2 style={{fontFamily:'Syne',fontWeight:700,fontSize:18,color:'white',marginBottom:10,display:'flex',alignItems:'center',gap:8}}>
                <span style={{width:24,height:24,borderRadius:6,background:'linear-gradient(135deg,rgba(0,198,255,0.2),rgba(123,47,190,0.2))',border:'1px solid rgba(0,198,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,color:'#00C6FF',fontFamily:'JetBrains Mono',flexShrink:0}}>{i+1}</span>
                {sub.t}
              </h2>
              {sub.d&&<p style={{color:'#7A9CC0',lineHeight:1.7,fontSize:14}}>{sub.d}</p>}
              {sub.code&&(
                <div className="term">
                  <div className="th"><div className="td" style={{background:'#ff5f56'}}/><div className="td" style={{background:'#ffbd2e'}}/><div className="td" style={{background:'#27c93f'}}/><span style={{color:'#7A9CC0',fontSize:11,marginLeft:8}}>code</span>
                    <button onClick={()=>navigator.clipboard.writeText(sub.code!)} style={{marginLeft:'auto',background:'none',border:'none',color:'#7A9CC0',fontSize:11}}>Copy</button>
                  </div>
                  <pre style={{padding:16,fontSize:12,lineHeight:1.6,margin:0,overflow:'auto'}}>{sub.code}</pre>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Prev/Next */}
        <div style={{display:'flex',justifyContent:'space-between',marginTop:64,paddingTop:24,borderTop:'1px solid rgba(0,198,255,0.1)'}}>
          {prev?<button onClick={()=>setActive(prev.id)} style={{background:'none',border:'none',color:'#7A9CC0',fontSize:14,display:'flex',alignItems:'center',gap:6}}>← {prev.l}</button>:<div/>}
          {next?<button onClick={()=>setActive(next.id)} style={{background:'none',border:'none',color:'#7A9CC0',fontSize:14,display:'flex',alignItems:'center',gap:6}}>{next.l} →</button>:<div/>}
        </div>
      </div>
    </div>
  )
}
