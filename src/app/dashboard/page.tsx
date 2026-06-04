'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const IMPACT_COLOR: Record<string,string> = {HIGH:'#FF1744',MEDIUM:'#FFD600',LOW:'#00E676'}
const IMPACT_BG: Record<string,string> = {HIGH:'rgba(255,23,68,0.1)',MEDIUM:'rgba(255,214,0,0.1)',LOW:'rgba(0,230,118,0.1)'}
const NAV = [{id:'overview',l:'Overview',icon:'📊'},{id:'upload',l:'Upload',icon:'📤'},{id:'files',l:'My Files',icon:'📁'},{id:'search',l:'Search',icon:'🔍'},{id:'analytics',l:'Analytics',icon:'📈'},{id:'settings',l:'Settings',icon:'⚙️'}]

function fmt(n: number) { return n>=1000000?(n/1000000).toFixed(1)+'M':n>=1000?(n/1000).toFixed(1)+'k':n.toString() }
function fmtDate(iso: string) { 
  const d = new Date(iso)
  const diff = Date.now()-d.getTime()
  if(diff<60000) return 'just now'
  if(diff<3600000) return Math.round(diff/60000)+'m ago'
  if(diff<86400000) return Math.round(diff/3600000)+'h ago'
  return d.toLocaleDateString('en-IN',{day:'2-digit',month:'short'})
}

export default function Dashboard() {
  const router = useRouter()
  const [tab, setTab] = useState('overview')
  const [user, setUser] = useState<any>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [files, setFiles] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [expanded, setExpanded] = useState<any>(null)
  const [searchQ, setSearchQ] = useState('')
  const [searchRes, setSearchRes] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [searchLatency, setSearchLatency] = useState(0)
  const [toast, setToast] = useState<{msg:string;type:'ok'|'err'}|null>(null)
  const [settings, setSettings] = useState({resendKey:'',adminEmail:'',fromName:'SmartQuery Optimizer',bm25K1:'1.5',bm25B:'0.75',alpha:'0.7',crawlAlerts:true,weeklyDigest:false})
  const fileInputRef = useRef<HTMLInputElement>(null)

  const showToast = (msg: string, type: 'ok'|'err'='ok') => {
    setToast({msg,type})
    setTimeout(()=>setToast(null),3500)
  }

  const loadFiles = useCallback(async()=>{
    try{
      const res = await fetch('/api/indices')
      const data = await res.json()
      if(data.files) setFiles(data.files)
    }catch{}
  },[])

  const loadAnalytics = useCallback(async()=>{
    try{
      const res = await fetch('/api/analytics')
      const data = await res.json()
      setAnalytics(data)
    }catch{}
  },[])

  useEffect(()=>{
    const stored = localStorage.getItem('sq_user')
    if(!stored){router.push('/auth/login');return}
    setUser(JSON.parse(stored))
    loadFiles()
    loadAnalytics()
  },[])

  const handleUpload = async(file: File)=>{
    if(!file.name.endsWith('.txt')){showToast('Only .txt files supported','err');return}
    if(file.size>10*1024*1024){showToast('Max file size is 10MB','err');return}
    setUploading(true)
    const fd = new FormData(); fd.append('file',file)
    try{
      const res = await fetch('/api/upload',{method:'POST',body:fd})
      const data = await res.json()
      if(res.ok&&data.ok){
        showToast(`"${data.file.fileName}" indexed — ${fmt(data.file.totalQueries)} queries`)
        await loadFiles(); await loadAnalytics()
        setTab('files')
      } else showToast(data.error||'Upload failed','err')
    }catch{ showToast('Upload failed','err') }
    setUploading(false)
  }

  const handleDelete = async(id: string, name: string)=>{
    try{
      const res = await fetch(`/api/indices/${id}`,{method:'DELETE'})
      if(res.ok){
        setFiles(p=>p.filter(f=>f.id!==id))
        if(expanded?.id===id) setExpanded(null)
        showToast(`"${name}" deleted`)
        loadAnalytics()
      } else showToast('Delete failed','err')
    }catch{ showToast('Delete failed','err') }
  }

  const handleSearch = async(e: React.FormEvent)=>{
    e.preventDefault()
    if(!searchQ.trim()) return
    setSearching(true); setSearchRes([])
    try{
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQ)}`)
      const data = await res.json()
      setSearchRes(data.results||[])
      setSearchLatency(data.latencyMs||0)
      if(!data.results?.length) showToast('No results found','err')
    }catch{ showToast('Search failed','err') }
    setSearching(false)
  }

  const handleViewFull = async(f: any)=>{
    try{
      const res = await fetch(`/api/indices/${f.id}`)
      const data = await res.json()
      setExpanded(data.file||f)
    }catch{ setExpanded(f) }
  }

  const handleSaveSettings = async()=>{
    await fetch('/api/settings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(settings)})
    showToast('Settings saved!')
  }

  const handleLogout = async()=>{
    await fetch('/api/auth/logout',{method:'POST'})
    localStorage.removeItem('sq_user')
    router.push('/')
  }

  const highlight = (text: string, q: string)=>{
    const terms = q.toLowerCase().split(/\s+/).filter(w=>w.length>2)
    let t = text
    terms.forEach(term=>{ t=t.replace(new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`, 'gi'),'<mark>$1</mark>') })
    return t
  }

  const totalWords = files.reduce((s,f)=>s+(f.totalQueries||0),0)
  const totalIssues = files.flatMap(f=>f.slowPatterns||[]).filter(p=>p.impact==='HIGH').length

  const S = {
    sidebar:{width:collapsed?64:228,flexShrink:0,height:'100vh',position:'sticky' as const,top:0,background:'rgba(5,11,24,0.92)',backdropFilter:'blur(20px)',borderRight:'1px solid rgba(0,198,255,0.1)',display:'flex',flexDirection:'column' as const,transition:'width 0.3s ease',overflow:'hidden'},
    main:{flex:1,display:'flex',flexDirection:'column' as const,overflow:'hidden',minWidth:0},
    topbar:{height:64,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 24px',borderBottom:'1px solid rgba(0,198,255,0.1)',background:'rgba(5,11,24,0.85)',backdropFilter:'blur(20px)',flexShrink:0,position:'sticky' as const,top:0,zIndex:20},
    content:{flex:1,overflowY:'auto' as const,padding:24},
  }

  return (
    <div style={{display:'flex',height:'100vh',overflow:'hidden',background:'#050B18'}}>
      {/* Toast */}
      {toast&&(
        <div style={{position:'fixed',top:20,right:20,zIndex:9999,padding:'12px 20px',borderRadius:10,background:toast.type==='ok'?'rgba(0,10,25,0.95)':'rgba(20,0,5,0.95)',border:`1px solid ${toast.type==='ok'?'rgba(0,198,255,0.3)':'rgba(255,23,68,0.3)'}`,color:toast.type==='ok'?'#00E676':'#FF1744',fontFamily:'Outfit',fontSize:14,animation:'slideUp 0.3s ease both',boxShadow:'0 8px 30px rgba(0,0,0,0.4)'}}>
          {toast.type==='ok'?'✓':'✗'} {toast.msg}
        </div>
      )}

      {/* Sidebar */}
      <aside style={S.sidebar}>
        <div style={{height:64,display:'flex',alignItems:'center',padding:collapsed?'0 16px':'0 16px',justifyContent:collapsed?'center':'flex-start',gap:8,borderBottom:'1px solid rgba(0,198,255,0.1)',flexShrink:0}}>
          <Link href="/" style={{display:'flex',alignItems:'center',gap:8,textDecoration:'none',minWidth:0}}>
            <div style={{width:28,height:28,borderRadius:7,background:'linear-gradient(135deg,#00C6FF,#7B2FBE)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/></svg>
            </div>
            {!collapsed&&<span style={{fontFamily:'Syne',fontWeight:700,color:'white',fontSize:14,whiteSpace:'nowrap'}}>SmartQuery</span>}
          </Link>
          {!collapsed&&<button onClick={()=>setCollapsed(true)} style={{marginLeft:'auto',background:'none',border:'none',color:'#7A9CC0',fontSize:18,lineHeight:1}}>‹</button>}
        </div>
        {collapsed&&<button onClick={()=>setCollapsed(false)} style={{background:'none',border:'1px solid rgba(0,198,255,0.2)',color:'#7A9CC0',margin:'8px auto',width:28,height:20,borderRadius:4,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12}}>›</button>}

        <nav style={{flex:1,padding:'8px',overflowY:'auto',display:'flex',flexDirection:'column',gap:2}}>
          {NAV.map(item=>(
            <button key={item.id} onClick={()=>setTab(item.id)}
              style={{display:'flex',alignItems:'center',gap:9,padding:collapsed?'10px':'10px 12px',borderRadius:9,border:'none',background:tab===item.id?'rgba(0,198,255,0.12)':'transparent',color:tab===item.id?'#00C6FF':'#7A9CC0',borderLeft:tab===item.id?'2px solid #00C6FF':'2px solid transparent',fontFamily:'Outfit',fontSize:13,fontWeight:500,justifyContent:collapsed?'center':'flex-start',transition:'all 0.2s',cursor:'none',width:'100%'}}
              title={collapsed?item.l:undefined}>
              <span style={{fontSize:16,flexShrink:0}}>{item.icon}</span>
              {!collapsed&&<span>{item.l}</span>}
            </button>
          ))}
        </nav>

        <div style={{padding:'8px',borderTop:'1px solid rgba(0,198,255,0.1)',flexShrink:0}}>
          {!collapsed&&(
            <div className="card" style={{padding:'12px',marginBottom:8}}>
              <p style={{color:'#7A9CC0',fontSize:11,marginBottom:4}}>Session Files</p>
              <p style={{fontFamily:'Syne',fontWeight:700,color:'white',fontSize:18}}>{files.length}</p>
              <p style={{color:'#7A9CC0',fontSize:11}}>{fmt(totalWords)} queries total</p>
            </div>
          )}
          <button onClick={handleLogout} style={{display:'flex',alignItems:'center',gap:9,padding:collapsed?'10px':'10px 12px',borderRadius:9,border:'none',background:'transparent',color:'#FF6B35',fontFamily:'Outfit',fontSize:13,fontWeight:500,cursor:'none',width:'100%',justifyContent:collapsed?'center':'flex-start',transition:'all 0.2s'}}>
            <span style={{fontSize:16}}>🚪</span>
            {!collapsed&&<span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={S.main}>
        {/* Topbar */}
        <div style={S.topbar}>
          <div>
            <h1 style={{fontFamily:'Syne',fontWeight:700,color:'white',fontSize:18}}>{NAV.find(n=>n.id===tab)?.l}</h1>
            <p style={{color:'#7A9CC0',fontSize:12}}>Welcome back{user?.name?`, ${user.name}`:''} 👋</p>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <button onClick={()=>setTab('upload')} className="btn-p" style={{padding:'8px 18px',borderRadius:10,fontSize:13}}><span>+ Upload File</span></button>
            <div style={{width:34,height:34,borderRadius:'50%',background:'linear-gradient(135deg,#00C6FF,#7B2FBE)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontFamily:'Syne',fontWeight:700,fontSize:14}}>
              {user?.name?.[0]?.toUpperCase()||'U'}
            </div>
          </div>
        </div>

        <div style={S.content}>
          <div style={{maxWidth:1100}}>

          {/* ── OVERVIEW ── */}
          {tab==='overview'&&(
            <div style={{animation:'pageIn 0.3s ease both'}}>
              {/* KPI Cards */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:24}}>
                {[
                  {l:'Total Queries',v:fmt(analytics?.totalQueries||0),sub:'across all files',icon:'🔍',c:'#00C6FF'},
                  {l:'Files Indexed',v:(analytics?.totalFiles||0).toString(),sub:'uploaded this session',icon:'📁',c:'#7B2FBE'},
                  {l:'High-Impact Issues',v:(analytics?.slowCount||0).toString(),sub:'patterns detected',icon:'⚠️',c:'#FF1744'},
                  {l:'Index Terms',v:fmt(analytics?.indexTerms||0),sub:'unique tokens',icon:'🔑',c:'#00E676'},
                ].map(s=>(
                  <div key={s.l} className="card" style={{padding:20}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                      <span style={{fontSize:20}}>{s.icon}</span>
                      <span style={{color:'#7A9CC0',fontSize:12}}>{s.l}</span>
                    </div>
                    <p style={{fontFamily:'Syne',fontWeight:800,fontSize:28,color:s.c,marginBottom:4}}>{s.v}</p>
                    <p style={{color:'#7A9CC0',fontSize:11}}>{s.sub}</p>
                  </div>
                ))}
              </div>

              {files.length===0?(
                <div className="card" style={{padding:64,textAlign:'center'}}>
                  <div style={{fontSize:72,marginBottom:16}}>📤</div>
                  <h3 style={{fontFamily:'Syne',fontWeight:700,fontSize:22,color:'white',marginBottom:10}}>No files indexed yet</h3>
                  <p style={{color:'#7A9CC0',marginBottom:24}}>Upload a .txt file to get real analysis, search, and optimization insights.</p>
                  <button onClick={()=>setTab('upload')} className="btn-p" style={{padding:'12px 28px',borderRadius:10,fontSize:14}}><span>Upload Your First File</span></button>
                </div>
              ):(
                <>
                  {/* Recent files */}
                  <div style={{marginBottom:24}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
                      <h2 style={{fontFamily:'Syne',fontWeight:700,color:'white',fontSize:16}}>Recent Files</h2>
                      <button onClick={()=>setTab('files')} style={{background:'none',border:'none',color:'#00C6FF',fontSize:13}}>View all →</button>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:10}}>
                      {files.slice(0,3).map(f=>(
                        <div key={f.id} className="card" style={{padding:'14px 18px',display:'flex',alignItems:'center',gap:14}}>
                          <div style={{width:36,height:36,borderRadius:8,background:'linear-gradient(135deg,rgba(0,198,255,0.15),rgba(123,47,190,0.15))',border:'1px solid rgba(0,198,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>📄</div>
                          <div style={{flex:1,minWidth:0}}>
                            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:3}}>
                              <p style={{fontFamily:'Syne',fontWeight:600,color:'white',fontSize:14,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.fileName}</p>
                              <span className="badge bs" style={{fontSize:10,flexShrink:0}}>{f.status}</span>
                            </div>
                            <p style={{color:'#7A9CC0',fontSize:12}}>{fmt(f.totalQueries)} queries · {f.uniquePatterns} patterns · {fmtDate(f.uploadedAt)}</p>
                          </div>
                          <div style={{display:'flex',gap:8,flexShrink:0}}>
                            <button onClick={()=>{handleViewFull(f);setTab('files')}} className="btn-o" style={{padding:'6px 14px',borderRadius:7,fontSize:12,border:'1px solid rgba(0,198,255,0.3)'}}>View</button>
                            <button onClick={()=>handleDelete(f.id,f.fileName)} style={{padding:'6px 14px',borderRadius:7,fontSize:12,border:'1px solid rgba(255,23,68,0.25)',background:'transparent',color:'#FF6B35'}}>Delete</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Top keywords */}
                  {analytics?.topKeywords?.length>0&&(
                    <div className="card" style={{padding:20,marginBottom:24}}>
                      <h3 style={{fontFamily:'Syne',fontWeight:700,color:'white',fontSize:15,marginBottom:14}}>🔑 Top Keywords Across All Files</h3>
                      <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
                        {analytics.topKeywords.slice(0,18).map((k:any)=>(
                          <button key={k.word} onClick={()=>{setSearchQ(k.word);setTab('search')}}
                            className="badge bp" style={{fontSize:13,padding:'6px 14px',border:'1px solid rgba(0,198,255,0.2)'}}>
                            {k.word} <span style={{opacity:0.55,marginLeft:4}}>×{k.freq}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actionable insights */}
                  {analytics?.allSuggestions?.length>0&&(
                    <div className="card" style={{padding:20}}>
                      <h3 style={{fontFamily:'Syne',fontWeight:700,color:'white',fontSize:15,marginBottom:14}}>💡 Actionable Insights</h3>
                      <div style={{display:'flex',flexDirection:'column',gap:10}}>
                        {analytics.allSuggestions.map((s:string,i:number)=>(
                          <div key={i} style={{display:'flex',gap:10,padding:'10px 14px',borderRadius:8,background:'rgba(0,198,255,0.04)',border:'1px solid rgba(0,198,255,0.08)'}}>
                            <span style={{color:'#00C6FF',flexShrink:0}}>→</span>
                            <p style={{color:'#7A9CC0',fontSize:13,lineHeight:1.5}}>{s}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── UPLOAD ── */}
          {tab==='upload'&&(
            <div style={{animation:'pageIn 0.3s ease both'}}>
              <input ref={fileInputRef} type="file" accept=".txt" style={{display:'none'}} onChange={e=>{const f=e.target.files?.[0];if(f)handleUpload(f);e.target.value=''}}/>
              <div
                onDragOver={e=>{e.preventDefault();setDragOver(true)}}
                onDragLeave={()=>setDragOver(false)}
                onDrop={e=>{e.preventDefault();setDragOver(false);const f=e.dataTransfer.files[0];if(f)handleUpload(f)}}
                onClick={()=>!uploading&&fileInputRef.current?.click()}
                className="card"
                style={{padding:72,textAlign:'center',marginBottom:24,border:`2px dashed ${dragOver?'#00C6FF':'rgba(0,198,255,0.2)'}`,background:dragOver?'rgba(0,198,255,0.04)':'',transition:'all 0.3s',cursor:'none'}}>
                <div style={{fontSize:64,marginBottom:14}}>{uploading?'⏳':'📤'}</div>
                <h2 style={{fontFamily:'Syne',fontWeight:700,fontSize:26,color:'white',marginBottom:8}}>{uploading?'Indexing file…':'Upload a .txt File'}</h2>
                <p style={{color:'#7A9CC0',marginBottom:24,maxWidth:480,margin:'0 auto 24px'}}>
                  {uploading?'Building inverted index, applying 10 detection rules, extracting keywords…':'Drag & drop or click. Max 10MB. SQL queries, search logs, API calls — any line-delimited text.'}
                </p>
                {!uploading&&(
                  <div className="btn-p" style={{display:'inline-flex',padding:'12px 28px',borderRadius:10,fontSize:14}}>
                    <span>Choose File</span>
                  </div>
                )}
                {uploading&&<div style={{display:'flex',justifyContent:'center'}}><div style={{width:32,height:32,border:'3px solid rgba(0,198,255,0.3)',borderTopColor:'#00C6FF',borderRadius:'50%',animation:'spin 1s linear infinite'}}/></div>}
              </div>

              {/* Feature cards */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:24}}>
                {[{icon:'🔍',t:'BM25 Search',d:'Real inverted index built instantly. Search results ranked by term frequency × inverse document frequency.'},
                  {icon:'⚡',t:'10 SQL Rules',d:'SELECT *, leading LIKE %, missing WHERE, N+1, OR vs IN, ORDER BY, stopwords, JOINs, long queries, boolean misuse.'},
                  {icon:'📊',t:'Real Analytics',d:'Category distribution, top keywords with frequencies, vocabulary richness, query length stats — all from your file.'}
                ].map(f=>(
                  <div key={f.t} className="card" style={{padding:20}}>
                    <div style={{fontSize:30,marginBottom:10}}>{f.icon}</div>
                    <h3 style={{fontFamily:'Syne',fontWeight:700,color:'white',fontSize:15,marginBottom:6}}>{f.t}</h3>
                    <p style={{color:'#7A9CC0',fontSize:13,lineHeight:1.6}}>{f.d}</p>
                  </div>
                ))}
              </div>

              {/* Example formats */}
              <div className="card" style={{padding:20}}>
                <h3 style={{fontFamily:'Syne',fontWeight:700,color:'white',fontSize:15,marginBottom:14}}>📋 Example File Formats</h3>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                  <div className="term">
                    <div className="th"><div className="td" style={{background:'#ff5f56'}}/><div className="td" style={{background:'#ffbd2e'}}/><div className="td" style={{background:'#27c93f'}}/><span style={{color:'#7A9CC0',fontSize:11,marginLeft:8}}>sql_queries.txt</span></div>
                    <pre style={{padding:14,fontSize:11,lineHeight:1.7,margin:0,color:'#00E676'}}>{`SELECT * FROM users
SELECT id FROM orders WHERE user_id = 123
SELECT * FROM products WHERE name LIKE '%phone%'
UPDATE users SET status = 1 WHERE id IN (1,2,3)
SELECT * FROM logs ORDER BY created_at DESC
DELETE FROM sessions WHERE expired = 1`}</pre>
                  </div>
                  <div className="term">
                    <div className="th"><div className="td" style={{background:'#ff5f56'}}/><div className="td" style={{background:'#ffbd2e'}}/><div className="td" style={{background:'#27c93f'}}/><span style={{color:'#7A9CC0',fontSize:11,marginLeft:8}}>search_log.txt</span></div>
                    <pre style={{padding:14,fontSize:11,lineHeight:1.7,margin:0,color:'#00E676'}}>{`machine learning tutorials 2025
how to optimize SQL queries
best distributed systems books
the a is are in the
next.js vs remix performance
buy iphone 15 pro cheap
what is transformer architecture`}</pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── FILES ── */}
          {tab==='files'&&(
            <div style={{animation:'pageIn 0.3s ease both'}}>
              {files.length===0?(
                <div className="card" style={{padding:64,textAlign:'center'}}>
                  <div style={{fontSize:56,marginBottom:14}}>📁</div>
                  <h3 style={{fontFamily:'Syne',fontWeight:700,fontSize:20,color:'white',marginBottom:10}}>No files yet</h3>
                  <button onClick={()=>setTab('upload')} className="btn-p" style={{padding:'11px 24px',borderRadius:10,fontSize:14}}><span>Upload File</span></button>
                </div>
              ):(
                <div style={{display:'flex',flexDirection:'column',gap:16}}>
                  {files.map(f=>(
                    <div key={f.id} className="card" style={{padding:24}}>
                      {/* Header */}
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:16}}>
                        <div style={{display:'flex',gap:12,alignItems:'center'}}>
                          <div style={{width:40,height:40,borderRadius:10,background:'linear-gradient(135deg,rgba(0,198,255,0.15),rgba(123,47,190,0.15))',border:'1px solid rgba(0,198,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>📄</div>
                          <div>
                            <h3 style={{fontFamily:'Syne',fontWeight:700,color:'white',fontSize:16}}>{f.fileName}</h3>
                            <p style={{color:'#7A9CC0',fontSize:12}}>{fmtDate(f.uploadedAt)} · {(f.sizeBytes/1024).toFixed(1)}KB</p>
                          </div>
                        </div>
                        <span className="badge bs" style={{fontSize:11}}>{f.status}</span>
                      </div>

                      {/* Stats grid */}
                      <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:10,marginBottom:16}}>
                        {[['Queries',fmt(f.totalQueries)],['Patterns',f.uniquePatterns],['Avg Len',f.avgLength+'ch'],['Min Len',f.minLength+'ch'],['Max Len',f.maxLength+'ch'],['Issues',f.slowPatterns?.length||0]].map(([l,v])=>(
                          <div key={l} style={{textAlign:'center',padding:'10px 8px',borderRadius:8,background:'rgba(0,198,255,0.04)',border:'1px solid rgba(0,198,255,0.06)'}}>
                            <p style={{color:'#7A9CC0',fontSize:10,marginBottom:3}}>{l}</p>
                            <p style={{fontFamily:'Syne',fontWeight:700,color:'white',fontSize:15}}>{v}</p>
                          </div>
                        ))}
                      </div>

                      {/* Top keywords */}
                      {f.topKeywords?.length>0&&(
                        <div style={{marginBottom:14}}>
                          <p style={{color:'#7A9CC0',fontSize:11,marginBottom:7,textTransform:'uppercase',letterSpacing:'0.05em'}}>Top Keywords</p>
                          <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                            {f.topKeywords.map((k:any)=>(
                              <span key={k.word} className="badge bp" style={{fontSize:11}}>{k.word} <span style={{opacity:0.55}}>×{k.freq}</span></span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Slow patterns preview */}
                      {f.slowPatterns?.length>0&&(
                        <div style={{marginBottom:16,background:'rgba(0,0,0,0.2)',border:'1px solid rgba(0,198,255,0.06)',borderRadius:10,padding:14}}>
                          <p style={{color:'#7A9CC0',fontSize:11,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.05em'}}>⚡ Issues Detected ({f.slowPatterns.length})</p>
                          <div style={{display:'flex',flexDirection:'column',gap:8}}>
                            {f.slowPatterns.slice(0,4).map((p:any,i:number)=>(
                              <div key={i} style={{display:'flex',gap:10,alignItems:'flex-start'}}>
                                <span style={{background:IMPACT_BG[p.impact],border:`1px solid ${IMPACT_COLOR[p.impact]}40`,color:IMPACT_COLOR[p.impact],padding:'2px 7px',borderRadius:4,fontSize:10,fontWeight:600,flexShrink:0}}>{p.impact}</span>
                                <div style={{minWidth:0}}>
                                  <p style={{color:'white',fontSize:13,fontWeight:600}}>{p.pattern} <span style={{color:'#7A9CC0',fontWeight:400}}>×{p.count}</span></p>
                                  <p style={{color:'#7A9CC0',fontSize:11}}>{p.suggestion}</p>
                                  <p style={{color:'#00E676',fontSize:11,fontFamily:'JetBrains Mono',marginTop:2}}>Fix: {p.fix.substring(0,80)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Categories */}
                      {f.categories?.length>0&&(
                        <div style={{marginBottom:16}}>
                          <p style={{color:'#7A9CC0',fontSize:11,marginBottom:7,textTransform:'uppercase',letterSpacing:'0.05em'}}>Categories</p>
                          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                            {f.categories.map((c:any)=>(
                              <span key={c.name} style={{padding:'4px 10px',borderRadius:6,background:'rgba(123,47,190,0.15)',border:'1px solid rgba(123,47,190,0.2)',color:'#A855F7',fontSize:12}}>
                                {c.name} {c.pct}%
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Duplicates */}
                      {f.duplicates?.length>0&&(
                        <div style={{marginBottom:16,background:'rgba(255,214,0,0.04)',border:'1px solid rgba(255,214,0,0.15)',borderRadius:8,padding:12}}>
                          <p style={{color:'#FFD600',fontSize:11,fontWeight:600,marginBottom:6}}>💡 Caching Opportunities — {f.duplicates.length} duplicate patterns</p>
                          {f.duplicates.slice(0,3).map((d:string,i:number)=>(
                            <p key={i} style={{color:'#7A9CC0',fontSize:11,fontFamily:'JetBrains Mono',marginBottom:2}}>{d}</p>
                          ))}
                          {f.duplicates.length>3&&<p style={{color:'#7A9CC0',fontSize:11,marginTop:4}}>…and {f.duplicates.length-3} more</p>}
                        </div>
                      )}

                      {/* Actions */}
                      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                        <button onClick={()=>handleViewFull(f)} className="btn-p" style={{padding:'9px 18px',borderRadius:9,fontSize:13}}><span>📊 Full Report</span></button>
                        <button onClick={()=>{setSearchQ(f.topKeywords?.[0]?.word||'');setTab('search')}} className="btn-o" style={{padding:'9px 18px',borderRadius:9,fontSize:13,border:'1px solid rgba(0,198,255,0.3)'}}>🔍 Search</button>
                        <button onClick={()=>handleDelete(f.id,f.fileName)} style={{padding:'9px 18px',borderRadius:9,border:'1px solid rgba(255,23,68,0.25)',background:'transparent',color:'#FF6B35',fontSize:13,fontFamily:'Syne',fontWeight:600}}>🗑️ Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── SEARCH ── */}
          {tab==='search'&&(
            <div style={{animation:'pageIn 0.3s ease both'}}>
              <form onSubmit={handleSearch} style={{marginBottom:20}}>
                <div className="sbar" style={{borderRadius:12,display:'flex',alignItems:'center',padding:'12px 18px',gap:12}}>
                  <svg style={{width:18,height:18,color:'#00C6FF',flexShrink:0}} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/></svg>
                  <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} className="inp" style={{flex:1,background:'transparent',border:'none',boxShadow:'none',padding:0,fontSize:14}} placeholder="Search across all indexed files with BM25…"/>
                  {searchQ&&<button type="button" onClick={()=>{setSearchQ('');setSearchRes([])}} style={{background:'none',border:'none',color:'#7A9CC0',fontSize:20,lineHeight:1}}>×</button>}
                  <button type="submit" disabled={searching} className="btn-p" style={{padding:'8px 20px',borderRadius:9,fontSize:13,opacity:searching?0.6:1,flexShrink:0}}><span>{searching?'…':'Search'}</span></button>
                </div>
              </form>

              {files.length===0&&(
                <div className="card" style={{padding:48,textAlign:'center'}}>
                  <div style={{fontSize:48,marginBottom:12}}>📤</div>
                  <p style={{color:'#7A9CC0',marginBottom:16}}>Upload files first to enable BM25 search.</p>
                  <button onClick={()=>setTab('upload')} className="btn-p" style={{padding:'10px 22px',borderRadius:9,fontSize:13}}><span>Upload File</span></button>
                </div>
              )}

              {searching&&(
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  {[...Array(3)].map((_,i)=>(
                    <div key={i} className="card" style={{padding:18,display:'flex',flexDirection:'column',gap:8}}>
                      <div className="shimmer" style={{height:13,borderRadius:5,width:'65%'}}/>
                      <div className="shimmer" style={{height:11,borderRadius:5,width:'90%'}}/>
                    </div>
                  ))}
                </div>
              )}

              {!searching&&searchRes.length>0&&(
                <div>
                  <p style={{color:'#7A9CC0',fontSize:12,marginBottom:14}}>
                    <strong style={{color:'#00C6FF'}}>{searchRes.length}</strong> results for "<strong style={{color:'white'}}>{searchQ}</strong>" — {searchLatency}ms (BM25)
                  </p>
                  <div style={{display:'flex',flexDirection:'column',gap:10}}>
                    {searchRes.map((r,i)=>(
                      <div key={i} className="card" style={{padding:18,animation:`slideUp 0.3s ease ${i*0.05}s both`}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                          <div style={{display:'flex',alignItems:'center',gap:8}}>
                            <span style={{fontSize:16}}>📄</span>
                            <span style={{fontFamily:'Syne',fontWeight:600,color:'#00C6FF',fontSize:14}}>{r.fileName}</span>
                          </div>
                          <div style={{display:'flex',gap:8}}>
                            <span className="badge bp" style={{fontSize:11}}>BM25: {r.score}</span>
                            <span style={{color:'#7A9CC0',fontSize:11}}>{r.matches} terms</span>
                          </div>
                        </div>
                        <p style={{color:'#7A9CC0',fontSize:13,lineHeight:1.6}}
                          dangerouslySetInnerHTML={{__html:highlight(r.excerpt.substring(0,220),searchQ)}}/>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!searching&&searchQ&&searchRes.length===0&&files.length>0&&(
                <div style={{textAlign:'center',padding:'48px 20px'}}>
                  <div style={{fontSize:48,marginBottom:10}}>😕</div>
                  <p style={{color:'#7A9CC0'}}>No results for "<strong style={{color:'white'}}>{searchQ}</strong>"</p>
                </div>
              )}

              {!searching&&!searchQ&&files.length>0&&(
                <div style={{textAlign:'center',padding:'32px 20px'}}>
                  <p style={{color:'#7A9CC0',marginBottom:14}}>Search across {files.length} indexed file{files.length!==1?'s':''}. Try:</p>
                  <div style={{display:'flex',gap:8,justifyContent:'center',flexWrap:'wrap'}}>
                    {['SELECT *','machine learning','JOIN','LIKE %','optimize','duplicate'].map(s=>(
                      <button key={s} onClick={()=>setSearchQ(s)} className="badge bp" style={{fontSize:13,padding:'7px 14px'}}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── ANALYTICS ── */}
          {tab==='analytics'&&(
            <div style={{animation:'pageIn 0.3s ease both',display:'flex',flexDirection:'column',gap:20}}>
              {/* Top KPIs */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14}}>
                {[
                  {l:'Total Queries',v:fmt(analytics?.totalQueries||0),icon:'🔍',c:'#00C6FF'},
                  {l:'Files Indexed',v:(analytics?.totalFiles||0).toString(),icon:'📁',c:'#7B2FBE'},
                  {l:'Searches Run',v:(analytics?.totalSearches||0).toString(),icon:'⚡',c:'#00E676'},
                  {l:'High Issues',v:(analytics?.slowCount||0).toString(),icon:'⚠️',c:'#FF1744'},
                ].map(s=>(
                  <div key={s.l} className="card" style={{padding:18}}>
                    <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:8}}><span style={{fontSize:18}}>{s.icon}</span><span style={{color:'#7A9CC0',fontSize:11}}>{s.l}</span></div>
                    <p style={{fontFamily:'Syne',fontWeight:800,fontSize:26,color:s.c}}>{s.v}</p>
                  </div>
                ))}
              </div>

              {files.length===0?(
                <div className="card" style={{padding:40,textAlign:'center'}}>
                  <p style={{color:'#7A9CC0'}}>Upload files to see analytics.</p>
                </div>
              ):(
                <>
                  {/* Category breakdown */}
                  {analytics?.categorySummary?.length>0&&(
                    <div className="card" style={{padding:20}}>
                      <h3 style={{fontFamily:'Syne',fontWeight:700,color:'white',fontSize:15,marginBottom:14}}>Query Category Distribution</h3>
                      <div style={{display:'flex',flexDirection:'column',gap:10}}>
                        {analytics.categorySummary.map((c:any)=>{
                          const total = analytics.categorySummary.reduce((s:number,x:any)=>s+x.count,0)
                          const pct = Math.round(c.count/Math.max(1,total)*100)
                          return (
                            <div key={c.name} style={{display:'flex',alignItems:'center',gap:12}}>
                              <span style={{color:'white',fontSize:13,width:120,flexShrink:0}}>{c.name}</span>
                              <div className="pbar" style={{flex:1,height:8}}>
                                <div className="pfill" style={{width:`${pct}%`}}/>
                              </div>
                              <span style={{color:'#7A9CC0',fontSize:12,width:60,textAlign:'right',flexShrink:0}}>{c.count} ({pct}%)</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* File comparison */}
                  <div className="card" style={{padding:20}}>
                    <h3 style={{fontFamily:'Syne',fontWeight:700,color:'white',fontSize:15,marginBottom:14}}>File Overview</h3>
                    <div style={{display:'flex',flexDirection:'column',gap:10}}>
                      {files.map(f=>(
                        <div key={f.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:8,background:'rgba(0,198,255,0.03)',border:'1px solid rgba(0,198,255,0.06)'}}>
                          <span style={{fontSize:16}}>📄</span>
                          <div style={{flex:1,minWidth:0}}>
                            <p style={{color:'white',fontSize:13,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.fileName}</p>
                            <p style={{color:'#7A9CC0',fontSize:11}}>{fmt(f.totalQueries)} queries · {f.uniquePatterns} patterns · {f.slowPatterns?.length||0} issues</p>
                          </div>
                          <div style={{display:'flex',gap:4}}>
                            {f.slowPatterns?.slice(0,3).map((p:any,i:number)=>(
                              <span key={i} style={{width:8,height:8,borderRadius:'50%',background:IMPACT_COLOR[p.impact],display:'inline-block'}} title={p.impact}/>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* All optimization issues */}
                  {files.some(f=>f.slowPatterns?.length)&&(
                    <div className="card" style={{padding:20}}>
                      <h3 style={{fontFamily:'Syne',fontWeight:700,color:'white',fontSize:15,marginBottom:14}}>⚡ All Optimization Issues</h3>
                      <div style={{display:'flex',flexDirection:'column',gap:10}}>
                        {files.flatMap(f=>(f.slowPatterns||[]).map((p:any)=>({...p,file:f.fileName}))).sort((a:any,b:any)=>({HIGH:0,MEDIUM:1,LOW:2}[a.impact]-{HIGH:0,MEDIUM:1,LOW:2}[b.impact])).map((p:any,i:number)=>(
                          <div key={i} style={{display:'flex',gap:10,padding:'12px 14px',borderRadius:8,background:'rgba(0,0,0,0.2)',border:'1px solid rgba(0,198,255,0.05)'}}>
                            <span style={{background:IMPACT_BG[p.impact],border:`1px solid ${IMPACT_COLOR[p.impact]}40`,color:IMPACT_COLOR[p.impact],padding:'3px 8px',borderRadius:4,fontSize:11,fontWeight:600,flexShrink:0,height:'fit-content'}}>{p.impact}</span>
                            <div style={{flex:1,minWidth:0}}>
                              <div style={{display:'flex',gap:6,alignItems:'center',marginBottom:3,flexWrap:'wrap'}}>
                                <p style={{color:'white',fontSize:13,fontWeight:600}}>{p.pattern}</p>
                                <span style={{color:'#7A9CC0',fontSize:11}}>in {p.file}</span>
                                <span className="badge bp" style={{fontSize:10}}>×{p.count}</span>
                              </div>
                              <p style={{color:'#7A9CC0',fontSize:12,marginBottom:3}}>{p.suggestion}</p>
                              <p style={{color:'#00E676',fontSize:11,fontFamily:'JetBrains Mono'}}>→ {p.fix}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent search log */}
                  {analytics?.recentLogs?.length>0&&(
                    <div className="card" style={{padding:20}}>
                      <h3 style={{fontFamily:'Syne',fontWeight:700,color:'white',fontSize:15,marginBottom:14}}>Recent Activity Log</h3>
                      <div style={{display:'flex',flexDirection:'column',gap:6}}>
                        {analytics.recentLogs.slice(0,10).map((l:any,i:number)=>(
                          <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'8px 12px',borderRadius:7,background:'rgba(0,0,0,0.15)'}}>
                            <span style={{color:'#7A9CC0',fontSize:11,flexShrink:0}}>{fmtDate(l.ts)}</span>
                            <span style={{color:'white',fontSize:12,flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.query}</span>
                            <span style={{color:'#7A9CC0',fontSize:11,flexShrink:0}}>{l.latencyMs}ms</span>
                            <span className={l.success?'badge bs':'badge be'} style={{fontSize:10,flexShrink:0}}>{l.success?'✓ OK':'✗ Err'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── SETTINGS ── */}
          {tab==='settings'&&(
            <div style={{animation:'pageIn 0.3s ease both',display:'flex',flexDirection:'column',gap:18}}>
              {/* Profile */}
              <div className="card" style={{padding:24}}>
                <h2 style={{fontFamily:'Syne',fontWeight:700,color:'white',fontSize:17,marginBottom:18}}>Profile</h2>
                <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:20}}>
                  <div style={{width:56,height:56,borderRadius:'50%',background:'linear-gradient(135deg,#00C6FF,#7B2FBE)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontFamily:'Syne',fontWeight:700,fontSize:22}}>{user?.name?.[0]?.toUpperCase()||'U'}</div>
                  <div><p style={{fontFamily:'Syne',fontWeight:700,color:'white',fontSize:17}}>{user?.name||'User'}</p><p style={{color:'#7A9CC0',fontSize:13}}>{user?.email||''}</p></div>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                  {['Name','Email'].map(f=>(
                    <div key={f}>
                      <label style={{display:'block',color:'#7A9CC0',fontSize:11,fontWeight:500,marginBottom:5}}>{f}</label>
                      <input type={f==='Email'?'email':'text'} defaultValue={f==='Name'?user?.name:user?.email} className="inp" style={{width:'100%',padding:'10px 14px',borderRadius:9,fontSize:13}}/>
                    </div>
                  ))}
                </div>
                <button onClick={()=>showToast('Profile updated!')} className="btn-p" style={{marginTop:14,padding:'9px 22px',borderRadius:9,fontSize:13}}><span>Save Profile</span></button>
              </div>

              {/* Email */}
              <div className="card" style={{padding:24}}>
                <h2 style={{fontFamily:'Syne',fontWeight:700,color:'white',fontSize:17,marginBottom:18}}>Email Notifications (Resend)</h2>
                <div style={{background:'rgba(0,198,255,0.05)',border:'1px solid rgba(0,198,255,0.15)',borderRadius:8,padding:'12px 16px',marginBottom:16}}>
                  <p style={{color:'#7A9CC0',fontSize:12,lineHeight:1.6}}>
                    Add your <strong style={{color:'#00C6FF'}}>Resend API key</strong> and Gmail below. Contact form submissions will be delivered to your Gmail automatically.
                    Get your key from <a href="https://resend.com/api-keys" target="_blank" rel="noreferrer" style={{color:'#00C6FF',textDecoration:'none'}}>resend.com/api-keys</a>
                  </p>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:14}}>
                  <div>
                    <label style={{display:'block',color:'#7A9CC0',fontSize:11,fontWeight:500,marginBottom:5}}>Resend API Key</label>
                    <input type="password" value={settings.resendKey} onChange={e=>setSettings(p=>({...p,resendKey:e.target.value}))} className="inp" style={{width:'100%',padding:'10px 14px',borderRadius:9,fontSize:13,fontFamily:'JetBrains Mono'}} placeholder="re_xxxxxxxxxxxx"/>
                  </div>
                  <div>
                    <label style={{display:'block',color:'#7A9CC0',fontSize:11,fontWeight:500,marginBottom:5}}>Admin Gmail (receives notifications)</label>
                    <input type="email" value={settings.adminEmail} onChange={e=>setSettings(p=>({...p,adminEmail:e.target.value}))} className="inp" style={{width:'100%',padding:'10px 14px',borderRadius:9,fontSize:13}} placeholder="your@gmail.com"/>
                  </div>
                  <div>
                    <label style={{display:'block',color:'#7A9CC0',fontSize:11,fontWeight:500,marginBottom:5}}>From Name</label>
                    <input type="text" value={settings.fromName} onChange={e=>setSettings(p=>({...p,fromName:e.target.value}))} className="inp" style={{width:'100%',padding:'10px 14px',borderRadius:9,fontSize:13}}/>
                  </div>
                </div>
              </div>

              {/* Notifications */}
              <div className="card" style={{padding:24}}>
                <h2 style={{fontFamily:'Syne',fontWeight:700,color:'white',fontSize:17,marginBottom:14}}>Notifications</h2>
                {[['crawlAlerts','Index completion alerts','Notify when file finishes indexing'],['weeklyDigest','Weekly digest','Summary of search activity every Monday']].map(([k,l,d])=>(
                  <div key={k} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 0',borderBottom:'1px solid rgba(0,198,255,0.06)'}}>
                    <button onClick={()=>setSettings(p=>({...p,[k]:!p[k as keyof typeof p]}))}
                      style={{width:38,height:20,borderRadius:10,border:'none',background:settings[k as keyof typeof settings]?'#00C6FF':'rgba(122,156,192,0.3)',position:'relative',flexShrink:0,transition:'all 0.3s'}}>
                      <span style={{position:'absolute',top:2,width:16,height:16,borderRadius:'50%',background:'white',transition:'all 0.3s',left:settings[k as keyof typeof settings]?20:2}}/>
                    </button>
                    <div><p style={{color:'white',fontSize:13,fontWeight:500}}>{l}</p><p style={{color:'#7A9CC0',fontSize:11}}>{d}</p></div>
                  </div>
                ))}
              </div>

              {/* BM25 params */}
              <div className="card" style={{padding:24}}>
                <h2 style={{fontFamily:'Syne',fontWeight:700,color:'white',fontSize:17,marginBottom:14}}>BM25 Ranking Parameters</h2>
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14}}>
                  {[['alpha','BM25 Weight (α)','0.7'],['bm25K1','k1 (term saturation)','1.5'],['bm25B','b (length norm)','0.75']].map(([k,l,_])=>(
                    <div key={k}>
                      <label style={{display:'block',color:'#7A9CC0',fontSize:11,fontWeight:500,marginBottom:5}}>{l}</label>
                      <input type="number" step="0.05" value={String(settings[k as keyof typeof settings])} onChange={e=>setSettings(p=>({...p,[k]:e.target.value}))} className="inp" style={{width:'100%',padding:'10px 14px',borderRadius:9,fontSize:13,fontFamily:'JetBrains Mono'}}/>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{display:'flex',gap:12}}>
                <button onClick={handleSaveSettings} className="btn-p" style={{padding:'11px 26px',borderRadius:10,fontSize:14}}><span>💾 Save All Settings</span></button>
                <button onClick={()=>showToast('Use delete buttons in My Files tab.','err')} style={{padding:'11px 20px',borderRadius:10,border:'1px solid rgba(255,23,68,0.25)',background:'transparent',color:'#FF6B35',fontSize:13,fontFamily:'Syne',fontWeight:600}}>🗑️ Clear Session Data</button>
              </div>
            </div>
          )}

          </div>
        </div>
      </main>

      {/* Full Report Modal */}
      {expanded&&(
        <div style={{position:'fixed',inset:0,zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',padding:16,animation:'fadeIn 0.2s ease both'}}>
          <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.75)',backdropFilter:'blur(8px)'}} onClick={()=>setExpanded(null)}/>
          <div style={{position:'relative',width:'100%',maxWidth:680,maxHeight:'85vh',overflowY:'auto',background:'rgba(10,22,48,0.97)',border:'1px solid rgba(0,198,255,0.2)',borderRadius:18,boxShadow:'0 20px 80px rgba(0,0,0,0.6)',animation:'scaleIn 0.22s ease both'}}>
            {/* Sticky header */}
            <div style={{position:'sticky',top:0,background:'rgba(10,22,48,0.98)',backdropFilter:'blur(20px)',display:'flex',justifyContent:'space-between',alignItems:'center',padding:'16px 24px',borderBottom:'1px solid rgba(0,198,255,0.1)',zIndex:10}}>
              <div>
                <h2 style={{fontFamily:'Syne',fontWeight:700,color:'white',fontSize:17}}>{expanded.fileName}</h2>
                <p style={{color:'#7A9CC0',fontSize:12}}>{fmtDate(expanded.uploadedAt||expanded.createdAt||'')} · {((expanded.sizeBytes||0)/1024).toFixed(1)}KB</p>
              </div>
              <button onClick={()=>setExpanded(null)} style={{width:32,height:32,borderRadius:8,background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.08)',color:'#7A9CC0',fontSize:18,display:'flex',alignItems:'center',justifyContent:'center'}}>✕</button>
            </div>

            <div style={{padding:24,display:'flex',flexDirection:'column',gap:20}}>
              {/* Stats */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
                {[['Total Queries',fmt(expanded.totalQueries||0)],['Unique Patterns',expanded.uniquePatterns||0],['Issues Found',expanded.slowPatterns?.length||0],['Avg Length',(expanded.avgLength||0)+'ch'],['Min Length',(expanded.minLength||0)+'ch'],['Max Length',(expanded.maxLength||0)+'ch']].map(([l,v])=>(
                  <div key={l} style={{textAlign:'center',padding:'12px 8px',borderRadius:8,background:'rgba(0,198,255,0.04)',border:'1px solid rgba(0,198,255,0.07)'}}>
                    <p style={{color:'#7A9CC0',fontSize:11,marginBottom:4}}>{l}</p>
                    <p style={{fontFamily:'Syne',fontWeight:700,color:'white',fontSize:16}}>{v}</p>
                  </div>
                ))}
              </div>

              {/* Keywords */}
              {expanded.topKeywords?.length>0&&(
                <div>
                  <p style={{color:'#7A9CC0',fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:10}}>Top 12 Keywords</p>
                  <div style={{display:'flex',flexDirection:'column',gap:7}}>
                    {expanded.topKeywords.map((k:any,i:number)=>(
                      <div key={k.word} style={{display:'flex',alignItems:'center',gap:10}}>
                        <span style={{color:'#7A9CC0',fontSize:11,width:18,fontFamily:'JetBrains Mono'}}>{i+1}</span>
                        <span style={{color:'white',fontSize:13,flex:1}}>{k.word}</span>
                        <div className="pbar" style={{width:100,height:5}}>
                          <div className="pfill" style={{width:`${Math.min(100,Math.round(k.freq/(expanded.topKeywords[0]?.freq||1)*100))}%`}}/>
                        </div>
                        <span style={{color:'#7A9CC0',fontSize:11,width:30,textAlign:'right',fontFamily:'JetBrains Mono'}}>{k.freq}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* All slow patterns */}
              {expanded.slowPatterns?.length>0&&(
                <div>
                  <p style={{color:'#7A9CC0',fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:10}}>All Issues ({expanded.slowPatterns.length})</p>
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    {expanded.slowPatterns.map((p:any,i:number)=>(
                      <div key={i} style={{padding:'12px 14px',borderRadius:8,background:'rgba(0,0,0,0.25)',border:'1px solid rgba(0,198,255,0.06)'}}>
                        <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:6}}>
                          <span style={{background:IMPACT_BG[p.impact],border:`1px solid ${IMPACT_COLOR[p.impact]}40`,color:IMPACT_COLOR[p.impact],padding:'2px 8px',borderRadius:4,fontSize:10,fontWeight:600}}>{p.impact}</span>
                          <span style={{color:'white',fontSize:13,fontWeight:600}}>{p.pattern}</span>
                          <span style={{color:'#7A9CC0',fontSize:11}}>×{p.count}</span>
                        </div>
                        <p style={{color:'#7A9CC0',fontSize:12,marginBottom:4}}>{p.suggestion}</p>
                        <p style={{color:'#00E676',fontSize:11,fontFamily:'JetBrains Mono',marginBottom:4}}>→ {p.fix}</p>
                        {p.example&&<p style={{color:'#7A9CC0',fontSize:10,fontFamily:'JetBrains Mono',opacity:0.6,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>e.g. {p.example}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Duplicates */}
              {expanded.duplicates?.length>0&&(
                <div style={{background:'rgba(255,214,0,0.05)',border:'1px solid rgba(255,214,0,0.15)',borderRadius:8,padding:14}}>
                  <p style={{color:'#FFD600',fontSize:11,fontWeight:600,marginBottom:8}}>💡 {expanded.duplicates.length} Caching Opportunities</p>
                  {expanded.duplicates.map((d:string,i:number)=>(
                    <p key={i} style={{color:'#7A9CC0',fontSize:11,fontFamily:'JetBrains Mono',marginBottom:3}}>{d}</p>
                  ))}
                </div>
              )}

              {/* Suggestions */}
              {expanded.suggestions?.length>0&&(
                <div>
                  <p style={{color:'#7A9CC0',fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:10}}>Actionable Suggestions</p>
                  {expanded.suggestions.map((s:string,i:number)=>(
                    <div key={i} style={{display:'flex',gap:8,padding:'8px 12px',borderRadius:7,background:'rgba(0,198,255,0.04)',border:'1px solid rgba(0,198,255,0.07)',marginBottom:6}}>
                      <span style={{color:'#00C6FF',flexShrink:0}}>→</span>
                      <p style={{color:'#7A9CC0',fontSize:12,lineHeight:1.5}}>{s}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div style={{display:'flex',gap:10,paddingTop:4}}>
                <button onClick={()=>{setSearchQ(expanded.topKeywords?.[0]?.word||'');setTab('search');setExpanded(null)}} className="btn-p" style={{padding:'10px 20px',borderRadius:9,fontSize:13}}><span>🔍 Search This File</span></button>
                <button onClick={()=>{handleDelete(expanded.id,expanded.fileName);setExpanded(null)}} style={{padding:'10px 18px',borderRadius:9,border:'1px solid rgba(255,23,68,0.25)',background:'transparent',color:'#FF6B35',fontSize:13,fontFamily:'Syne',fontWeight:600}}>🗑️ Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
